// components/daily/FixedExpensesSection.tsx
"use client";

import clsx from "clsx";
import { useLocale } from "next-intl";
import { useFormContext } from "react-hook-form";

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

export function FixedExpensesSection({
  totalFixed,
  totalBarClassName,
}: {
  totalFixed: number;
  totalBarClassName?: string;
}) {
  const { control } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "font-[inherit]");

  return (
    <AccordionItem value="fixed" className="pb-2">
      <AccordionTrigger
        className={clsx("text-base font-semibold py-2 text-primary", textCls)}
      >
        Fixed Expenses / Charges
      </AccordionTrigger>

      <AccordionContent className="p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <FormField
            control={control}
            name="fixed.sd"
            render={({ field }) => (
              <>
                <FormItem className="flex">
                  <FormLabel className={clsx("w-full", textCls)}>
                    Stamp Duty (SD)
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                      inputClassName="w-fit border-0 shadow-none"
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
                  <FormLabel className={clsx("w-full", textCls)}>
                    Sur Charge (SC)
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                      inputClassName="w-fit border-0 shadow-none"
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
                  <FormLabel className={clsx("w-full", textCls)}>
                    Photocopy (FS)
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                      inputClassName="w-fit border-0 shadow-none"
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
        className={totalBarClassName}
        label={<span className={textCls}>Total fixed</span>}
        value={formatINR(totalFixed)}
      />
    </AccordionItem>
  );
}
