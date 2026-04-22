"use client";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ListFilterPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";

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
  const [open, setOpen] = useState(false);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={clsx(
        "lg:hidden flex w-full flex-col bg-background px-4 py-1 md:py-2 rounded-md shadow-sm transition-all duration-300",
        open ? "h-40 md:h-32" : "md:h-10 h-8",
      )}
    >
      <div className="flex items-center gap-4 w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 w-full justify-between text-sm text-muted-foreground"
          >
            <span className="flex justify-center items-center gap-2 ">
              <ListFilterPlus className="size-4" />
              {tFilters("Filters")}
            </span>
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div
          className={clsx(
            "flex gap-2 w-full transition-all duration-800 opacity-0",
            open ? "opacity-100" : "",
          )}
        >
          <FiltersSection />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
