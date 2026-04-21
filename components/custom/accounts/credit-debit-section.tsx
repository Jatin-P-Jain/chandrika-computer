"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DailyFormValues } from "@/schema/daily-page.schema";
import { AccountLineItemRow } from "./account-line-item-row";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";

type Props = {
  disabled?: boolean;
};

type LineItemLike = {
  accountId?: string;
  label?: string;
  amount?: number;
};

function isLastRowIncomplete(v: LineItemLike | undefined): boolean {
  if (!v) return false;
  const accountOk = (v.accountId ?? "").trim().length > 0;
  const labelOk = (v.label ?? "").trim().length > 0;
  const amountOk =
    typeof v.amount === "number" && Number.isFinite(v.amount) && v.amount > 0;
  return !(accountOk && labelOk && amountOk);
}

export type CreditDebitImperative = {
  addCredit: () => void;
  addDebit: () => void;
};

export const CreditDebitCardsSection = React.forwardRef<
  CreditDebitImperative,
  Props
>(function CreditDebitCardsSection({ disabled }: Props, ref) {
  const tCommon = useTranslations("Common");
  const tCreditsDebits = useTranslations("CreditsDebits");

  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = clsx(isHi && "text-base! font-[inherit]");

  const { control } = useFormContext<DailyFormValues>();

  const credit = useFieldArray({ control, name: "creditItems" });
  const debit = useFieldArray({ control, name: "debitItems" });

  const creditItems = useWatch({ control, name: "creditItems" });
  const debitItems = useWatch({ control, name: "debitItems" });

  const lastCredit =
    creditItems && creditItems.length
      ? creditItems[creditItems.length - 1]
      : undefined;
  const lastDebit =
    debitItems && debitItems.length
      ? debitItems[debitItems.length - 1]
      : undefined;

  const disableAddCredit = !!disabled || isLastRowIncomplete(lastCredit);
  const disableAddDebit = !!disabled || isLastRowIncomplete(lastDebit);

  const addCredit = React.useCallback(() => {
    credit.append(
      { accountId: "", label: "", amount: 0 },
      { shouldFocus: false },
    );
  }, [credit]);

  const addDebit = React.useCallback(() => {
    debit.append(
      { accountId: "", label: "", amount: 0 },
      { shouldFocus: false },
    );
  }, [debit]);

  React.useImperativeHandle(ref, () => ({ addCredit, addDebit }), [
    addCredit,
    addDebit,
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-36 gap-4">
      <Card className="p-3 gap-2 shadow-none h-fit border-0">
        <div className="flex items-center justify-between gap-2 border-b pb-2 rounded-md px-2">
          <div className={`text-sm font-semibold text-primary ${textHeadCls}`}>
            {tCreditsDebits("Credits")}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disableAddCredit}
            onClick={addCredit}
          >
            <Plus className="h-4 w-4" />
            {tCommon("Add")}
          </Button>
        </div>

        {credit.fields.map((f, index) => (
          <AccountLineItemRow
            key={f.id}
            namePrefix={`creditItems.${index}`}
            disabled={disabled}
            onRemove={() => credit.remove(index)}
          />
        ))}
      </Card>

      <Card className="p-3 gap-2 shadow-none h-fit border-0">
        <div className="flex items-center justify-between gap-2 border-b pb-2 rounded-md px-2">
          <div className={`text-sm font-semibold text-primary ${textHeadCls}`}>
            {tCreditsDebits("Debits")}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disableAddDebit}
            onClick={addDebit}
          >
            <Plus className="h-4 w-4" />
            {tCommon("Add")}
          </Button>
        </div>

        {debit.fields.map((f, index) => (
          <AccountLineItemRow
            key={f.id}
            namePrefix={`debitItems.${index}`}
            disabled={disabled}
            onRemove={() => debit.remove(index)}
          />
        ))}
      </Card>
    </div>
  );
});
