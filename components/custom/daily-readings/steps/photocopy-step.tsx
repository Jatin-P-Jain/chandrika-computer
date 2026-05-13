"use client";

import { Controller, Control } from "react-hook-form";
import { z } from "zod";
import clsx from "clsx";
import { ChevronRight, Loader2Icon, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReadingInput } from "@/components/custom/daily-page/common-components/reading-input";
import { photocopyReadingSchema } from "@/schema/readings.schema";
import { formatINR } from "@/lib/utils";

type PhotocopyFormInput = z.input<typeof photocopyReadingSchema>;

type Props = {
  control: Control<PhotocopyFormInput>;
  todayReadingError?: string;
  loadingPrev: boolean;
  saving: boolean;
  savingPhotocopyStep?: boolean;
  photoPrev: number;
  photoDiff: number;
  photoActualAmount: number;
  photoAmount: number;
  roundOffPhotocopy: boolean;
  roundedPhotocopyAmount: number;
  textPageHeadCls: string;
  textBodyCls: string;
  textSmCls: string;
  tCommon: (key: string) => string;
  tReadings: (key: string) => string;
  canEditPreviousReadings: boolean;
  onEditPreviousReadings: () => void;
  onRoundOffChange: (checked: boolean) => void;
  onRoundedAmountChange: (amount: number) => void;
  onCancel: () => void;
  onNext: () => void;
};

export default function PhotocopyStep({
  control,
  todayReadingError,
  loadingPrev,
  saving,
  savingPhotocopyStep = false,
  photoPrev,
  photoDiff,
  photoActualAmount,
  photoAmount,
  roundOffPhotocopy,
  roundedPhotocopyAmount,
  textPageHeadCls,
  textBodyCls,
  textSmCls,
  tCommon,
  tReadings,
  canEditPreviousReadings,
  onEditPreviousReadings,
  onRoundOffChange,
  onRoundedAmountChange,
  onCancel,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="max-h-[50vh] overflow-auto no-scrollbar flex flex-col gap-2">
        <div className={clsx("flex italic font-medium", textBodyCls)}>
          {tReadings("PhotocopyMachineReading")}
        </div>

        <div
          className={clsx(
            "text-sm text-muted-foreground flex items-center gap-2 justify-between pr-3",
            textBodyCls,
          )}
        >
          <span>{tReadings("Yesterday")}:</span>
          <div className="inline-flex items-center gap-1">
            {loadingPrev ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              <span className={clsx("text-base font-medium", textBodyCls)}>{photoPrev}</span>
            )}
            {canEditPreviousReadings ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onEditPreviousReadings}
                disabled={saving || loadingPrev}
                aria-label={tReadings("EditPreviousReadings")}
                className="size-6"
              >
                <Pencil className="size-3" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-1 flex items-center justify-between gap-2">
          <div className={clsx("text-sm text-muted-foreground", textSmCls)}>
            {tReadings("Today")} :
          </div>
          <Controller
            control={control}
            name="todayReading"
            render={({ field }) => (
              <ReadingInput
                value={(field.value as number) ?? 0}
                onChange={field.onChange}
                placeholder="0"
                inputClassName={clsx("w-fit! text-right", textBodyCls)}
              />
            )}
          />

          {todayReadingError ? (
            <p className="text-xs text-destructive">{todayReadingError}</p>
          ) : null}
        </div>

        <div
          className={clsx(
            "text-sm text-muted-foreground flex justify-between items-center pr-3",
            textBodyCls,
          )}
        >
          {tReadings("TotalCopies")} ={" "}
          <span
            className={clsx("text-base text-primary font-semibold", textBodyCls)}
          >
            {photoDiff}
          </span>
        </div>

        <div className="rounded-md border px-3 py-1 text-base flex flex-col gap-2 my-4">
          <div className="flex justify-between items-center w-full">
            <span className="flex gap-2 justify-start items-center">
              {tReadings("Copies")} × ₹2 ={" "}
              <span className={clsx("text-base tabular-nums font-medium", textBodyCls)}>
                {formatINR(photoActualAmount)}
              </span>
            </span>
            <span
              className={clsx(
                "text-xs text-muted-foreground italic hidden md:inline-flex",
                textBodyCls,
              )}
            >
              {tReadings("FSRate")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
            <div className="space-y-0.5">
              <Label className={clsx("text-sm font-medium", textBodyCls)}>
                {tReadings("RoundOffFinalAmount")}
              </Label>
              <p className={clsx("text-xs text-muted-foreground", textSmCls)}>
                {tReadings("RoundedAmountWillBeUsed")}
              </p>
            </div>
            <Switch
              checked={roundOffPhotocopy}
              onCheckedChange={onRoundOffChange}
              disabled={saving || loadingPrev}
            />
          </div>

          {roundOffPhotocopy ? (
            <div className="flex items-center justify-between gap-3">
              <Label className={clsx("text-xs", textSmCls)}>
                {tReadings("RoundedAmount")}:
              </Label>
              <ReadingInput
                value={roundedPhotocopyAmount}
                onChange={(value) =>
                  onRoundedAmountChange(Math.max(0, value || 0))
                }
                placeholder="0"
                inputClassName={clsx("w-fit! text-right", textBodyCls)}
              />
            </div>
          ) : null}

          <div className="flex justify-between items-center w-full">
            <span
              className={clsx(
                "flex gap-2 justify-start items-center",
                textBodyCls,
              )}
            >
              {tReadings("TotalAmount")} ={" "}
              <span
                className={clsx(
                  "text-lg tabular-nums font-semibold",
                  "text-primary",
                  textPageHeadCls,
                )}
              >
                {formatINR(photoAmount)}
              </span>
            </span>
          </div>

          <span className="text-xs text-amber-700 italic">
            {tReadings("NoteValuesUsedDirectly")}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
          className="gap-1 active:scale-95 transition-transform text-base"
        >
          <X className="size-4" /> {tCommon("Cancel")}
        </Button>
        <Button
          onClick={onNext}
          disabled={saving || loadingPrev || savingPhotocopyStep}
          className="gap-0 active:scale-95 transition-transform text-base"
        >
          {savingPhotocopyStep ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {tCommon("Next")}
            </>
          ) : (
            <>
              {tCommon("Next")} <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
