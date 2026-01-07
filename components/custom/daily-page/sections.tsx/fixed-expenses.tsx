// components/daily/FixedExpensesSection.tsx
"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

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

import type { DailyFormValues } from "@/schema/dailay-page.schema";
import { AmountInput } from "../common-components/amount-input";
import { SectionTotalBar } from "../common-components/section-total-bar";
import { formatINR } from "@/lib/utils";
import { useEffect } from "react";

export function FixedExpensesSection({
  totalFixed,
  totalBarClassName,
}: {
  totalFixed: number;
  totalBarClassName?: string;
}) {
  const tDailyAccount = useTranslations("DailyAccount");
  const { control, setValue } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = clsx(isHi && "font-[inherit] text-lg!");
  const textBodyCls = clsx(isHi && "font-[inherit] text-base");

  const stampDutyValue =
    useWatch({
      control,
      name: "fixed.sd",
    }) || 0;
  const surchargeValue = Number(stampDutyValue * 0.3) || 0;

  useEffect(() => {
    setValue("fixed.sc", surchargeValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [surchargeValue, setValue]);

  return (
    <AccordionItem
      value="fixed"
      className="p-1 md:flex md:h-full md:flex-col rounded-md border shadow-sm lg:shadow-none lg:border-0 lg:border-b lg:rounded-none"
    >
      <AccordionTrigger
        className={clsx(
          "text-base font-semibold text-primary justify-center py-2 lg:border-b",
          textHeadCls
        )}
      >
        {tDailyAccount("FixedExpenses")}
      </AccordionTrigger>

      <AccordionContent className="p-2 flex flex-col gap-4 justify-between">
        <div className="grid grid-cols-1 gap-2 ">
          <FormField
            control={control}
            name="fixed.sd"
            render={({ field }) => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    {tDailyAccount("StampDuty")}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                      inputClassName={textHeadCls}
                    />
                  </FormControl>
                </FormItem>
                <FormMessage />
              </>
            )}
          />

          <FormField
            control={control}
            name="fixed.sc"
            render={({ field }) => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    <p className="flex flex-col gap-0">
                      <span>{tDailyAccount("SurCharge")}</span>
                      <span className="text-xs text-muted-foreground">
                        (SC = SD X 30%)
                      </span>
                    </p>
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      readOnly={true}
                      value={Number(surchargeValue) || 0}
                      onChange={() => {}}
                      inputClassName={textHeadCls}
                    />
                  </FormControl>
                </FormItem>
                <FormMessage />
              </>
            )}
          />

          <FormField
            control={control}
            name="fixed.fs"
            render={({ field }) => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textBodyCls)}>
                    {tDailyAccount("Photocopy")}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                      inputClassName={textHeadCls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </>
            )}
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
