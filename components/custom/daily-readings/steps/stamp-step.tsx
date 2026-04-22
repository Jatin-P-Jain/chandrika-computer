"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReadingInput } from "@/components/custom/daily-page/common-components/reading-input";
import { stampReadingSchema } from "@/schema/readings.schema";
import { formatINR } from "@/lib/utils";
import type { Denomination } from "@/types/readings";

type StampFormInput = z.input<typeof stampReadingSchema>;

type Props = {
  control: Control<StampFormInput>;
  errors: FieldErrors<StampFormInput>;
  stampFieldByDenom: Record<Denomination, "r50" | "r100" | "r500" | "r1000">;
  denoms: Denomination[];
  stampPrev: Record<Denomination, number>;
  stampSold: Record<Denomination, number>;
  stampAmounts: Record<Denomination, number>;
  stampTotal: number;
  textBodyCls: string;
  textSmCls: string;
  tCommon: (key: string) => string;
  tReadings: (key: string) => string;
  saving: boolean;
  loadingPrev: boolean;
  onBack: () => void;
  onNext: () => void;
};

export default function StampStep({
  control,
  errors,
  stampFieldByDenom,
  denoms,
  stampPrev,
  stampSold,
  stampAmounts,
  stampTotal,
  textBodyCls,
  textSmCls,
  tCommon,
  tReadings,
  saving,
  loadingPrev,
  onBack,
  onNext,
}: Props) {
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

            return (
              <div key={denom} className="rounded-md border p-3 space-y-1">
                <div className={clsx("text-sm font-medium", textBodyCls)}>
                  ₹ {denom}
                </div>
                <div className="text-xs italic">
                  {tReadings("ClosingStampSerialNumbers")}
                </div>
                <div
                  className={clsx(
                    "text-xs text-muted-foreground flex items-center justify-between pr-3",
                    textSmCls,
                  )}
                >
                  {tReadings("Yesterday")}: <b>{stampPrev[denom]}</b>
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <Label
                    className={clsx(
                      "text-xs text-muted-foreground w-full",
                      textSmCls,
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
                        placeholder="0"
                        inputClassName="w-fit! text-right"
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
                  )}
                >
                  {tReadings("StampsSold")}: <b>{stampSold[denom]}</b>
                </div>
                <div
                  className={clsx(
                    "text-sm flex justify-between items-center",
                    textBodyCls,
                  )}
                >
                  {tCommon("Amount")}: <b>{formatINR(stampAmounts[denom])}</b>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-md border p-3 text-sm flex flex-col gap-2 items-center justify-center">
          <span>
            {tReadings("TotalStampDuty")} (SD):{" "}
            <b className="text-base tabular-nums">{formatINR(stampTotal)}</b>
          </span>
          <span className="text-xs text-amber-700 italic">
            {tReadings("NoteValuesUsedDirectly")}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={saving}
          className="gap-0"
        >
          <ChevronLeft className="size-4" /> {tCommon("Back")}
        </Button>
        <Button
          onClick={onNext}
          disabled={saving || loadingPrev}
          className="gap-0"
        >
          {tCommon("Next")} <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
