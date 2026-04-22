"use client";

import { Controller, Control } from "react-hook-form";
import { z } from "zod";
import clsx from "clsx";
import { ChevronRight, Loader2Icon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReadingInput } from "@/components/custom/daily-page/common-components/reading-input";
import { photocopyReadingSchema } from "@/schema/readings.schema";
import { formatINR } from "@/lib/utils";

type PhotocopyFormInput = z.input<typeof photocopyReadingSchema>;

type Props = {
  control: Control<PhotocopyFormInput>;
  todayReadingError?: string;
  loadingPrev: boolean;
  saving: boolean;
  photoPrev: number;
  photoDiff: number;
  photoAmount: number;
  textBodyCls: string;
  textSmCls: string;
  tCommon: (key: string) => string;
  tReadings: (key: string) => string;
  onCancel: () => void;
  onNext: () => void;
};

export default function PhotocopyStep({
  control,
  todayReadingError,
  loadingPrev,
  saving,
  photoPrev,
  photoDiff,
  photoAmount,
  textBodyCls,
  textSmCls,
  tCommon,
  tReadings,
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
            textSmCls,
          )}
        >
          {tReadings("Yesterday")}:{" "}
          {loadingPrev ? (
            <Loader2Icon className="size-3 animate-spin" />
          ) : (
            <b>{photoPrev}</b>
          )}
        </div>

        <div className="space-y-1 flex items-center justify-between gap-2">
          <div className={clsx("text-xs text-muted-foreground", textSmCls)}>
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
                inputClassName={clsx("w-fit! text-sm text-right", textSmCls)}
              />
            )}
          />

          {todayReadingError ? (
            <p className="text-xs text-destructive">{todayReadingError}</p>
          ) : null}
        </div>

        <div
          className={clsx(
            "text-xs text-muted-foreground flex justify-between items-center pr-3",
            textSmCls,
          )}
        >
          {tReadings("TotalCopies")} = <b className="text-sm">{photoDiff}</b>
        </div>

        <div className="rounded-md border px-3 py-1 text-sm flex flex-col gap-2 my-4">
          <div className="flex justify-between items-center w-full">
            <span className="flex gap-2 justify-start items-center">
              {tReadings("TotalAmount")} = {tReadings("Copies")} × 1.5 ={" "}
              <b className="text-base tabular-nums">{formatINR(photoAmount)}</b>
            </span>
            <span className="text-xs text-muted-foreground italic hidden md:inline-flex">
              {tReadings("FSRate")}
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
          className="gap-1"
        >
          <X className="size-4" /> {tCommon("Cancel")}
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
