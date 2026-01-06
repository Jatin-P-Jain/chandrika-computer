"use client";

import clsx from "clsx";
import { useLocale } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { DailyFormValues, dailySchema } from "@/schema/dailay-page.schema";
import { formatINR, sumAmounts } from "@/lib/utils";
import { FixedExpensesSection } from "./sections.tsx/fixed-expenses";
import { FieldArraySection } from "./common-components/field-array-section";
import { AmountInput } from "./common-components/amount-input";

export default function DailyPage() {
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "font-[inherit]");

  const form = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    defaultValues: {
      fixed: { sd: 0, sc: 0, fs: 0 },
      earnings: [],
      businessExpenses: [],
      dailySpends: [],
      totalCashCollected: 0,
    },
    mode: "onChange",
  });

  // Watches + totals (core logic stays here)
  const fixed = useWatch({ control: form.control, name: "fixed" });
  const earnings = useWatch({ control: form.control, name: "earnings" });
  const businessExpenses = useWatch({
    control: form.control,
    name: "businessExpenses",
  });
  const dailySpends = useWatch({ control: form.control, name: "dailySpends" });

  const totalFixed = (fixed?.sd ?? 0) + (fixed?.sc ?? 0) + (fixed?.fs ?? 0);
  const totalEarnings = sumAmounts(earnings);
  const totalBusiness = sumAmounts(businessExpenses);
  const totalSpends = sumAmounts(dailySpends);
  const netForDay = totalEarnings - (totalFixed + totalBusiness + totalSpends);

  const onSubmit = (values: DailyFormValues) => {
    console.log("Daily form submit:", values);
  };

  return (
    <Card className="w-full p-6 py-3 shadow-sm border rounded-md dark:bg-slate-800 gap-2 overflow-auto">
      <div
        className={clsx(
          "w-full text-center text-shadow-xs text-lg font-semibold font-script flex flex-col",
          textCls
        )}
      >
        <span className="text-base text-yellow-700">ॐ</span>
        <span className="text-orange-600"> श्री गणेशाय नमः</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion
            type="multiple"
            className="w-full max-h-[40vh] overflow-auto no-scrollbar"
          >
            <FixedExpensesSection
              totalBarClassName="p-2"
              totalFixed={
                Number(formatINR(totalFixed)) ? totalFixed : totalFixed
              }
            />

            <FieldArraySection
              value="earnings"
              title="Earnings"
              addButtonText="Add earning"
              totalLabel="Total earnings"
              totalValue={formatINR(totalEarnings)}
              totalBarClassName="bg-green-100! text-green-900! p-2"
              showNet={true}
              netForDay={netForDay}
            />

            <FieldArraySection
              value="businessExpenses"
              title="Business Expense"
              addButtonText="Add expense"
              totalLabel="Total business expense"
              totalValue={formatINR(totalBusiness)}
              totalBarClassName="p-2"
            />

            <FieldArraySection
              value="dailySpends"
              title="Daily Spends"
              addButtonText="Add spend"
              totalLabel="Total daily spends"
              totalValue={formatINR(totalSpends)}
              totalBarClassName="p-2"
            />
          </Accordion>

          {/* Final input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalCashCollected"
              render={({ field }) => (
                <div className="flex flex-col">
                  <FormItem className="flex">
                    <FormLabel
                      className={clsx("text-base text-center w-full", textCls)}
                    >
                      Total Cash Collected :
                    </FormLabel>
                    <FormControl>
                      <div className="w-1/2">
                        <AmountInput
                          value={Number(field.value) || 0}
                          onChange={(n) => field.onChange(n)}
                          inputClassName="h-full text-lg w-full border-0 shadow-none"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                  <FormMessage className="text-xs" />
                </div>
              )}
            />

            <Button type="submit" className="md:justify-self-end">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
