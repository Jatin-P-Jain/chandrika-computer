// components/daily/LineItemRow.tsx
"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { useFormContext } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { DailyFormValues } from "@/schema/dailay-page.schema";
import { AmountInput } from "./amount-input";

type RowPrefix =
  | `earnings.${number}`
  | `businessExpenses.${number}`
  | `dailySpends.${number}`;

export function LineItemRow({
  namePrefix,
  onRemove,
}: {
  namePrefix: RowPrefix;
  onRemove: () => void;
}) {
  const { control } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textCls = clsx(isHi && "font-[inherit]");

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-md border p-3">
      <FormField
        control={control}
        name={`${namePrefix}.label`}
        render={({ field }) => (
          <FormItem className="md:col-span-5">
            <FormLabel className={textCls}>Label</FormLabel>
            <FormControl>
              <Input placeholder="Enter label" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.amount`}
        render={({ field }) => (
          <FormItem className="md:col-span-3">
            <FormLabel className={textCls}>Amount</FormLabel>
            <FormControl>
              <AmountInput
                value={Number(field.value) || 0}
                onChange={(n) => field.onChange(n)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${namePrefix}.tag`}
        render={({ field }) => (
          <FormItem className="md:col-span-3">
            <FormLabel className={textCls}>
              Tag{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g. cash / upi / bank" {...field} />
            </FormControl>

            <div className="pt-2">
              {field.value ? (
                <Badge variant="secondary" className="rounded-md">
                  {String(field.value)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No tag</span>
              )}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      <div className="md:col-span-1 flex md:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Remove row"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
