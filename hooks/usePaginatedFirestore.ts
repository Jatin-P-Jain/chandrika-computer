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

type UsePaginatedFirestoreOptions = {
  collectionPath: string;
  pageSize?: number;
  filters?: { field: string; op: "==" | "in"; value: string | string[] }[];
  orderByField?: string;
};

export const usePaginatedFirestore = ({
  collectionPath,
  pageSize = 10,
  filters = [],
  orderByField = "updated",
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
      q = query(q, orderBy(orderByField, "desc"));

      filters.forEach((f) => {
        q = query(q, where(f.field, f.op, f.value));
      });

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

  useEffect(() => {
    const queryKey = JSON.stringify({ collectionPath, filters, orderByField });
    if (prevQueryKey.current !== queryKey) {
      prevQueryKey.current = queryKey;
      resetPagination();

      // Fetch total item count
      const fetchCount = async () => {
        try {
          let countQuery = query(collection(firestore, collectionPath));
          filters.forEach((f) => {
            countQuery = query(countQuery, where(f.field, f.op, f.value));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, JSON.stringify(filters), orderByField]);

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
