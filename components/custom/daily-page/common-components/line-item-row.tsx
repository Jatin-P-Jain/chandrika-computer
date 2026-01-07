"use client";

import clsx from "clsx";
import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { useState } from "react";

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
import { TagInput } from "./tag-input";
import { formatINR } from "@/lib/utils";
import { useKeyboard } from "@/context/keyboard-context";

type RowPrefix =
  | `earnings.otherIncomes.${number}`
  | `businessExpenses.${number}`
  | `dailySpends.${number}`;

export function LineItemRow({
  namePrefix,
  onRemove,
}: {
  namePrefix: RowPrefix;
  onRemove: () => void;
}) {
  const tCommon = useTranslations("Common");
  const { control, getValues } = useFormContext<DailyFormValues>();
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHeadCls = clsx(isHi && "text-lg! font-[inherit]");
  const textBodyCls = clsx(isHi && "text-base! font-medium! font-[inherit]");

  // UI-only state (doesn't affect RHF values)
  const [isEditing, setIsEditing] = useState(true);
  // const inputRef = useRef<HTMLInputElement>(null);

  const { setActiveElement } = useKeyboard();

  // read current values for view mode (keeps submit logic unchanged)
  const amount = Number(getValues(`${namePrefix}.amount` as any)) || 0;
  const label = (getValues(`${namePrefix}.label` as any) as string) || "";
  const tags =
    (getValues(`${namePrefix}.tags` as any) as string[] | undefined) ?? [];

  const isRowValid = amount > 0 && label.trim().length > 0;

  return (
    <div
      className="flex flex-col items-center rounded-md border w-full p-2 gap-2"
      onClick={() => {
        if (!isEditing) {
          setIsEditing(true);
        }
      }}
    >
      {/* VIEW MODE */}
      {!isEditing && (
        <div className="w-full">
          <div className="flex flex-col items-start justify-between gap-1">
            <div className="flex justify-between items-center w-full gap-0 ">
              <div
                className={clsx(
                  "text-base font-semibold truncate",
                  textHeadCls
                )}
              >
                {formatINR(amount)}
              </div>
              <div
                className={clsx(
                  "text-base text-muted-foreground wrap-break-word",
                  textBodyCls
                )}
              >
                {label || "—"}
              </div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, idx) => (
                    <Badge
                      key={`${t}-${idx}`}
                      variant="secondary"
                      className="rounded-md"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No tags</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <>
          <FormField
            control={control}
            name={`${namePrefix}.amount`}
            render={({ field }) => (
              <FormItem className="w-full gap-1">
                <FormLabel className={textBodyCls}>
                  {tCommon("Amount")}
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
            )}
          />

          <FormField
            control={control}
            name={`${namePrefix}.label`}
            render={({ field, fieldState }) => (
              <FormItem className="w-full gap-1">
                <FormLabel className={textBodyCls}>{tCommon("For")}</FormLabel>
                <FormControl>
                  {/* NOTE: Input doesn't support type="textarea"; keep Input or switch to <Textarea/> */}
                  <Input
                    {...field}
                    ref={(el) => field.ref(el)}
                    onFocus={(e) => setActiveElement(e.currentTarget)}
                    placeholder={tCommon("EnterHere")}
                    className={textBodyCls}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${namePrefix}.tags`}
            render={({ field }) => (
              <FormItem className="w-full gap-1">
                <FormLabel className={textBodyCls}>
                  {tCommon("Tags")}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({tCommon("Optional")})
                  </span>
                </FormLabel>

                <FormControl>
                  <TagInput
                    label=""
                    values={(field.value as string[] | undefined) ?? []}
                    onChange={(vals) => field.onChange(vals)}
                    placeholder={tCommon("TypeAndEnter")}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-2 items-center w-full">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRemove}
              aria-label="Remove row"
              className="w-[45%] border-red-600 bg-red-100 text-red-700 hover:bg-red-200 hover:border-red-700"
            >
              <X className="size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!isRowValid}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
              }}
              aria-label="Mark done"
              className={clsx(
                "w-[45%] border-green-600 bg-green-100 text-green-700 hover:bg-green-200 hover:border-green-700",
                !isRowValid ? "opacity-30! cursor-not-allowed" : ""
              )}
            >
              <Check className="size-4" />
            </Button>
          </div>
        </>
      )}

      {/* Hidden fields (optional safety) */}
      {/* If you ever unmount edit fields completely, keep these to preserve registration. [web:149] */}
    </div>
  );
}
