"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FunnelX,
  CalendarRange,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { format, addDays } from "date-fns";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { MoreFiltersPopover } from "./more-filters";
import { fr } from "date-fns/locale";

const PRESET_FILTERS = [
  { id: "3days", label: "Last 3 Days", value: "3days" },
  { id: "week", label: "Past Week", value: "week" },
];

const SORT_FIELDS = [
  { value: "created", label: "Created Date" },
  { value: "updated", label: "Updated Date" },
  { value: "earnings", label: "Total Earnings" },
  { value: "spends", label: "Total Spends" },
  { value: "cash", label: "Cash Collected" },
];

export function FiltersSection() {
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current filter states from URL
  const dateRange = searchParams.get("dateRange");
  const sortField = searchParams.get("sortField") || "created";
  const sortDir = searchParams.get("sortDir") || "desc";

  const [date, setDate] = useState<DateRange | undefined>();
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openSorting, setOpenSorting] = useState(false);
  const [clearFiltersDisabled, setClearFiltersDisabled] = useState(true);

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

  const updateSearchParams = (newParams: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear existing filters
    params.delete("dateRange");
    params.delete("fromDate");
    params.delete("toDate");
    params.delete("sortField");
    params.delete("sortDir");
    params.delete("page"); // Reset pagination

    // Add new filters
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => v && params.append(key, v));
      } else if (value) {
        params.set(key, value);
      }
    });
    setClearFiltersDisabled(false);
    router.replace(`?${params.toString()}`);
  };

  const clearMoreFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("createdBy");
    params.delete("updatedBy");
    params.delete("tags");
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setDate(undefined);
    setClearFiltersDisabled(true);
    const params = new URLSearchParams();
    params.set("sortField", "created");
    params.set("sortDir", "desc");
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 ml-auto">
      {/* Preset Date Filters */}
      <div className="flex gap-1">
        {PRESET_FILTERS.map((filter) => (
          <Badge
            key={filter.id}
            variant={dateRange === filter.value ? "default" : "secondary"}
            className={clsx(
              "cursor-pointer border border-primary px-3 py-1 bg-background text-primary hover:scale-105 transition-all duration-300",
              {
                "bg-primary text-white": dateRange === filter.value,
              }
            )}
            onClick={() =>
              updateSearchParams({
                dateRange: filter.value,
                fromDate: date?.from?.toISOString().split("T")[0] || "",
                toDate: date?.to?.toISOString().split("T")[0] || "",
              })
            }
          >
            {filter.label}
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
              "gap-1 transition-all duration-300 hover:shadow-md hover:scale-102",
              {
                "text-primary border-primary scale-102": openDatePicker || date,
              }
            )}
          >
            <CalendarRange className="size-4" />
            <span>
              {date?.from && date?.to
                ? `${format(date.from, "MMM dd")} - ${format(
                    date.to,
                    "MMM dd"
                  )}`
                : "Custom Range"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={clsx("w-auto shadow-lg", {
            "border-primary": openDatePicker,
          })}
          align="center"
        >
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="p-3"
            disabled={(date) => {
              if (date > new Date()) return true;
              return false;
            }}
            endMonth={new Date()}
            showOutsideDays={false}
          />
          <div className="p-3 border-t space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDate(undefined);
                setOpenDatePicker(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (date?.from && date?.to) {
                  updateSearchParams({
                    fromDate: date.from.toISOString().split("T")[0],
                    toDate: date.to.toISOString().split("T")[0],
                  });
                  setOpenDatePicker(false);
                }
              }}
              disabled={!date?.from || !date?.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* More Filters Dropdown */}
      <MoreFiltersPopover clearAllHandler={clearMoreFilters} />

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
            <ArrowUpDown className="size-4" />
            <span>
              Sort: {SORT_FIELDS.find((f) => f.value === sortField)?.label} (
              {sortDir === "asc" ? "↑" : "↓"})
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit min-w-0 p-0">
          <div className="p-4 pb-2 w-fit">
            <h3 className="font-medium text-sm mb-1">Sort By</h3>
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
                  {field.label}
                </Button>
              ))}
            </div>

            <div className="border-t p-2 pt-3">
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">
                Direction
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
                  Ascending
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
                  Descending
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
        className="text-xs border-red-500 text-red-700 hover:bg-red-100/10 hover:text-red-800"
        onClick={clearAllFilters}
      >
        Clear All Filters <FunnelX className="size-4" />
      </Button>
    </div>
  );
}
