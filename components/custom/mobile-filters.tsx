"use client";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListFilterPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { SortControl } from "./filter-section/sort-control";

const FiltersSection = dynamic(
  () =>
    import("./filter-section/filters-section").then((m) => m.FiltersSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-full animate-pulse rounded-md border bg-muted/40" />
    ),
  },
);

export const MobileFilters = () => {
  const tFilters = useTranslations("Filters");
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    "fromDate",
    "toDate",
    "createdBy",
    "updatedBy",
    "tags",
  ].reduce((count, key) => (searchParams.get(key) ? count + 1 : count), 0);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={clsx(
        "lg:hidden flex w-full flex-col bg-background p-1 rounded-md shadow-sm transition-all duration-300 overflow-hidden",
        open ? "max-h-[72vh]" : "max-h-11",
      )}
    >
      <div className="grid grid-cols-2 gap-2 items-center w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={clsx(
              "h-8 w-full justify-between px-2 text-sm text-muted-foreground transition-all duration-300 hover:shadow-md",
              open && "text-primary border-primary",
            )}
          >
            <span className="flex items-center gap-1.5">
              <ListFilterPlus className="size-4" />
              {tFilters("Filters")}
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1 text-[11px] leading-none"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            {open ? (
              <ChevronUp className="transition-transform" />
            ) : (
              <ChevronDown className="transition-transform" />
            )}
          </Button>
        </CollapsibleTrigger>

        <SortControl className="h-8 px-2 text-sm text-muted-foreground" />
      </div>

      <CollapsibleContent>
        <div
          className={clsx(
            "flex flex-col gap-2 w-full transition-all duration-300 opacity-0 pt-2 overflow-y-auto",
            open ? "opacity-100" : "",
          )}
        >
          <FiltersSection />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
