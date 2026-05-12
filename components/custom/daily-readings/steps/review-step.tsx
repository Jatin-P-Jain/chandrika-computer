"use client";

import clsx from "clsx";
import { ChevronLeft, Loader2Icon, Pencil, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { Denomination } from "@/types/readings";

type Props = {
  denoms: Denomination[];
  textPageHeadCls: string;
  textBodyCls: string;
  textSmCls: string;
  textXsCls: string;
  tCommon: (key: string) => string;
  tReadings: (key: string) => string;
  photoPrev: number;
  photoToday: number;
  photoDiff: number;
  photoActualAmount: number;
  photoAmount: number;
  photoIsRounded: boolean;
  stampPrev: Record<Denomination, number>;
  stampStockAdded: Record<Denomination, number>;
  stampSold: Record<Denomination, number>;
  stampAmounts: Record<Denomination, number>;
  stampTotal: number;
  todayByDenom: Record<Denomination, number>;
  readingsFound?: boolean;
  hasEdits: boolean;
  saving: boolean;
  loadingPrev: boolean;
  readOnly?: boolean;
  onEditPhotocopy: () => void;
  onEditStamp: () => void;
  onBack: () => void;
  onConfirmSave: () => void;
  onClose: () => void;
};

export default function ReviewStep({
  denoms,
  textPageHeadCls,
  textBodyCls,
  textSmCls,
  textXsCls,
  tCommon,
  tReadings,
  photoPrev,
  photoToday,
  photoDiff,
  photoActualAmount,
  photoAmount,
  photoIsRounded,
  stampPrev,
  stampStockAdded,
  stampSold,
  stampAmounts,
  stampTotal,
  todayByDenom,
  readingsFound,
  hasEdits,
  saving,
  loadingPrev,
  readOnly = false,
  onEditPhotocopy,
  onEditStamp,
  onBack,
  onConfirmSave,
  onClose,
}: Props) {
  const hasAnyStockAdded = denoms.some((denom) => stampStockAdded[denom] > 0);
  const showValuesUsedNote = !readOnly || hasEdits || !readingsFound;

  return (
    <div className="space-y-4 w-full">
      <div className="max-h-[50vh] overflow-auto no-scrollbar flex flex-col gap-4">
        <div className="rounded-md border p-3 text-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={clsx("italic", textBodyCls)}>
              {tReadings("PhotocopyMachineReading")}
            </span>
            <Button
              variant="ghost"
              className={clsx(
                "h-auto p-0 text-primary text-xs gap-1 active:scale-95 transition-transform",
                textSmCls,
              )}
              onClick={onEditPhotocopy}
              disabled={saving}
            >
              {tCommon("Edit")} <Pencil className="size-3" />
            </Button>
          </div>

          <div
            className={clsx(
              "text-sm text-muted-foreground flex justify-between items-center",
              textBodyCls,
            )}
          >
            {tReadings("Yesterday")}:{" "}
            <span
              className={clsx(
                "text-base text-foreground tabular-nums",
                textBodyCls,
              )}
            >
              {photoPrev}
            </span>
          </div>
          <div
            className={clsx(
              "text-sm text-muted-foreground flex justify-between items-center",
              textBodyCls,
            )}
          >
            {tReadings("Today")}:{" "}
            <span
              className={clsx(
                "text-base text-foreground font-medium tabular-nums",
                textBodyCls,
              )}
            >
              {photoToday}
            </span>
          </div>
          <div
            className={clsx(
              "text-sm text-muted-foreground flex justify-between items-center",
              textBodyCls,
            )}
          >
            {tReadings("TotalCopies")} ={" "}
            <span
              className={clsx(
                "text-base text-foreground tabular-nums font-semibold",
                textBodyCls,
              )}
            >
              {photoDiff}
            </span>
          </div>

          {photoIsRounded ? (
            <div
              className={clsx(
                "text-sm text-muted-foreground flex justify-between items-center",
                textBodyCls,
              )}
            >
              {tReadings("ActualCalculatedAmount")}:{" "}
              <span className="text-base font-medium tabular-nums text-foreground">
                {formatINR(photoActualAmount)}
              </span>
            </div>
          ) : null}

          <div
            className={clsx(
              "text-sm flex items-center justify-between font-medium text-primary",
              textBodyCls,
            )}
          >
            {photoIsRounded
              ? tReadings("RoundedAmount")
              : tReadings("TotalAmount")}{" "}
            (FS):{" "}
            <span
              className={clsx(
                "text-primary tabular-nums font-semibold text-base",
                textBodyCls,
              )}
            >
              {formatINR(photoAmount)}
            </span>
          </div>

          {showValuesUsedNote ? (
            <span className={clsx("text-xs text-amber-700 italic", textXsCls)}>
              {tReadings("NoteValuesUsedDirectly")}
            </span>
          ) : null}
        </div>

        <div className="rounded-md border p-3 text-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={clsx("italic", textBodyCls)}>
              {tReadings("ClosingStampSerialNumbers")}
            </span>
            <Button
              variant="ghost"
              className={clsx(
                "h-auto p-0 text-primary text-xs gap-1 active:scale-95 transition-transform",
                textSmCls,
              )}
              onClick={onEditStamp}
              disabled={saving}
            >
              {tCommon("Edit")} <Pencil className="size-3" />
            </Button>
          </div>

          <div className="grid md:grid-cols-4 grid-cols-1 gap-1">
            {denoms.map((d) => (
              <div
                key={d}
                className="rounded-md border p-2 gap-1 flex flex-col"
              >
                <div
                  className={clsx(
                    "text-base font-medium text-primary",
                    textBodyCls,
                  )}
                >
                  ₹ {d}
                </div>

                <div
                  className={clsx(
                    "text-sm text-muted-foreground flex items-center justify-between",
                    textBodyCls,
                  )}
                >
                  {tReadings("Yesterday")}:{" "}
                  <span className="text-base text-foreground tabular-nums">
                    {stampPrev[d]}
                  </span>
                </div>

                <div
                  className={clsx(
                    "text-sm text-muted-foreground flex items-center justify-between",
                    textBodyCls,
                  )}
                >
                  {tReadings("Today")}:{" "}
                  <span className="text-base text-foreground tabular-nums font-medium">
                    {todayByDenom[d]}
                  </span>
                </div>

                {hasAnyStockAdded ? (
                  <div
                    className={clsx(
                      "text-sm text-green-700 flex items-center justify-between",
                      textBodyCls,
                    )}
                  >
                    {tReadings("StockAdded")}:{" "}
                    <span className="text-base text-green-700 tabular-nums font-medium">
                      +{stampStockAdded[d]}
                    </span>
                  </div>
                ) : null}

                <div
                  className={clsx(
                    "text-sm text-muted-foreground flex items-center justify-between",
                    textBodyCls,
                  )}
                >
                  {tReadings("StampsSold")}:{" "}
                  <span className="text-base text-foreground tabular-nums font-semibold">
                    {stampSold[d]}
                  </span>
                </div>

                <div
                  className={clsx(
                    "text-sm flex items-center justify-between text-primary font-medium  ",
                    textBodyCls,
                  )}
                >
                  {tCommon("Amount")}:{" "}
                  <span className="text-base tabular-nums font-semibold">
                    {formatINR(stampAmounts[d])}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={clsx(
              "text-base flex items-center justify-between gap-1 font-semibold text-primary",
              textBodyCls,
            )}
          >
            {tReadings("TotalStampDuty")} (SD):{" "}
            <span
              className={clsx(
                "text-lg text-primary tabular-nums font-semibold",
                textPageHeadCls,
              )}
            >
              {formatINR(stampTotal)}
            </span>
          </div>

          {showValuesUsedNote ? (
            <span className={clsx("text-xs text-amber-700 italic", textXsCls)}>
              {tReadings("NoteValuesUsedDirectly")}
            </span>
          ) : null}
        </div>
      </div>

      {readOnly &&
      readingsFound &&
      !hasEdits ? // Read-only mode without edits: show only OK button
      // <div className="flex justify-end gap-2">
      //   <Button onClick={onClose} className="gap-1">
      //     <span className={textSmCls}>{tCommon("Ok")} 👍🏻</span>
      //   </Button>
      // </div>
      null : !readingsFound || hasEdits ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={saving}
            className="gap-0 active:scale-95 transition-transform text-base"
          >
            <ChevronLeft className="size-4" /> {tCommon("Back")}
          </Button>

          <Button
            onClick={onConfirmSave}
            disabled={saving || loadingPrev}
            className="gap-1 active:scale-95 transition-transform text-base"
          >
            {saving ? (
              <span className={clsx("flex items-center gap-2", textBodyCls)}>
                <Loader2Icon className="size-4 animate-spin" />
                {tCommon("Saving")}
              </span>
            ) : (
              <>
                <span className={textBodyCls}>
                  {hasEdits ? tCommon("Update") : tCommon("ConfirmAndSave")}
                </span>
                <SaveIcon className="size-4" />
              </>
            )}
          </Button>
        </div>
      ) : // <div className="flex justify-end gap-2">
      //   <Button onClick={onClose} className="gap-1 text-base">
      //     <span className={textBodyCls}>{tCommon("Ok")} 👍🏻</span>
      //   </Button>
      // </div>
      null}
    </div>
  );
}
