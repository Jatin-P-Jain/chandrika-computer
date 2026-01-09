"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePaginatedFirestore } from "@/hooks/usePaginatedFirestore";
import { DAILY_ACCOUNTS_LIST_PAGE_SIZE } from "@/lib/utils";
import { DailyAccount } from "@/types/daily-account";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DailyAccountCard } from "./daily-account-card";
import { useLocale, useTranslations } from "next-intl";

export default function DailyAccountsList({
  searchParamsValues,
}: {
  searchParamsValues: {};
}) {
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textSmCls = isHi ? "text-sm! lg:text-base!" : "";

  const router = useRouter();
  const searchParams = useSearchParams();

  const previousFiltersRef = useRef<string>("");

  // Only include actual filters (exclude page param)
  const filtersOnly = {
    ...searchParamsValues,
  };
  const filterKey = JSON.stringify(filtersOnly);

  const {
    data,
    loading,
    hasMore,
    currentPage,
    loadPage,
    totalItems,
    resetPagination,
  } = usePaginatedFirestore({
    collectionPath: "daily-accounts",
    pageSize: DAILY_ACCOUNTS_LIST_PAGE_SIZE,
    orderByField: "created",
    filters: [],
  });

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // after loading becomes false
  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true);
    }
  }, [loading]);

  // ⏮ Reset to page 1 if filters change
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      previousFiltersRef.current = filterKey;

      // Reset page to 1 in URL
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", "1");
      router.replace(`/daily-accounts?${sp.toString()}`);

      // Reset pagination state
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
    1
  );

  //   if (loading || !hasLoadedOnce) {
  //     return (
  //       <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col gap-4 px-4 py-6">
  //         {[...Array(4)].map((_, i) => (
  //           <ProductCardSkeleton key={i} />
  //         ))}
  //       </div>
  //     );
  //   }

  if (!loading && hasLoadedOnce && data.length === 0) {
    return (
      <div className="flex h-full min-h-120 w-full flex-1 items-center justify-center">
        <p className="text-muted-foreground">No daily accounts found.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex flex-col w-full max-w-7xl overflow-auto no-scrollbar rounded-md">
      <p
        className={`text-muted-foreground text-center text-xs py-1 ${textSmCls}`}
      >
        {tCommon("ShowingResults", { currentPage, start, end, totalItems })}
      </p>
      {data && data.length > 0 && (
        <div className="flex h-full w-full flex-1 flex-col justify-between gap-2 lg:min-h-140 max-h-135 overflow-auto no-scrollbar pb-2 md:pb-0">
          <div className="flex w-full flex-col p-2 gap-3 lg:gap-4 ">
            {data.map((dailyAccount: DailyAccount, index: number) => (
              <DailyAccountCard key={index} dailyAccount={dailyAccount} />
            ))}
          </div>

          {totalPages > 0 && (
            <Pagination>
              <PaginationContent className="w-full items-center justify-center">
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      // href="#"
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                  </PaginationItem>
                )}

                {(() => {
                  const pageLinks = [];
                  const visiblePages = new Set<number>();

                  if (totalPages <= 7) {
                    // Show all pages if total pages are 7 or fewer
                    for (let i = 1; i <= totalPages; i++) {
                      visiblePages.add(i);
                    }
                  } else {
                    // Always show first and last page
                    visiblePages.add(1);
                    visiblePages.add(totalPages);

                    // Show current page and two pages before & after
                    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                      if (i > 1 && i < totalPages) {
                        visiblePages.add(i);
                      }
                    }
                  }

                  let prev: number | null = null;
                  for (let i = 1; i <= totalPages; i++) {
                    if (!visiblePages.has(i)) continue;

                    if (prev !== null && i - prev > 1) {
                      pageLinks.push(
                        <PaginationItem key={`ellipsis-${i}`}>
                          <span className="text-muted-foreground px-2">
                            ...
                          </span>
                        </PaginationItem>
                      );
                    }

                    const isCurrent = i === currentPage;
                    pageLinks.push(
                      <PaginationItem key={i} className="">
                        <PaginationLink
                          // href="#"
                          onClick={() => handlePageChange(i)}
                          isActive={isCurrent}
                          className={clsx(
                            isCurrent && "bg-primary font-semibold text-white "
                          )}
                          size={"icon-sm"}
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );

                    prev = i;
                  }

                  return pageLinks;
                })()}

                {hasMore && currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      size={"icon-sm"}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
