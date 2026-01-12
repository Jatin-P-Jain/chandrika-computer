"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FunnelX,
  CalendarRange,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { format, addDays } from "date-fns";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { MoreFiltersPopover } from "./more-filters";
import { enUS, hi } from "date-fns/locale";

const PRESET_FILTERS = [
  { id: "3days", label: "Last3Days", value: "3days" },
  { id: "week", label: "PastWeek", value: "week" },
];

const SORT_FIELDS = [
  { value: "created", label: "CreatedDate" },
  { value: "updated", label: "UpdatedDate" },
  { value: "totalEarnings", label: "TotalEarnings" },
  { value: "totalSpends", label: "TotalSpends" },
  { value: "totalCashCollected", label: "CashCollected" },
];

export function FiltersSection() {
  const tCommon = useTranslations("Common");
  const tFilters = useTranslations("Filters");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textBodyCls = clsx(isHi && "text-base! font-[inherit]");
  const textSmCls = clsx(
    isHi ? "text-sm! md:text-base! font-[inherit]" : "text-xs! md:text-sm!"
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  // Current filter states from URL
  const dateRange = searchParams.get("dateRange");
  const sortField = searchParams.get("sortField") || "created";
  const sortDir = searchParams.get("sortDir") || "desc";

  // 🔥 COMPUTE from URL - tracks ALL filters perfectly
  const hasFiltersApplied =
    dateRange ||
    searchParams.get("fromDate") ||
    searchParams.get("toDate") ||
    searchParams.get("createdBy") ||
    searchParams.get("updatedBy") ||
    searchParams.get("tags");

  const clearFiltersDisabled = !hasFiltersApplied;

  const [date, setDate] = useState<DateRange | undefined>();
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openSorting, setOpenSorting] = useState(false);

  // Sync date picker with URL
  useEffect(() => {
    if (dateRange === "3days") {
      setDate({
        from: addDays(new Date(), -3),
        to: new Date(),
      });
    } else if (dateRange === "week") {
      setDate({
        from: addDays(new Date(), -7),
        to: new Date(),
      });
    } else {
      setDate(undefined);
    }
  }, [dateRange]);

  const updateSearchParams = (
    newParams: Record<string, string | string[]>,
    clearAll?: boolean
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (clearAll) {
      const params = new URLSearchParams(); // Fresh empty params
      router.replace(`?${params.toString()}`);
      return;
    } else {
      // Normal update - only clear updated params
      Object.keys(newParams).forEach((key) => params.delete(key));
      params.delete("page");
      params.delete("filtersApplied");
    }

    // Add new filters (skipped for clearAll)
    if (!clearAll) {
      Object.entries(newParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => v && params.append(key, v));
        } else if (value) {
          params.set(key, value);
        }
      });
    }

    // 🔥 Calculate filtersApplied from NEW params state
    const currentFilters = Array.from(params.entries());
    const hasFilters = currentFilters.some(([key, value]) => {
      return (
        !["page"].includes(key) &&
        value &&
        value !== "created" &&
        value !== "desc"
      );
    });

    if (hasFilters) {
      params.set("filtersApplied", "1");
    }

    if (!clearAll) {
      params.set("page", "1");
    }

    router.replace(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setDate(undefined);
    updateSearchParams({}, true); // ✅ clearAll=true
  };

  return (
    <div className="flex flex-wrap items-center gap-2 ml-auto md:justify-end">
      {/* Preset Date Filters */}
      <div className="hidden md:flex gap-1">
        {PRESET_FILTERS.map((filter) => (
          <Badge
            key={filter.id}
            variant={dateRange === filter.value ? "default" : "secondary"}
            className={clsx(
              "flex justify-center items-center cursor-pointer border border-primary px-3 py-1 bg-background text-primary hover:scale-105 transition-all duration-300",
              {
                "bg-primary text-white": dateRange === filter.value,
              }
            )}
            onClick={() => {
              // 🔥 TOGGLE LOGIC
              if (dateRange === filter.value) {
                // Already active → Clear this preset
                updateSearchParams({
                  dateRange: "",
                  fromDate: "",
                  toDate: "",
                });
              } else {
                // Inactive → Set this preset
                const today = new Date();
                const daysAgo = filter.value === "3days" ? 3 : 7;
                const fromDate = format(addDays(today, -daysAgo), "yyyy-MM-dd");

                updateSearchParams({
                  dateRange: filter.value,
                  fromDate,
                  toDate: format(today, "yyyy-MM-dd"),
                });
              }
            }}
          >
            <span className={clsx(textBodyCls)}>{tFilters(filter.label)}</span>
          </Badge>
        ))}
      </div>

      {/* Custom Date Range - Calendar */}
      <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={clsx(
              "gap- transition-all duration-300 hover:shadow-md hover:scale-102 w-full md:w-fit justify-center items-center",
              textBodyCls,
              {
                "text-primary border-primary scale-102": openDatePicker || date,
              }
            )}
          >
            <CalendarRange className="size-4" />
            <span className={clsx(textBodyCls)}>
              {date?.from && date?.to
                ? `${format(date.from, "MMMM dd", {
                    locale: isHi ? hi : enUS,
                  })} - ${format(date.to, "MMMM dd", {
                    locale: isHi ? hi : enUS,
                  })}`
                : tFilters("DateRange")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={clsx("w-auto shadow-lg", {
            "border-primary": openDatePicker,
          })}
          align="end"
        >
          <Calendar
            locale={hi}
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            className="p-0 w-full"
            disabled={(date) => {
              if (date > new Date()) return true;
              return false;
            }}
            endMonth={new Date()}
            showOutsideDays={false}
          />
          <div className="flex p-3 border-t space-x-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDate(undefined);
                setOpenDatePicker(false);
              }}
            >
              {tCommon("Cancel")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 🔥 Clear ONLY date filters
                updateSearchParams({
                  dateRange: "",
                  fromDate: "",
                  toDate: "",
                });
                setDate(undefined);
                setOpenDatePicker(false);
              }}
              disabled={!date?.from || !date?.to}
            >
              {tFilters("RemoveFilter")}
            </Button>
            <Button
              className="ml-auto"
              size="sm"
              onClick={() => {
                if (date?.from && date?.to) {
                  updateSearchParams({
                    fromDate: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                    toDate: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                  });
                  setOpenDatePicker(false);
                }
              }}
              disabled={!date?.from || !date?.to}
            >
              {tFilters("Apply")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* More Filters Dropdown */}
      <MoreFiltersPopover updateSearchParams={updateSearchParams} />

      {/* Sorting Popover */}
      <Popover open={openSorting} onOpenChange={setOpenSorting}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={clsx(
              "gap-1 transition-all duration-300 hover:shadow-md hover:scale-102",
              {
                "text-primary border-primary scale-102": openSorting,
              }
            )}
          >
            <span
              className={clsx("flex justify-center items-center", textSmCls)}
            >
              <ArrowUpDown className="size-4" />
              <span>
                {tFilters("Sort")}{" "}
                {tFilters(
                  SORT_FIELDS.find((f) => f.value === sortField)?.label || ""
                )}{" "}
                ({sortDir === "asc" ? "↑" : "↓"})
              </span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit min-w-0 p-0">
          <div className="p-4 pb-2 w-fit">
            <h3 className="text-sm mb-1">{tFilters("SortBy")}</h3>
            <div className="mb-1">
              {SORT_FIELDS.map((field) => (
                <Button
                  variant={"ghost"}
                  key={field.value}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md text-sm justify-start",
                    sortField === field.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent text-muted-foreground"
                  )}
                  onClick={() =>
                    updateSearchParams({
                      sortField: field.value,
                      sortDir: sortDir,
                    })
                  }
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
                  onClick={() =>
                    updateSearchParams({
                      sortField,
                      sortDir: "asc",
                    })
                  }
                >
                  <ArrowUp className="size-4" />
                  {tFilters("Ascending")}
                </Button>
                <Button
                  variant={sortDir === "desc" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    updateSearchParams({
                      sortField,
                      sortDir: "desc",
                    })
                  }
                >
                  <ArrowDown className="size-4" />
                  {tFilters("Descending")}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      <Button
        disabled={clearFiltersDisabled}
        variant="outline"
        size="sm"
        className="text-xs border-red-500 text-red-700 hover:bg-red-100/10 hover:text-red-800 mb-2 md:mb-0"
        onClick={clearAllFilters}
      >
        <span
          className={clsx("flex justify-between items-center gap-1", textSmCls)}
        >
          <FunnelX className="size-4" />
          {tFilters("ClearAllFilters")}
        </span>
      </Button>
    </div>
  );
}
