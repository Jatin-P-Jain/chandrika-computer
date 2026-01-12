"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { FilterTag, FilterUser } from "@/types/filters";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocale, useTranslations } from "next-intl";

export function MoreFiltersPopover({
  updateSearchParams,
}: {
  updateSearchParams: (params: Record<string, string | string[]>) => void;
}) {
  const tFilters = useTranslations("Filters");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textSmCls = clsx(
    isHi ? "text-sm! md:text-base!" : "text-xs! md:text-sm!"
  );

  const searchParams = useSearchParams();
  const currentCreatedBy = searchParams.get("createdBy")?.split(",") || [];
  const currentUpdatedBy = searchParams.get("updatedBy")?.split(",") || [];
  const currentTags = searchParams.get("tags")?.split(",") || [];

  const { creators, updaters, tags } = useFilterOptions();
  const [open, setOpen] = useState(false);

  const totalSelected =
    currentCreatedBy.length + currentUpdatedBy.length + currentTags.length;

  const updateFilterList = (
    filterType: "createdBy" | "updatedBy" | "tags",
    items: FilterUser[] | FilterTag[],
    selectedIds: string[]
  ) => {
    const values = items
      .filter((item) => selectedIds.includes(item.value))
      .map((item) => item.value);

    updateSearchParams({
      [filterType]: values.length > 0 ? values.join(",") : "",
    });
  };

  const clearSection = (filterType: "createdBy" | "updatedBy" | "tags") => {
    updateSearchParams({ [filterType]: "" });
  };

  // 🔥 Clear ONLY more filters (keeps date/sort)
  const clearMoreFiltersOnly = () => {
    updateSearchParams({
      createdBy: "",
      updatedBy: "",
      tags: "",
    });
  };

  const Section = ({
    title,
    items,
    currentSelected,
    filterType,
  }: {
    title: string;
    items: FilterUser[] | FilterTag[];
    currentSelected: string[];
    filterType: "createdBy" | "updatedBy" | "tags";
  }) => (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <span
          className={clsx(
            "text-xs font-medium text-muted-foreground uppercase tracking-wider",
            textSmCls
          )}
        >
          {title}
        </span>
        {currentSelected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs" // ✅ Fixed button styling
            onClick={(e) => {
              e.stopPropagation();
              clearSection(filterType);
            }}
          >
            <X className="size-3 h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="space-y-1 max-h-32 overflow-auto px-1">
        {items.map((item) => (
          <div
            key={item.value}
            className="flex gap-2 justify-between p-2 cursor-pointer hover:bg-accent rounded-md items-center"
            onClick={() => {
              const newSelected = currentSelected.includes(item.value)
                ? currentSelected.filter((id) => id !== item.value)
                : [...currentSelected, item.value];
              updateFilterList(filterType, items as any, newSelected);
            }}
          >
            <div className="flex items-center gap-2 flex-1">
              <Checkbox checked={currentSelected.includes(item.value)} />
              {filterType !== "tags" ? (
                <Avatar className="size-5 ring-1 ring-primary border">
                  <AvatarImage src={(item as FilterUser)?.photoUrl || ""} />
                  <AvatarFallback className="text-[10px]">
                    {item.label?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.count ?? 0}
            </span>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
          No {title.toLowerCase()} available
        </div>
      )}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={clsx(
            "gap-1 transition-all duration-300 hover:shadow-md hover:scale-102 ",
            {
              "text-primary border-primary scale-102 shadow-md":
                open || totalSelected > 0,
            },
            textSmCls
          )}
        >
          <span
            className={clsx(
              textSmCls,
              "flex justify-center items-center gap-2"
            )}
          >
            <Filter className="size-4" />
            {tFilters("MoreFilters")}
          </span>
          {totalSelected > 0 && (
            <div className="size-5 text-xs justify-center items-center flex bg-primary/10 text-primary font-semibold rounded-full px-1.5">
              {totalSelected}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" sideOffset={5}>
        <div className="max-h-96 overflow-auto">
          <Section
            title={tFilters("CreatedBy")}
            items={creators}
            currentSelected={currentCreatedBy}
            filterType="createdBy"
          />
          <div className="border-t mx-2" />
          <Section
            title={tFilters("UpdatedBy")}
            items={updaters}
            currentSelected={currentUpdatedBy}
            filterType="updatedBy"
          />
          <div className="border-t mx-2" />
          <Section
            title={tFilters("Tags")}
            items={tags}
            currentSelected={currentTags}
            filterType="tags"
          />
        </div>
        <div className="border-t p-3 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {totalSelected}{" "}
            {totalSelected <= 1
              ? `${tFilters("FiltersApplied", { count: 1 })}`
              : `${tFilters("FiltersApplied", { count: 2 })}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMoreFiltersOnly} // ✅ Only clears more filters!
          >
            <span className={clsx(textSmCls)}>{tFilters("ClearAll")}</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
