"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
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
import { Loader2, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/useAuth";
import { createDailyAccountItem } from "@/app/daily-account/actions";
import { toast } from "sonner";

export default function DailyPage() {
  const tCommon = useTranslations("Common");
  const tToast = useTranslations("Toast");
  const tDailyAccount = useTranslations("DailyAccount");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "text-lg font-[inherit]");

  const form = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    defaultValues: {
      fixed: { sd: 0, sc: 0, fs: 0 },
      earnings: { netIncome: 0, otherIncomes: [] },
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
  const totalCashCollected = useWatch({
    control: form.control,
    name: "totalCashCollected",
  });
  const totalFixed = (fixed?.sd ?? 0) + fixed?.sd * 0.3 + (fixed?.fs ?? 0);
  const totalBusiness = sumAmounts(businessExpenses);
  const totalSpends = sumAmounts(dailySpends);
  const netForDay =
    totalCashCollected - (totalFixed + totalBusiness + totalSpends);
  const totalEarnings = earnings.netIncome + sumAmounts(earnings.otherIncomes);

  const { getUserToken } = useAuth();

  useEffect(() => {
    form.setValue("earnings.netIncome", netForDay, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [netForDay, form]);

  const onSubmit = async (data: DailyFormValues) => {
    console.log("Daily form submit:", data);
    const token = await getUserToken();
    if (!token) {
      return;
    }
    const accountExistsErrorMessage = tToast("DailyAccountExists");
    const saveResponse = await createDailyAccountItem(data, token,accountExistsErrorMessage);
    if (!!saveResponse.error || !saveResponse.docId) {
      toast.error("Error!", { description: saveResponse.error });
      return;
    }
    toast.success("Success!", { description: tToast("DailyAccountCreated") });
  };

  const isFormReady = form.formState.isSubmitted || form.formState.isDirty;
  const canSubmit = form.formState.isValid && isFormReady;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="w-full p-2 py-3 shadow-sm border rounded-md dark:bg-slate-800 gap-2 overflow-auto h-full relative min-h-[60vh] border-primary">
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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 gap-4"
        >
          <Accordion
            defaultValue={[
              "fixed",
              "earnings.otherIncomes",
              "businessExpenses",
              "dailySpends",
            ]}
            orientation="horizontal"
            type="multiple"
            className="grow min-h-0 lg:grid lg:grid-cols-4 gap-4 flex flex-col w-full overflow-auto no-scrollbar pb-2"
          >
            <FixedExpensesSection
              totalBarClassName="p-2"
              totalFixed={
                Number(formatINR(totalFixed)) ? totalFixed : totalFixed
              }
            />

            <FieldArraySection
              value="earnings.otherIncomes"
              title={tDailyAccount("Income")}
              addButtonText={tDailyAccount("AddIncome")}
              totalLabel={tDailyAccount("TotalIncome")}
              totalValue={formatINR(totalEarnings)}
              totalBarClassName="bg-green-100! text-green-900! p-2"
              showNet={true}
              netForDay={netForDay}
            />

            <FieldArraySection
              value="businessExpenses"
              title={tDailyAccount("BusinessExpense")}
              addButtonText={tDailyAccount("AddExpense")}
              totalLabel={tDailyAccount("TotalBusinessExpense")}
              totalValue={formatINR(totalBusiness)}
              totalBarClassName="p-2"
            />

            <FieldArraySection
              value="dailySpends"
              title={tDailyAccount("DailySpends")}
              addButtonText={tDailyAccount("AddSpend")}
              totalLabel={tDailyAccount("TotalDailySpends")}
              totalValue={formatINR(totalSpends)}
              totalBarClassName="p-2"
            />
          </Accordion>

          {/* Final input */}
          <div className="flex gap-4 w-full justify-center items-center mt-auto flex-col lg:flex-row">
            <FormField
              control={form.control}
              name="totalCashCollected"
              render={({ field }) => (
                <div className="flex flex-col">
                  <FormItem className="flex">
                    <FormLabel
                      className={clsx("text-base text-center w-full", textCls)}
                    >
                      {tDailyAccount("TotalCashCollected")}:
                    </FormLabel>
                    <FormControl>
                      <div className="w-1/2 md:w-full">
                        <AmountInput
                          value={Number(field.value) || 0}
                          onChange={(n) => field.onChange(n)}
                          inputClassName="h-full text-xl! font-semibold w-full border-0 shadow-none"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                  <FormMessage className="text-xs" />
                </div>
              )}
            />
            <Button
              disabled={!canSubmit || isSubmitting}
              type="submit"
              className="flex gap-2 lg:absolute lg:top-4 lg:right-4 font-semibold text-sm w-full lg:w-fit justify-center items-center"
            >
              <span>{isSubmitting ? tCommon("Saving") : tCommon("Save")}</span>
              {isSubmitting ? (
                <Loader2 className="animate-spin size-4" />
              ) : (
                <SaveIcon className="size-4" />
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
