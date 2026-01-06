// components/daily/FieldArraySection.tsx
"use client";

import clsx from "clsx";
import { useLocale } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { DailyFormValues } from "@/schema/dailay-page.schema";
import { LineItemRow } from "./line-item-row";
import { SectionTotalBar } from "./section-total-bar";
import { formatINR } from "@/lib/utils";

export function FieldArraySection({
  value,
  title,
  addButtonText,
  totalLabel,
  totalValue,
  totalBarClassName,
  showNet,
  netForDay,
}: {
  value: "earnings" | "businessExpenses" | "dailySpends";
  title: string;
  addButtonText: string;
  totalLabel: string;
  totalValue: React.ReactNode;
  totalBarClassName?: string;
  showNet?: boolean;
  netForDay?: number;
}) {
  const { control } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "font-[inherit]");

  const fa = useFieldArray({ control, name: value });

  return (
    <AccordionItem value={value} className="pb-2">
      <AccordionTrigger
        className={clsx("py-2 text-base font-semibold text-primary", textCls)}
      >
        {title}
      </AccordionTrigger>

      <AccordionContent className="p-2 flex flex-col gap-4">
        {showNet && (
          <div className="flex items-center justify-between">
            <div>
              <div className={clsx("text-base font-medium", textCls)}>
                Net Earnings
              </div>
              <div
                className={clsx("text-xs text-muted-foreground", textCls)}
              ></div>
            </div>
            <div className="text-base font-semibold">
              {formatINR(netForDay || 0)}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            size={"sm"}
            variant="outline"
            onClick={() => fa.append({ label: "", amount: 0, tag: "" } as any)}
            className="w-full"
          >
            {addButtonText}
          </Button>
        </div>

        <div className="space-y-3">
          {fa.fields.map((f, idx) => (
            <LineItemRow
              key={f.id}
              namePrefix={`${value}.${idx}` as const}
              onRemove={() => fa.remove(idx)}
            />
          ))}
        </div>
      </AccordionContent>

      <SectionTotalBar
        className={totalBarClassName}
        label={<span className={textCls}>{totalLabel}</span>}
        value={totalValue}
      />
    </AccordionItem>
  );
}
