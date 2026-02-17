"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DailyFormValues } from "@/schema/daily-page.schema";
import { AccountLineItemRow } from "./account-line-item-row";

type Props = {
  disabled?: boolean;
};

type LineItemLike = {
  accountId?: string;
  label?: string;
  amount?: number;
};

function isLastRowIncomplete(v: LineItemLike | undefined): boolean {
  if (!v) return false; // no rows => allow add
  const accountOk = (v.accountId ?? "").trim().length > 0;
  const labelOk = (v.label ?? "").trim().length > 0;
  const amountOk =
    typeof v.amount === "number" && Number.isFinite(v.amount) && v.amount > 0;
  return !(accountOk && labelOk && amountOk);
}

export function CreditDebitCardsSection({ disabled }: Props) {
  const { control } = useFormContext<DailyFormValues>();

  const credit = useFieldArray({
    control,
    name: "creditItems",
  });

  const debit = useFieldArray({
    control,
    name: "debitItems",
  });

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-16">
      <Card className="p-3 gap-2 shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Credits</div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disableAddCredit}
            onClick={() =>
              credit.append(
                { accountId: "", label: "", amount: 0 },
                { shouldFocus: false },
              )
            }
          >
            <Plus className="h-4 w-4" />
            Add
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

      <Card className="p-3 gap-2 shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Debits</div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disableAddDebit}
            onClick={() =>
              debit.append(
                { accountId: "", label: "", amount: 0 },
                { shouldFocus: false },
              )
            }
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-1">
          {debit.fields.map((f, index) => (
            <AccountLineItemRow
              key={f.id}
              namePrefix={`debitItems.${index}`}
              disabled={disabled}
              onRemove={() => debit.remove(index)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
