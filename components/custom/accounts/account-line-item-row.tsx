"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { AmountInput } from "../daily-page/common-components/amount-input";
import { AccountComboBox } from "./accounts-combobox";
import { DailyFormValues } from "@/schema/daily-page.schema";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type RowPrefix = `creditItems.${number}` | `debitItems.${number}`;

type Props = {
  namePrefix: RowPrefix;
  onRemove: () => void;
  disabled?: boolean;
};

type AccountsCache = Record<string, string>;

export function AccountLineItemRow({ namePrefix, onRemove, disabled }: Props) {
  const tCommon = useTranslations("Common");
  const { control, setValue } = useFormContext<DailyFormValues>();

  // Watch this row live (so view mode always shows latest values)
  const row = useWatch({ control, name: namePrefix });

  // Watch cache map: { [accountId]: accountName }
  const accountsCache = useWatch({ control, name: "accountsCache" }) as
    | AccountsCache
    | undefined;

  const accountId =
    row && typeof row === "object" && "accountId" in row
      ? String(row.accountId ?? "")
      : "";

  const label =
    row && typeof row === "object" && "label" in row
      ? String(row.label ?? "")
      : "";

  const amount =
    row && typeof row === "object" && "amount" in row ? row.amount : 0;

  const accountName =
    (accountsCache && accountId && accountsCache[accountId]) || "";

  const [isEditing, setIsEditing] = React.useState(true);

  const isRowValid =
    accountId.trim().length > 0 &&
    label.trim().length > 0 &&
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount > 0;

  return (
    <div
      className="rounded-md border p-3 shadow-sm cursor-pointer"
      onClick={() => {
        if (!isEditing && !disabled) setIsEditing(true);
      }}
    >
      {/* VIEW MODE (single line) */}
      {!isEditing ? (
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between">
          <Badge variant={"secondary"} className="text-base">
            {accountName || accountId || "—"}
          </Badge>

          <div className=" w-full text-right">{label || "—"}</div>

          <div className="text-base font-semibold md:text-right">
            {formatINR(amount)}
          </div>
        </div>
      ) : (
        <>
          {/* EDIT HEADER: account + actions */}
          <div className="flex w-full justify-between items-center gap-3">
            <FormField
              control={control}
              name={`${namePrefix}.accountId` as const}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <AccountComboBox
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={disabled}
                      /**
                       * IMPORTANT: this is how we get account name without server calls.
                       * AccountComboBox should call this when it knows the selected account's name.
                       */
                      onAccountMeta={(meta) => {
                        if (!meta?.id || !meta?.name) return;
                        setValue(
                          "accountsCache",
                          {
                            ...(accountsCache ?? {}),
                            [meta.id]: meta.name,
                          },
                          { shouldDirty: false },
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (!isRowValid) return;
                setIsEditing(false);
              }}
              disabled={disabled || !isRowValid}
              className="w-auto border-green-700 border text-green-700 bg-transparent"
            >
              <Check className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={disabled}
              className="w-auto border-red-700 border text-red-700 bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* EDIT BODY: label + amount */}
          <div className="flex w-full gap-2 flex-col md:flex-row justify-between items-center mt-2">
            <FormField
              control={control}
              name={`${namePrefix}.label` as const}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={tCommon("For")}
                      readOnly={disabled}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`${namePrefix}.amount` as const}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <AmountInput
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                      inputClassName="h-full text-xl! font-semibold border-0 shadow-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
