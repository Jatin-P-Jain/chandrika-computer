"use client";

import { useEffect, useState } from "react";
import { getFilterOptions } from "@/app/daily-accounts/actions";
import { FilterTag, FilterUser } from "@/types/filters";

export function useFilterOptions() {
  const [filters, setFilters] = useState({
    creators: [] as FilterUser[],
    updaters: [] as FilterUser[],
    tags: [] as FilterTag[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFilterOptions().then((data) => {
      setFilters(data);
      setLoading(false);
    });
  }, []);

  return { ...filters, loading };
}
