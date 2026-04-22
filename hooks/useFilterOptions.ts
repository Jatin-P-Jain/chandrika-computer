"use client";

import { useEffect, useState } from "react";
import { getFilterOptions } from "@/app/daily-accounts/read-actions";
import { FilterTag, FilterUser } from "@/types/filters";

const FILTER_OPTIONS_CACHE_KEY = "daily-account-filter-options:v1";
const FILTER_OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

type FilterOptionsData = {
  creators: FilterUser[];
  updaters: FilterUser[];
  tags: FilterTag[];
};

const EMPTY_FILTERS: FilterOptionsData = {
  creators: [],
  updaters: [],
  tags: [],
};

function getCachedFilterOptions(): FilterOptionsData | null {
  if (typeof window === "undefined") return null;

  const cachedRaw = sessionStorage.getItem(FILTER_OPTIONS_CACHE_KEY);
  if (!cachedRaw) return null;

  try {
    const cached = JSON.parse(cachedRaw) as {
      createdAt: number;
      data: FilterOptionsData;
    };

    if (Date.now() - cached.createdAt >= FILTER_OPTIONS_CACHE_TTL_MS) {
      sessionStorage.removeItem(FILTER_OPTIONS_CACHE_KEY);
      return null;
    }

    return cached.data;
  } catch {
    sessionStorage.removeItem(FILTER_OPTIONS_CACHE_KEY);
    return null;
  }
}

export function useFilterOptions() {
  const [filters, setFilters] = useState<FilterOptionsData>(() => {
    return getCachedFilterOptions() ?? EMPTY_FILTERS;
  });
  const [loading, setLoading] = useState(() => !getCachedFilterOptions());

  useEffect(() => {
    if (getCachedFilterOptions()) {
      return;
    }

    getFilterOptions().then((data) => {
      setFilters(data);
      setLoading(false);
      sessionStorage.setItem(
        FILTER_OPTIONS_CACHE_KEY,
        JSON.stringify({ createdAt: Date.now(), data })
      );
    });
  }, []);

  return { ...filters, loading };
}
