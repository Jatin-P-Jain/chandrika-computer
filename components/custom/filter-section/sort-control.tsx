"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown, ListRestart } from "lucide-react";
import clsx from "clsx";

const SORT_FIELDS = [
  { value: "id", label: "AccountDate" },
  { value: "created", label: "CreatedDate" },
  { value: "updated", label: "UpdatedDate" },
  { value: "totalEarnings", label: "TotalEarnings" },
  { value: "totalSpends", label: "TotalSpends" },
  { value: "totalCashCollected", label: "CashCollected" },
];

export function SortControl({ className }: { className?: string }) {
  const tFilters = useTranslations("Filters");
  const tCommon = useTranslations("Common");
  const { replace } = useSafeRouter();
  const searchParams = useSearchParams();
  const { textBodyCls, textSmCls } = useLocaleTypography();

  const [openSorting, setOpenSorting] = useState(false);
  const sortField = searchParams.get("sortField") || "id";
  const sortDir = searchParams.get("sortDir") || "desc";
  const isSortApplied = sortField !== "id" || sortDir !== "desc";
  const selectedSortLabel = tFilters(
    SORT_FIELDS.find((f) => f.value === sortField)?.label || "AccountDate",
  );

  const updateSortParams = (nextSortField: string, nextSortDir: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("sortField");
    params.delete("sortDir");
    params.delete("page");
    params.delete("filtersApplied");

    if (nextSortField) params.set("sortField", nextSortField);
    if (nextSortDir) params.set("sortDir", nextSortDir);
    params.set("page", "1");

    const hasFilters = Array.from(params.entries()).some(([key, value]) => {
      return (
        !["page", "sortField", "sortDir"].includes(key) &&
        value &&
        value !== "id" &&
        value !== "desc"
      );
    });

    if (hasFilters) {
      params.set("filtersApplied", "1");
    }

    replace(`?${params.toString()}`);
  };

  return (
    <Popover open={openSorting} onOpenChange={setOpenSorting}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1 transition-all duration-300 hover:shadow-md md:hover:scale-102 w-full justify-center md:justify-between",
            {
              "text-primary border-primary md:scale-102":
                openSorting || isSortApplied,
            },
            className,
          )}
        >
          <span
            className={cn(
              "flex justify-center items-center gap-1.5",
              textSmCls,
            )}
          >
            <ArrowUpDown className="size-4" />
            <span className="md:hidden">
              {isSortApplied
                ? `${selectedSortLabel} (${sortDir === "asc" ? "↑" : "↓"})`
                : tFilters("Sort")}
            </span>
            <span className="hidden md:inline">
              {tFilters("Sort")} {selectedSortLabel} (
              {sortDir === "asc" ? "↑" : "↓"})
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" max-w-sm w-fit min-w-0 p-0" align="end">
        <div className="p-2 w-fit">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="">{tFilters("SortBy")}</h3>
            <Button
              variant="outline"
              size="sm"
              className={clsx("text-xs text-primary", textBodyCls)}
              onClick={() => updateSortParams("", "")}
              disabled={!isSortApplied}
            >
              <ListRestart />
              {tCommon("Reset")}
            </Button>
          </div>
          <div className="mb-1">
            {SORT_FIELDS.map((field) => (
              <Button
                variant={"ghost"}
                key={field.value}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-md text-sm justify-start",
                  sortField === field.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent text-muted-foreground",
                )}
                onClick={() => updateSortParams(field.value, sortDir)}
              >
                <ArrowUpDown className="size-4" />
                {tFilters(field.label)}
              </Button>
            ))}
          </div>

          <div className="border-t p-2 pt-3">
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">
              {tFilters("Direction")}
            </h4>
            <div className="flex gap-2">
              <Button
                variant={sortDir === "asc" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateSortParams(sortField, "asc")}
              >
                <ArrowUp className="size-4" />
                {tFilters("Ascending")}
              </Button>
              <Button
                variant={sortDir === "desc" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateSortParams(sortField, "desc")}
              >
                <ArrowDown className="size-4" />
                {tFilters("Descending")}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
