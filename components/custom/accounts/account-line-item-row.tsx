"use client";

import { Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { AccountComboBox } from "./accounts-combobox";
import { DailyFormValues } from "@/schema/daily-page.schema";

type RowPrefix = `creditItems.${number}` | `debitItems.${number}`;

type Props = {
  namePrefix: RowPrefix;
  onRemove: () => void;
  disabled?: boolean;
};

export function AccountLineItemRow({ namePrefix, onRemove, disabled }: Props) {
  const { control } = useFormContext<DailyFormValues>();
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.2fr_1.2fr_0.8fr_auto] md:items-start">
      <FormField
        control={control}
        name={`${namePrefix}.accountId` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <AccountComboBox
                value={field.value || ""}
                onChange={field.onChange}
                disabled={disabled}
                placeholder="Select / create account"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.label` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} placeholder="Label" readOnly={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.amount` as const}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? "" : Number(v));
                }}
                placeholder="Amount"
                inputMode="decimal"
                readOnly={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="button"
        variant="secondary"
        size={"sm"}
        onClick={onRemove}
        disabled={disabled}
        className="w-full md:w-auto border-red-700 border text-red-700 bg-transparent"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
