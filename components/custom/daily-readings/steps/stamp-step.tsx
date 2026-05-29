"use client";

import { Controller, Control, FieldErrors, useWatch } from "react-hook-form";
import { z } from "zod";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Loader2Icon,
  PlusCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReadingInput } from "@/components/custom/daily-page/common-components/reading-input";
import {
  stampReadingSchema,
  stampStockAdditionSchema,
} from "@/schema/readings.schema";
import { formatINR } from "@/lib/utils";
import type { Denomination } from "@/types/readings";

type StampFormInput = z.input<typeof stampReadingSchema>;
type StockFormInput = z.input<typeof stampStockAdditionSchema>;

type Props = {
  control: Control<StampFormInput>;
  errors: FieldErrors<StampFormInput>;
  stampFieldByDenom: Record<Denomination, "r50" | "r100" | "r500" | "r1000">;
  showStampCalculationByDenom: Record<Denomination, boolean>;
  stockControl: Control<StockFormInput>;
  stockErrors: FieldErrors<StockFormInput>;
  stockFieldByDenom: Record<Denomination, "s50" | "s100" | "s500" | "s1000">;
  denoms: Denomination[];
  stampPrev: Record<Denomination, number>;
  stampSold: Record<Denomination, number>;
  stampAmounts: Record<Denomination, number>;
  stampTotal: number;
  textPageHeadCls: string;
  textBodyCls: string;
  textSmCls: string;
  tCommon: (key: string) => string;
  tReadings: (
    key: string,
    values?: Record<string, string | number | Date>,
  ) => string;
  saving: boolean;
  loadingPrev: boolean;
  includeStockAddition: boolean;
  disableNext?: boolean;
  onBack: () => void;
  onNext: () => void;
  onToggleStockAddition?: (include: boolean) => void;
};

export default function StampStep({
  control,
  errors,
  stampFieldByDenom,
  showStampCalculationByDenom,
  stockControl,
  stockErrors,
  stockFieldByDenom,
  denoms,
  stampPrev,
  stampSold,
  stampAmounts,
  stampTotal,
  textPageHeadCls,
  textBodyCls,
  textSmCls,
  tCommon,
  tReadings,
  saving,
  loadingPrev,
  includeStockAddition,
  disableNext = false,
  onBack,
  onNext,
  onToggleStockAddition,
}: Props) {
  const s50 = useWatch({ control: stockControl, name: "s50" }) ?? 0;
  const s100 = useWatch({ control: stockControl, name: "s100" }) ?? 0;
  const s500 = useWatch({ control: stockControl, name: "s500" }) ?? 0;
  const s1000 = useWatch({ control: stockControl, name: "s1000" }) ?? 0;

  const stockByDenom: Record<Denomination, number> = {
    50: s50,
    100: s100,
    500: s500,
    1000: s1000,
  };

  const hasStockAdditionValue = includeStockAddition
    ? denoms.some((denom) => stockByDenom[denom] > 0)
    : false;
  const newReadingByDenom: Record<Denomination, number> = {
    50: stampPrev[50] + stockByDenom[50],
    100: stampPrev[100] + stockByDenom[100],
    500: stampPrev[500] + stockByDenom[500],
    1000: stampPrev[1000] + stockByDenom[1000],
  };

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-3 max-h-[50vh] overflow-auto no-scrollbar">
        {loadingPrev && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 justify-start">
            {tReadings("LoadingYesterdaysReadings")}{" "}
            <Loader2Icon className="size-3 animate-spin" />
          </div>
        )}

        <div className="grid md:grid-cols-4 grid-cols-1 gap-2 w-full">
          {denoms.map((denom) => {
            const fieldName = stampFieldByDenom[denom];
            const fieldError = errors[fieldName];
            const stockFieldName = stockFieldByDenom[denom];
            const stockFieldError = stockErrors[stockFieldName];

            return (
              <div key={denom} className="rounded-md border p-3 space-y-1">
                <div className={clsx("font-medium", textPageHeadCls)}>
                  ₹ {denom}
                </div>
                <div className={clsx("text-sm italic", textBodyCls)}>
                  {tReadings("ClosingStampSerialNumbers")}
                </div>
                <div
                  className={clsx(
                    "text-sm text-muted-foreground flex items-center justify-between pr-3",
                    textBodyCls,
                  )}
                >
                  {tReadings("Yesterday")}:{" "}
                  <span className={clsx("font-medium text-base", textPageHeadCls)}>
                    {stampPrev[denom]}
                  </span>
                </div>
                {includeStockAddition ? (
                  <div className="flex items-center gap-2 justify-between text-green-800">
                    <Label
                      className={clsx(
                        "text-sm w-full text-green-800",
                        textBodyCls,
                      )}
                    >
                      {tReadings("AddStock")} :
                    </Label>
                    <Controller
                      control={stockControl}
                      name={stockFieldName}
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                          inputClassName={clsx(
                            "w-fit! text-right",
                            textPageHeadCls,
                          )}
                        />
                      )}
                    />
                  </div>
                ) : null}
                {hasStockAdditionValue ? (
                  <div
                    className={clsx(
                      "flex items-center justify-between gap-2 font-medium bg-accent rounded-md px-2 py-1",
                      textSmCls,
                    )}
                  >
                    <div className={clsx("flex items-center gap-1 text-sm", textBodyCls)}>
                      {/* <Info className="size-4" /> */}
                      {tReadings("NewReading")}
                    </div>
                    <span className={clsx("font-medium text-base", textPageHeadCls)}>
                      {newReadingByDenom[denom]}
                    </span>
                  </div>
                ) : null}
                {stockFieldError ? (
                  <p className="text-xs text-destructive">
                    {String(stockFieldError.message)}
                  </p>
                ) : null}
                <div className="flex items-center gap-2 justify-between">
                  <Label
                    className={clsx(
                      "text-sm text-muted-foreground w-full",
                      textBodyCls,
                    )}
                  >
                    {tReadings("Today")} :
                  </Label>
                  <Controller
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                      <ReadingInput
                        value={(field.value as number) ?? 0}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0"
                        inputClassName={clsx(
                          "w-fit! text-right font-medium text-base",
                          textPageHeadCls,
                        )}
                      />
                    )}
                  />
                </div>
                {fieldError ? (
                  <p className="text-xs text-destructive">
                    {String(fieldError.message)}
                  </p>
                ) : null}

                <div
                  className={clsx(
                    "text-sm flex items-center justify-between mt-2 pr-3",
                    textBodyCls,
                  )}
                >
                  {tReadings("StampsSold")}: {" "}
                  <span
                    className={clsx("text-base font-semibold", textPageHeadCls)}
                  >
                    {showStampCalculationByDenom[denom] ? stampSold[denom] : 0}
                  </span>
                </div>
                <div
                  className={clsx(
                    "text-sm flex justify-between items-center",
                    textBodyCls,
                  )}
                >
                  {tCommon("Amount")}: {" "}
                  <span
                    className={clsx(
                      "font-semibold text-primary text-lg",
                      textPageHeadCls,
                    )}
                  >
                    {showStampCalculationByDenom[denom]
                      ? formatINR(stampAmounts[denom])
                      : formatINR(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-md border p-3 text-base flex flex-col gap-2 items-center justify-center">
          <span className={clsx("font-medium", textBodyCls)}>
            {tReadings("TotalStampDuty")} (SD):{" "}
            <span
              className={clsx(
                "text-xl tabular-nums text-primary font-semibold",
                textPageHeadCls,
              )}
            >
              {formatINR(stampTotal)}
            </span>
          </span>
          {includeStockAddition ? (
            <span className="text-xs text-muted-foreground">
              {tReadings("StockAdditionExplanation2")}
            </span>
          ) : null}
          <span className="text-xs text-amber-700 italic">
            {tReadings("NoteValuesUsedDirectly")}
          </span>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => onToggleStockAddition?.(!includeStockAddition)}
          disabled={saving}
          className={clsx(
            "gap-0 border-primary border text-primary hover:bg-primary/10 hover:text-primary text-base",
            includeStockAddition ? "border-red-600 text-red-600" : "",
          )}
        >
          {includeStockAddition ? (
            <span className="flex items-center gap-1">
              <XCircle className="size-4" />
              {tReadings("StockAddition")}{" "}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <PlusCircle className="size-4" />
              {tReadings("AddStock")}
            </span>
          )}
        </Button>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={saving}
            className="gap-0 text-base"
          >
            <ChevronLeft className="size-4" /> {tCommon("Back")}
          </Button>
          <Button
            onClick={onNext}
            disabled={saving || loadingPrev || disableNext}
            className="gap-0 text-base"
          >
            {tCommon("Next")} <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
