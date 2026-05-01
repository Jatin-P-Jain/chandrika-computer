// components/daily/FixedExpensesSection.tsx
"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { DailyFormValues } from "@/schema/daily-page.schema";
import { AmountInput } from "../common-components/amount-input";
import { SectionTotalBar } from "../common-components/section-total-bar";
import { formatINR } from "@/lib/utils";
import { useEffect } from "react";
import { AddLineItemButton } from "../common-components/add-line-item-button";
import { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";
import { InfoIcon } from "lucide-react";
import { ReadOnlyLineItem } from "../common-components/read-line-item-row";
import { LineItemRow } from "../common-components/line-item-row";

export function FixedExpensesSection({
  readOnly,
  totalFixed,
  totalBarClassName,
  readings,
  onPersist,
}: {
  readOnly: boolean;
  totalFixed: number;
  totalBarClassName?: string;
  readings?: {
    photocopy: PhotocopyReadingDoc | null;
    stamp: StampReadingDoc | null;
  };
  onPersist?: () => void | Promise<void>;
}) {
  const tDailyAccount = useTranslations("DailyAccount");
  const tReadings = useTranslations("Readings");
  const { control, setValue } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = clsx(isHi && "font-[inherit] text-lg!");
  const textBodyCls = clsx(isHi && "font-[inherit] text-base");
  const textSmCls = clsx(isHi && "font-[inherit] text-sm!");

  const stampDutyValue = readings?.stamp?.totalAmount || 0;
  const photocopyValue = readings?.photocopy?.amount || 0;
  const flexCardValue =
    useWatch({
      control,
      name: "fixed.flexnCard",
    }) || 0;

  const surchargeValue = Number(stampDutyValue * 0.3) || 0;

  useEffect(() => {
    setValue("fixed.sd", stampDutyValue, {
      shouldValidate: true,
      // Prevent view-mode from marking the form dirty just because SD is derived.
      shouldDirty: !readOnly,
    });
    setValue("fixed.sc", surchargeValue, {
      shouldValidate: true,
      // Prevent view-mode from marking the form dirty just because SC is derived.
      shouldDirty: !readOnly,
    });
    setValue("fixed.fs", photocopyValue, {
      shouldValidate: true,
      // Prevent view-mode from marking the form dirty just because FS is derived.
      shouldDirty: !readOnly,
    });
  }, [surchargeValue, stampDutyValue, photocopyValue, setValue, readOnly]);

  const fa = useFieldArray({ control, name: "fixed.otherFixedExpenses" });
  const otherFixedExpenses = useWatch({
    control: control, // or "control" if you already have it
    name: "fixed.otherFixedExpenses",
  });

  const last =
    Array.isArray(otherFixedExpenses) && otherFixedExpenses.length
      ? otherFixedExpenses[otherFixedExpenses.length - 1]
      : undefined;

  const disableAdd =
    readOnly ||
    (last
      ? !(String(last.label ?? "").trim().length > 0 && Number(last.amount) > 0)
      : false);

  return (
    <AccordionItem
      value="fixed"
      className="p-1 md:flex md:h-full md:flex-col rounded-md border shadow-sm lg:shadow-none lg:border-0 lg:border-b lg:rounded-none"
    >
      <AccordionTrigger
        className={clsx(
          "text-base font-semibold text-primary justify-between p-2 pb-0 lg:border-b",
          textHeadCls,
        )}
      >
        {tDailyAccount("FixedExpenses")}
      </AccordionTrigger>

      <AccordionContent className="p-2 flex flex-col gap-4 justify-between">
        <div className="grid grid-cols-1 gap-2 ">
          <span
            className={clsx(
              "flex text-xs text-muted-foreground italic gap-1 items-center",
              textSmCls,
            )}
          >
            <InfoIcon className="size-3" />
            {tReadings("Info")}
          </span>
          <FormField
            control={control}
            name="fixed.sd"
            render={() => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    {tDailyAccount("StampDuty")}:
                  </FormLabel>

                  <FormControl>
                    {readOnly ? (
                      <div
                        className={clsx(
                          "font-semibold tabular-nums",
                          textHeadCls,
                        )}
                      >
                        {formatINR(stampDutyValue)}
                      </div>
                    ) : (
                      <AmountInput
                        readOnly={true}
                        value={stampDutyValue}
                        onChange={() => {}}
                        inputClassName={textHeadCls}
                        className="border-0 shadow-none"
                      />
                    )}
                  </FormControl>
                </FormItem>

                {!readOnly && <FormMessage />}
              </>
            )}
          />

          <FormField
            control={control}
            name="fixed.sc"
            render={() => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    <p className="flex flex-col gap-0">
                      <span>{tDailyAccount("SurCharge")}:</span>
                      <span className="text-xs text-muted-foreground">
                        (SC = SD X 30%)
                      </span>
                    </p>
                  </FormLabel>

                  <FormControl>
                    {readOnly ? (
                      <div
                        className={clsx(
                          "font-semibold tabular-nums",
                          textHeadCls,
                        )}
                      >
                        {formatINR(Number(surchargeValue) || 0)}
                      </div>
                    ) : (
                      <AmountInput
                        readOnly={true}
                        value={Number(surchargeValue) || 0}
                        onChange={() => {}}
                        inputClassName={textHeadCls}
                        className="border-0 shadow-none"
                      />
                    )}
                  </FormControl>
                </FormItem>

                {!readOnly && <FormMessage />}
              </>
            )}
          />

          <FormField
            control={control}
            name="fixed.fs"
            render={() => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    {tDailyAccount("Photocopy")}:
                  </FormLabel>

                  <FormControl>
                    {readOnly ? (
                      <div
                        className={clsx(
                          "font-semibold tabular-nums",
                          textHeadCls,
                        )}
                      >
                        {formatINR(Number(photocopyValue) || 0)}
                      </div>
                    ) : (
                      <AmountInput
                        readOnly={true}
                        value={photocopyValue}
                        onChange={() => {}}
                        inputClassName={textHeadCls}
                        className="border-0 shadow-none"
                      />
                    )}
                  </FormControl>

                  {!readOnly && <FormMessage />}
                </FormItem>
              </>
            )}
          />
          <FormField
            control={control}
            name="fixed.flexnCard"
            render={({ field }) => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    {tDailyAccount("FlexAndCard")}:
                  </FormLabel>

                  <FormControl>
                    {readOnly ? (
                      <div
                        className={clsx(
                          "font-semibold tabular-nums",
                          textHeadCls,
                        )}
                      >
                        {formatINR(Number(flexCardValue) || 0)}
                      </div>
                    ) : (
                      <AmountInput
                        value={Number(field.value) || 0}
                        onChange={(n) => field.onChange(n)}
                        onBlur={onPersist}
                        inputClassName={textHeadCls}
                      />
                    )}
                  </FormControl>

                  {!readOnly && <FormMessage />}
                </FormItem>
              </>
            )}
          />
          <div className="flex flex-col gap-2 overflow-auto max-h-120 no-scrollbar p-1">
            {fa.fields.map((f, idx) =>
              readOnly ? (
                <ReadOnlyLineItem
                  key={f.id}
                  namePrefix={`fixed.otherFixedExpenses.${idx}`}
                  textHeadCls={textHeadCls}
                  textBodyCls={textBodyCls}
                />
              ) : (
                <LineItemRow
                  key={f.id}
                  namePrefix={`fixed.otherFixedExpenses.${idx}`}
                  onRemove={() => fa.remove(idx)}
                  onPersist={onPersist}
                />
              ),
            )}
          </div>

          <AddLineItemButton
            onAdd={() => {
              console.log(fa.fields);
              fa.append(
                { label: "", amount: 0, tags: [] },
                { shouldFocus: false },
              );
            }}
            buttonText={tDailyAccount("AddFixedExpense")}
            disabled={disableAdd}
          />
        </div>
      </AccordionContent>

      <SectionTotalBar
        className={clsx("mt-auto", totalBarClassName)}
        label={
          <span className={textBodyCls}>{tDailyAccount("TotalFixed")}</span>
        }
        value={formatINR(totalFixed)}
        valueClassName={textHeadCls}
      />
    </AccordionItem>
  );
}
