// components/daily/FieldArraySection.tsx
"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DailyFormValues } from "@/schema/daily-page.schema";
import { LineItemRow } from "./line-item-row";
import { SectionTotalBar } from "./section-total-bar";
import { formatINR } from "@/lib/utils";
import { ReadOnlyLineItem } from "./read-line-item-row";
import { AddLineItemButton } from "./add-line-item-button";

export function FieldArraySection({
  readOnly,
  value,
  title,
  addButtonText,
  totalLabel,
  totalValue,
  totalBarClassName,
  showNet,
  netForDay,
}: {
  readOnly: boolean;
  value: "earnings.otherIncomes" | "businessExpenses" | "dailySpends";
  title: string;
  addButtonText: string;
  totalLabel?: string;
  totalValue?: React.ReactNode;
  totalBarClassName?: string;
  showNet?: boolean;
  netForDay?: number;
}) {
  const tDailyAccount = useTranslations("DailyAccount");
  const { control } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = clsx(isHi && "text-lg font-[inherit]");
  const textBodyCls = clsx(isHi && "text-base! font-[inherit]");

  const fa = useFieldArray({ control, name: value });

  return (
    <AccordionItem
      value={value}
      className="p-1 md:h-full md:flex md:flex-col rounded-md border shadow-sm lg:shadow-none lg:border-0 lg:border-b lg:rounded-none"
    >
      <AccordionTrigger
        className={clsx(
          "p-2 text-base font-semibold text-primary justify-between lg:border-b items-center pb-0",
          textHeadCls,
        )}
      >
        {title}
      </AccordionTrigger>

      <AccordionContent className="p-2 flex flex-col gap-2 justify-between">
        {showNet && (
          <div className="flex items-center justify-between">
            <div>
              <div className={clsx("text-sm font-medium", textBodyCls)}>
                {tDailyAccount("NetIncome")}
              </div>
            </div>
            <div className={clsx("text-base font-semibold", textHeadCls)}>
              {formatINR(netForDay || 0)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 overflow-auto max-h-120 no-scrollbar p-1">
          {fa.fields.map((f, idx) =>
            readOnly ? (
              <ReadOnlyLineItem
                key={f.id}
                control={control}
                namePrefix={`${value}.${idx}`}
                textHeadCls={textHeadCls}
                textBodyCls={textBodyCls}
              />
            ) : (
              <LineItemRow
                key={f.id}
                namePrefix={`${value}.${idx}`}
                onRemove={() => fa.remove(idx)}
              />
            ),
          )}
        </div>

        <div className="flex items-center justify-between">
          {!readOnly && (
            <AddLineItemButton
              onAdd={() => fa.append({ label: "", amount: 0, tags: [] })}
              buttonText={addButtonText}
            />
          )}
        </div>
      </AccordionContent>

      <SectionTotalBar
        className={clsx("mt-auto", totalBarClassName)}
        label={<span className={textBodyCls}>{totalLabel}</span>}
        value={totalValue}
        valueClassName={textHeadCls}
      />
    </AccordionItem>
  );
}
