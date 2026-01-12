"use client";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ListFilterPlus, ChevronDown } from "lucide-react";
import { FiltersSection } from "./filter-section/filters-section";
import { useTranslations } from "next-intl";

export const MobileFilters = () => {
  const tFilters = useTranslations("Filters");
  return (
    <Collapsible className="md:hidden flex w-full flex-col bg-background px-4 py-1 rounded-md shadow-sm">
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
            <ChevronDown />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="flex gap-2 w-full">
        <FiltersSection />
      </CollapsibleContent>
    </Collapsible>
  );
};
