"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { FilterTag, FilterUser } from "@/types/filters";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";

type FilterItem = FilterUser | FilterTag;

function FilterSection({
  title,
  items,
  currentSelected,
  filterType,
  textSmCls,
  onClear,
  onToggle,
}: {
  title: string;
  items: FilterItem[];
  currentSelected: string[];
  filterType: "createdBy" | "updatedBy" | "tags";
  textSmCls: string;
  onClear: (filterType: "createdBy" | "updatedBy" | "tags") => void;
  onToggle: (
    filterType: "createdBy" | "updatedBy" | "tags",
    itemValue: string,
  ) => void;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <span
          className={clsx(
            "text-xs font-medium text-muted-foreground uppercase tracking-wider",
            textSmCls,
          )}
        >
          {title}
        </span>
        {currentSelected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onClear(filterType);
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
            onClick={() => onToggle(filterType, item.value)}
          >
            <div className="flex items-center gap-2 flex-1">
              <Checkbox checked={currentSelected.includes(item.value)} />
              {filterType !== "tags" ? (
                <Avatar className="size-5 ring-1 ring-primary border">
                  <AvatarImage
                    src={"photoUrl" in item ? (item.photoUrl ?? "") : ""}
                  />
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
}

export function MoreFiltersPopover({
  updateSearchParams,
}: {
  updateSearchParams: (params: Record<string, string | string[]>) => void;
}) {
  const tFilters = useTranslations("Filters");
  const { isHi } = useLocaleTypography();
  // textSmCls has a non-empty default for both locales – derive inline from isHi
  const textSmCls = isHi
    ? "text-sm! md:text-base! font-[inherit]"
    : "text-xs! md:text-sm!";

  const searchParams = useSearchParams();
  const currentCreatedBy = searchParams.get("createdBy")?.split(",") || [];
  const currentUpdatedBy = searchParams.get("updatedBy")?.split(",") || [];
  const currentTags = searchParams.get("tags")?.split(",") || [];

  const { creators, updaters, tags } = useFilterOptions();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalSelected =
    currentCreatedBy.length + currentUpdatedBy.length + currentTags.length;

  const updateFilterList = (
    filterType: "createdBy" | "updatedBy" | "tags",
    items: FilterItem[],
    selectedIds: string[],
  ) => {
    const values = items
      .filter((item) => selectedIds.includes(item.value))
      .map((item) => item.value);

    updateSearchParams({
      [filterType]: values.length > 0 ? values.join(",") : "",
    });
  };

  const clearSection = (filterType: "createdBy" | "updatedBy" | "tags") => {
    startTransition(() => {
      updateSearchParams({ [filterType]: "" });
    });
  };

  // 🔥 Clear ONLY more filters (keeps date/sort)
  const clearMoreFiltersOnly = () => {
    startTransition(() => {
      updateSearchParams({
        createdBy: "",
        updatedBy: "",
        tags: "",
      });
    });
  };

  const toggleItem = (
    filterType: "createdBy" | "updatedBy" | "tags",
    itemValue: string,
  ) => {
    const itemMap = {
      createdBy: creators,
      updatedBy: updaters,
      tags,
    } as const;
    const currentSelectedMap = {
      createdBy: currentCreatedBy,
      updatedBy: currentUpdatedBy,
      tags: currentTags,
    } as const;

    const currentSelected = currentSelectedMap[filterType];
    const newSelected = currentSelected.includes(itemValue)
      ? currentSelected.filter((id) => id !== itemValue)
      : [...currentSelected, itemValue];

    updateFilterList(filterType, [...itemMap[filterType]], newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={clsx(
            "gap-1 transition-all duration-300 hover:shadow-md md:hover:scale-102 w-full md:w-auto justify-center md:justify-between",
            {
              "text-primary border-primary md:scale-102 shadow-md":
                open || totalSelected > 0,
            },
            textSmCls,
          )}
        >
          <span
            className={clsx(
              textSmCls,
              "flex justify-center items-center gap-2",
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
      <PopoverContent className=" max-w-sm md:w-80 p-0" align="start">
        <div className="max-h-96 overflow-auto">
          <FilterSection
            title={tFilters("CreatedBy")}
            items={creators}
            currentSelected={currentCreatedBy}
            filterType="createdBy"
            textSmCls={textSmCls}
            onClear={clearSection}
            onToggle={toggleItem}
          />
          <div className="border-t mx-2" />
          <FilterSection
            title={tFilters("UpdatedBy")}
            items={updaters}
            currentSelected={currentUpdatedBy}
            filterType="updatedBy"
            textSmCls={textSmCls}
            onClear={clearSection}
            onToggle={toggleItem}
          />
          <div className="border-t mx-2" />
          <FilterSection
            title={tFilters("Tags")}
            items={tags}
            currentSelected={currentTags}
            filterType="tags"
            textSmCls={textSmCls}
            onClear={clearSection}
            onToggle={toggleItem}
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
            disabled={isPending}
          >
            <span className={clsx(textSmCls, "inline-flex items-center gap-1")}>
              {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
              {tFilters("ClearAll")}
            </span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
