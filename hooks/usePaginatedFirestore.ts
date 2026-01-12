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
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { firestore } from "@/firebase/client";
import { DailyAccount } from "@/types/daily-account";
import { normalizeDailyAccount } from "@/lib/server-utils";
import { FirestoreFilter } from "@/types/filters";

type UsePaginatedFirestoreOptions = {
  collectionPath: string;
  pageSize?: number;
  filters?: FirestoreFilter[];
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
};

export const usePaginatedFirestore = ({
  collectionPath,
  pageSize = 10,
  filters = [],
  orderByField = "created",
  orderByDirection = "desc",
}: UsePaginatedFirestoreOptions) => {
  const [data, setData] = useState<DailyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const cursors = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([
    null,
  ]);
  const prevQueryKey = useRef("");

  const loadPage = async (page: number) => {
    if (!hasMore && page > currentPage) return;
    setLoading(true);
    try {
      let q = query(collection(firestore, collectionPath));

      // Dynamic orderBy
      q = query(q, orderBy(orderByField, orderByDirection));

      // PERFECT filter handling
      filters.forEach((f) => {
        if (Array.isArray(f.value)) {
          // array-contains-any (multiple tags)
          if (f.operator === "array-contains-any") {
            q = query(q, where(f.field, "array-contains-any", f.value));
          }
          // in queries (max 10 items)
          else if (f.operator === "in" && (f.value as string[]).length <= 10) {
            q = query(q, where(f.field, "in", f.value));
          }
        } else {
          // Single value filters (dates, etc.)
          q = query(q, where(f.field, f.operator, f.value));
        }
      });

      // Pagination cursor
      const cursor = cursors.current[page - 1];
      if (cursor) {
        q = query(q, startAfter(cursor));
      }

      q = query(q, limit(pageSize));
      const snapshot = await getDocs(q);

      const docs = snapshot.docs.map(
        (doc) => normalizeDailyAccount(doc.data()) as DailyAccount
      );

      if (snapshot.docs.length < pageSize) {
        setHasMore(false);
      }

      if (!cursors.current[page]) {
        cursors.current[page] = snapshot.docs.at(-1) ?? null;
      }

      setData(docs);
      setCurrentPage(page);
    } catch (err) {
      console.error("Pagination fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetPagination = () => {
    cursors.current = [null];
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    loadPage(1);
  };

  // Reset + fetch count when filters/order change
  useEffect(() => {
    const queryKey = JSON.stringify({
      collectionPath,
      filters,
      orderByField,
      orderByDirection,
    });

    if (prevQueryKey.current !== queryKey) {
      prevQueryKey.current = queryKey;
      resetPagination();

      // Fetch total item count
      const fetchCount = async () => {
        try {
          let countQuery = query(collection(firestore, collectionPath));
          countQuery = query(
            countQuery,
            orderBy(orderByField, orderByDirection)
          );

          filters.forEach((f) => {
            if (Array.isArray(f.value)) {
              if (f.operator === "array-contains-any") {
                countQuery = query(
                  countQuery,
                  where(f.field, "array-contains-any", f.value)
                );
              } else if (
                f.operator === "in" &&
                (f.value as string[]).length <= 10
              ) {
                countQuery = query(countQuery, where(f.field, "in", f.value));
              }
            } else {
              countQuery = query(
                countQuery,
                where(f.field, f.operator, f.value)
              );
            }
          });

          const snapshot = await getCountFromServer(countQuery);
          setTotalItems(snapshot.data().count);
        } catch (error) {
          console.error("Failed to fetch count:", error);
          setTotalItems(0);
        }
      };

      fetchCount();
    }
  }, [collectionPath, JSON.stringify(filters), orderByField, orderByDirection]);

  return {
    data,
    loading,
    hasMore,
    currentPage,
    totalItems,
    loadPage,
    resetPagination,
  };
};
