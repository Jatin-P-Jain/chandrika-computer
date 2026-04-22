"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFirestore";
import { DAILY_ACCOUNTS_LIST_PAGE_SIZE } from "@/lib/utils";
import { DailyAccount } from "@/types/daily-account";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useRef } from "react";
import { DailyAccountCard } from "./daily-account-card";
import { useTranslations } from "next-intl";
import { DailyAccountCardSkeleton } from "./daily-account-loader";
import { LoaderCircleIcon } from "lucide-react";
import { FilterOperator, FirestoreFilter } from "@/types/filters";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";

export default function DailyAccountsList({
  searchParamsValues,
}: {
  searchParamsValues: {
    filtersApplied?: string;
    fromDate?: string;
    toDate?: string;
    sortField?: string;
    sortDir?: "asc" | "desc";
    createdBy?: string;
    updatedBy?: string;
    tags?: string;
  };
}) {
  const tCommon = useTranslations("Common");
  const { textSmCls } = useLocaleTypography();

  const router = useRouter();
  const searchParams = useSearchParams();
  const hasFiltersApplied = searchParams.has("filtersApplied");
  const previousFiltersRef = useRef<string>("");

  // 🔥 EXTRACT ALL FILTERS FROM URL
  const createdBy = searchParamsValues.createdBy
    ? searchParamsValues.createdBy.split(",")
    : [];
  const updatedBy = searchParamsValues.updatedBy
    ? searchParamsValues.updatedBy.split(",")
    : [];
  const tags = searchParamsValues.tags
    ? searchParamsValues.tags.split(",")
    : [];

  const fromDate = searchParamsValues.fromDate;
  const toDate = searchParamsValues.toDate;
  const sortField = searchParamsValues.sortField || "created"; // Default sort
  const sortDir = searchParamsValues.sortDir || "desc"; // Default direction

  // 🔥 BUILD FIRESTORE FILTERS ARRAY
  const firestoreFilters: FirestoreFilter[] = [
    // Date range filters
    ...(fromDate
      ? [
          {
            field: "created",
            operator: ">=" as FilterOperator,
            value: new Date(fromDate + "T00:00:00Z"),
          },
        ]
      : []),
    ...(toDate
      ? [
          {
            field: "created",
            operator: "<=" as FilterOperator,
            value: new Date(toDate + "T23:59:59.999Z"), // End of day
          },
        ]
      : []),

    // User filters (IN queries)
    ...(createdBy.length > 0
      ? [
          {
            field: "createdBy.uid",
            operator: "in" as FilterOperator,
            value: createdBy,
          },
        ]
      : []),
    ...(updatedBy.length > 0
      ? [
          {
            field: "updatedBy.uid",
            operator: "in" as FilterOperator,
            value: updatedBy,
          },
        ]
      : []),

    ...(tags.length > 0
      ? [
          {
            field: "allTags",
            operator: "array-contains-any" as FilterOperator,
            value: tags,
          },
        ]
      : []),
  ];

  // 🔥 Filter tracking (EXCLUDE page)
  const filtersOnly = {
    fromDate,
    toDate,
    sortField,
    sortDir,
    createdBy: searchParamsValues.createdBy || "",
    updatedBy: searchParamsValues.updatedBy || "",
    tags: searchParamsValues.tags || "",
  };
  const filterKey = JSON.stringify(filtersOnly);

  const { data, loading, currentPage, loadPage, totalItems, resetPagination } =
    usePaginatedFirestore({
      collectionPath: "daily-accounts",
      pageSize: DAILY_ACCOUNTS_LIST_PAGE_SIZE,
      orderByField: sortField, // 🔥 Dynamic sort field
      orderByDirection: sortDir, // 🔥 Dynamic sort direction
      filters: firestoreFilters, // 🔥 All URL filters
    });

  // ⏮ Reset to page 1 if filters change
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      previousFiltersRef.current = filterKey;

      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`/daily-accounts?${sp.toString()}`);
      resetPagination();
    }
  }, [filterKey, resetPagination, router, searchParams]);

  const handlePageChange = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", `${page}`);
    router.replace(`/daily-accounts?${sp.toString()}`);
    loadPage(page);
  };

  const start = (currentPage - 1) * DAILY_ACCOUNTS_LIST_PAGE_SIZE + 1;
  const end = Math.min(currentPage * DAILY_ACCOUNTS_LIST_PAGE_SIZE, totalItems);
  const totalPages = Math.max(
    Math.ceil(totalItems / DAILY_ACCOUNTS_LIST_PAGE_SIZE),
    1,
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full w-full flex-1 flex-col gap-2">
        <div className="w-full flex justify-center text-muted-foreground items-center gap-3 animate-pulse">
          {tCommon("FetchingData")}{" "}
          <LoaderCircleIcon className="animate-spin size-4" />
        </div>
        {[...Array(4)].map((_, i) => (
          <DailyAccountCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className="flex h-full min-h-120 w-full flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          {hasFiltersApplied
            ? tCommon("NoDataFoundWithFilters")
            : tCommon("NoDataFound")}
        </p>
      </div>
    );
  }

  // Main content
  return (
    <div className="relative mx-auto flex flex-col w-full max-w-7xl overflow-auto no-scrollbar rounded-md">
      <p
        className={`text-muted-foreground text-center text-xs py-1 ${textSmCls}`}
      >
        {tCommon("ShowingResults", { currentPage, start, end, totalItems })}
      </p>

      <div className="flex h-full w-full flex-1 flex-col justify-between gap-2 lg:min-h-140 max-h-135 overflow-auto no-scrollbar pb-2 md:pb-0">
        <div className="flex w-full flex-col p-2 gap-3 lg:gap-4">
          {data.map((dailyAccount: DailyAccount, index: number) => (
            <DailyAccountCard
              key={dailyAccount.id || index}
              dailyAccount={dailyAccount}
            />
          ))}
        </div>

        {/* Pagination - unchanged */}
        {totalPages > 0 && (
          <Pagination>
            <PaginationContent className="w-full items-center justify-center">
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                </PaginationItem>
              )}

              {/* Your existing pagination logic */}
              {/* ... (unchanged) */}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
