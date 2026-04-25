"use client";

import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  startAfter,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
  Query,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { firestore } from "@/firebase/client";
import { DailyAccount } from "@/types/daily-account";
import { normalizeDailyAccount } from "@/lib/server-utils";
import { FirestoreFilter } from "@/types/filters";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";

/**
 * usePaginatedFirestore
 *
 * Supports external page state for router/URL sync and direct jumps.
 *
 * Usage:
 *   const [page, setPage] = useState(routerPageFromQuery);
 *   const { data, ... } = usePaginatedFirestore({
 *     collectionPath, pageSize, filters, orderByField, orderByDirection,
 *     externalPage: page, setExternalPage: setPage
 *   });
 *   // Sync page <-> router query param
 */
type UsePaginatedFirestoreOptions = {
  collectionPath: string;
  pageSize?: number;
  filters?: FirestoreFilter[];
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
  externalPage?: number;
  setExternalPage?: (page: number) => void;
};

type CachedPageEntry = {
  createdAt: number;
  data: DailyAccount[];
  hasMore: boolean;
  lastCursor: QueryDocumentSnapshot<DocumentData> | null;
};

const PAGE_CACHE_TTL_MS = 3 * 1000; // 3 seconds for faster refresh during dev
const COUNT_CACHE_TTL_MS = 60 * 1000;
const MAX_PAGE_CACHE_ENTRIES = 40;

function normalizeFilters(filters: FirestoreFilter[]) {
  return [...filters].sort((a, b) => {
    const aKey = `${a.field}:${a.operator}:${JSON.stringify(a.value)}`;
    const bKey = `${b.field}:${b.operator}:${JSON.stringify(b.value)}`;
    return aKey.localeCompare(bKey);
  });
}

function upsertBoundedPageCache(
  cache: Map<string, CachedPageEntry>,
  key: string,
  entry: CachedPageEntry
) {
  if (cache.has(key)) {
    cache.delete(key);
  }
  cache.set(key, entry);

  while (cache.size > MAX_PAGE_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

function applyFirestoreFilters(
  baseQuery: Query<DocumentData>,
  filters: FirestoreFilter[]
) {
  let filteredQuery = baseQuery;

  filters.forEach((f) => {
    if (Array.isArray(f.value)) {
      if (f.operator === "array-contains-any") {
        filteredQuery = query(
          filteredQuery,
          where(f.field, "array-contains-any", f.value)
        );
      } else if (f.operator === "in" && (f.value as string[]).length <= 10) {
        filteredQuery = query(filteredQuery, where(f.field, "in", f.value));
      }
      return;
    }

    filteredQuery = query(filteredQuery, where(f.field, f.operator, f.value));
  });

  return filteredQuery;
}

export const usePaginatedFirestore = ({
  collectionPath,
  pageSize = 10,
  filters = [],
  orderByField = "created",
  orderByDirection = "desc",
  externalPage,
  setExternalPage,
}: UsePaginatedFirestoreOptions) => {
  const [data, setData] = useState<DailyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = externalPage ?? internalPage;
  const [totalItems, setTotalItems] = useState(0);
  const normalizedFilters = normalizeFilters(filters);
  const filtersKey = JSON.stringify(normalizedFilters);
  const queryCacheKey = JSON.stringify({
    collectionPath,
    filtersKey,
    orderByField,
    orderByDirection,
    pageSize,
  });
  const countCacheKey = JSON.stringify({
    collectionPath,
    filtersKey,
  });

  const cursors = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([
    null,
  ]);
  const prevQueryKey = useRef("");
  const pageCache = useRef(new Map<string, CachedPageEntry>());
  const countCache = useRef(
    new Map<string, { createdAt: number; totalItems: number }>()
  );

  const loadPage = useCallback(
    async (page: number) => {
      if (!hasMore && page > currentPage) return;

      const pageCacheKey = `${queryCacheKey}:page:${page}`;
      const cachedPage = pageCache.current.get(pageCacheKey);
      if (cachedPage && Date.now() - cachedPage.createdAt < PAGE_CACHE_TTL_MS) {
        setData(cachedPage.data);
        setHasMore(cachedPage.hasMore);
        cursors.current[page] = cachedPage.lastCursor;
        if (setExternalPage && currentPage !== page) {
          setExternalPage(page);
        } else if (!setExternalPage && currentPage !== page) {
          setInternalPage(page);
        }
        return;
      }

      setLoading(true);
      const doneMetric = startFirestoreMetric({
        source: "client",
        operation: "usePaginatedFirestore.loadPage",
        collection: collectionPath,
      });

      try {
        const baseQuery = applyFirestoreFilters(
          query(collection(firestore, collectionPath)),
          normalizedFilters
        );

        let q = query(baseQuery, orderBy(orderByField, orderByDirection));

        const cursor = cursors.current[page - 1];
        if (cursor) {
          q = query(q, startAfter(cursor));
        }
        q = query(q, limit(pageSize));

        console.log("🔍 Query built:", {
          collection: collectionPath,
          orderBy: `${orderByField} (${orderByDirection})`,
          filters: normalizedFilters.map((f) => ({
            field: f.field,
            operator: f.operator,
          })),
          page,
          pageSize,
        });

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(
          (doc) => normalizeDailyAccount(doc.data()) as DailyAccount
        );
        const nextHasMore = snapshot.docs.length >= pageSize;
        const lastCursor = snapshot.docs.at(-1) ?? null;

        console.log("✅ Fetched daily accounts:", {
          count: docs.length,
          page,
          pageSize,
          nextHasMore,
          docs: docs.map((d) => ({ id: d.id, totalEarnings: d.totalEarnings })),
        });

        setHasMore(nextHasMore);
        cursors.current[page] = lastCursor;

        upsertBoundedPageCache(pageCache.current, pageCacheKey, {
          createdAt: Date.now(),
          data: docs,
          hasMore: nextHasMore,
          lastCursor,
        });

        setData(docs);
        if (setExternalPage && currentPage !== page) {
          setExternalPage(page);
        } else if (!setExternalPage && currentPage !== page) {
          setInternalPage(page);
        }

        doneMetric({
          success: true,
          docsRead: snapshot.size,
          details: {
            page,
            pageSize,
            filtersCount: normalizedFilters.length,
            orderByField,
            orderByDirection,
          },
        });
      } catch (err) {
        doneMetric({
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        console.error("❌ Pagination fetch error:", err);
        console.error("❌ Query details:", {
          collectionPath,
          orderByField,
          orderByDirection,
          filtersCount: normalizedFilters.length,
          filters: normalizedFilters,
        });
      } finally {
        setLoading(false);
      }
    },
    [
      collectionPath,
      currentPage,
      hasMore,
      normalizedFilters,
      orderByDirection,
      orderByField,
      pageSize,
      queryCacheKey,
      setExternalPage,
    ]
  );

  const resetPagination = () => {
    cursors.current = [null];
    setData([]);
    setHasMore(true);
    countCache.current.delete(countCacheKey);
    for (const key of pageCache.current.keys()) {
      if (key.startsWith(`${queryCacheKey}:page:`)) {
        pageCache.current.delete(key);
      }
    }
    if (setExternalPage) {
      setExternalPage(1);
    } else {
      setInternalPage(1);
    }
    loadPage(1);
  };

  // Reset + fetch count when filters/order change
  useEffect(() => {
    const queryKey = JSON.stringify({
      collectionPath,
      filtersKey,
      orderByField,
      orderByDirection,
    });

    if (prevQueryKey.current !== queryKey) {
      prevQueryKey.current = queryKey;
      cursors.current = [null];
      setData([]);
      setHasMore(true);
      if (setExternalPage) {
        setExternalPage(1);
      } else {
        setInternalPage(1);
      }
      void loadPage(1);

      // Fetch total item count
      const fetchCount = async () => {
        const cachedCount = countCache.current.get(countCacheKey);
        if (
          cachedCount &&
          Date.now() - cachedCount.createdAt < COUNT_CACHE_TTL_MS
        ) {
          setTotalItems(cachedCount.totalItems);
          return;
        }

        const doneMetric = startFirestoreMetric({
          source: "client",
          operation: "usePaginatedFirestore.fetchCount",
          collection: collectionPath,
        });

        try {
          const countQuery = applyFirestoreFilters(
            query(collection(firestore, collectionPath)),
            normalizedFilters
          );

          const snapshot = await getCountFromServer(countQuery);
          const count = snapshot.data().count;
          setTotalItems(count);
          countCache.current.set(countCacheKey, {
            createdAt: Date.now(),
            totalItems: count,
          });

          doneMetric({
            success: true,
            docsRead: 1,
            details: {
              filtersCount: normalizedFilters.length,
              orderByField,
              orderByDirection,
            },
          });
        } catch (error) {
          doneMetric({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          console.error("Failed to fetch count:", error);
          setTotalItems(0);
        }
      };

      void fetchCount();
    }
  }, [
    collectionPath,
    filtersKey,
    countCacheKey,
    loadPage,
    normalizedFilters,
    orderByField,
    orderByDirection,
    setExternalPage,
  ]);

  return {
    data,
    loading,
    hasMore,
    currentPage,
    totalItems,
    loadPage,
    resetPagination,
    setCurrentPage: setExternalPage ?? setInternalPage,
  };
};
