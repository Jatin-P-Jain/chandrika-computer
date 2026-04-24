"use client";

import clsx from "clsx";
import { ChevronLeft, Loader2Icon, Pencil, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { Denomination } from "@/types/readings";

type Props = {
  denoms: Denomination[];
  textBodyCls: string;
  textSmCls: string;
  textXsCls: string;
  tCommon: (key: string) => string;
  tReadings: (key: string) => string;
  photoPrev: number;
  photoToday: number;
  photoDiff: number;
  photoAmount: number;
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
  onEditPhotocopy: () => void;
  onEditStamp: () => void;
  onBack: () => void;
  onConfirmSave: () => void;
  onClose: () => void;
};

export default function ReviewStep({
  denoms,
  textBodyCls,
  textSmCls,
  textXsCls,
  tCommon,
  tReadings,
  photoPrev,
  photoToday,
  photoDiff,
  photoAmount,
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
  onEditPhotocopy,
  onEditStamp,
  onBack,
  onConfirmSave,
  onClose,
}: Props) {
  const hasAnyStockAdded = denoms.some((denom) => stampStockAdded[denom] > 0);

  return (
    <div className="space-y-4 w-full">
      <div className="max-h-[50vh] overflow-auto no-scrollbar flex flex-col gap-4">
        <div className="rounded-md border p-3 text-sm flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className={clsx("italic text-muted-foreground", textBodyCls)}>
              {tReadings("PhotocopyMachineReading")}
            </span>
            <Button
              variant="ghost"
              className={clsx(
                "h-auto p-0 text-primary text-xs gap-1",
                textXsCls,
              )}
              onClick={onEditPhotocopy}
              disabled={saving}
            >
              {tCommon("Edit")} <Pencil className="size-3" />
            </Button>
          </div>

          <div
            className={clsx(
              "text-xs text-muted-foreground flex justify-between items-center",
              textSmCls,
            )}
          >
            {tReadings("Yesterday")}:{" "}
            <b className="text-foreground tabular-nums">{photoPrev}</b>
          </div>
          <div
            className={clsx(
              "text-xs text-muted-foreground flex justify-between items-center",
              textSmCls,
            )}
          >
            {tReadings("Today")}:{" "}
            <b className="text-foreground tabular-nums">{photoToday}</b>
          </div>
          <div
            className={clsx(
              "text-xs text-muted-foreground flex justify-between items-center",
              textSmCls,
            )}
          >
            {tReadings("TotalCopies")} ={" "}
            <b className="text-foreground tabular-nums">{photoDiff}</b>
          </div>

          <div
            className={clsx(
              "text-sm flex items-center justify-between font-semibold",
              textBodyCls,
            )}
          >
            {tReadings("TotalAmount")} (FS):{" "}
            <b className="text-foreground tabular-nums">
              {formatINR(photoAmount)}
            </b>
          </div>

          <span className={clsx("text-xs text-amber-700 italic", textXsCls)}>
            {tReadings("NoteValuesUsedDirectly")}
          </span>
        </div>

        <div className="rounded-md border p-3 text-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={clsx("italic text-muted-foreground", textBodyCls)}>
              {tReadings("ClosingStampSerialNumbers")}
            </span>
            <Button
              variant="ghost"
              className={clsx(
                "h-auto p-0 text-primary text-xs gap-1",
                textXsCls,
              )}
              onClick={onEditStamp}
              disabled={saving}
            >
              {tCommon("Edit")} <Pencil className="size-3" />
            </Button>
          </div>

          <div className="grid md:grid-cols-4 grid-cols-1 gap-1">
            {denoms.map((d) => (
              <div key={d} className="rounded-md border p-2">
                <div className={clsx("font-medium mb-1", textBodyCls)}>
                  ₹ {d}
                </div>

                <div
                  className={clsx(
                    "text-xs text-muted-foreground flex items-center justify-between",
                    textSmCls,
                  )}
                >
                  {tReadings("Yesterday")}:{" "}
                  <b className="text-foreground tabular-nums">{stampPrev[d]}</b>
                </div>

                <div
                  className={clsx(
                    "text-xs text-muted-foreground flex items-center justify-between",
                    textSmCls,
                  )}
                >
                  {tReadings("Today")}:{" "}
                  <b className="text-foreground tabular-nums">
                    {todayByDenom[d]}
                  </b>
                </div>

                {hasAnyStockAdded ? (
                  <div
                    className={clsx(
                      "text-xs text-muted-foreground flex items-center justify-between",
                      textSmCls,
                    )}
                  >
                    {tReadings("AddStock")}:{" "}
                    <b className="text-foreground tabular-nums">
                      {stampStockAdded[d]}
                    </b>
                  </div>
                ) : null}

                <div
                  className={clsx(
                    "text-xs text-muted-foreground flex items-center justify-between",
                    textSmCls,
                  )}
                >
                  {tReadings("StampsSold")}:{" "}
                  <b className="text-foreground tabular-nums">{stampSold[d]}</b>
                </div>

                <div
                  className={clsx(
                    "text-sm flex items-center justify-between mt-1",
                    textBodyCls,
                  )}
                >
                  {tCommon("Amount")}:{" "}
                  <b className="text-foreground tabular-nums">
                    {formatINR(stampAmounts[d])}
                  </b>
                </div>
              </div>
            ))}
          </div>

          <div
            className={clsx(
              "text-sm flex items-center justify-between gap-1 font-semibold",
              textBodyCls,
            )}
          >
            {tReadings("TotalStampDuty")} (SD):{" "}
            <b className="text-foreground tabular-nums">
              {formatINR(stampTotal)}
            </b>
          </div>

          <span className={clsx("text-xs text-amber-700 italic", textXsCls)}>
            {tReadings("NoteValuesUsedDirectly")}
          </span>
        </div>
      </div>

      {!readingsFound || hasEdits ? (
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
            onClick={onConfirmSave}
            disabled={saving || loadingPrev}
            className="gap-1"
          >
            {saving ? (
              <span className={clsx("flex items-center gap-2", textSmCls)}>
                <Loader2Icon className="size-4 animate-spin" />
                {tCommon("Saving")}
              </span>
            ) : (
              <span className={textSmCls}>{tCommon("ConfirmAndSave")}</span>
            )}
            <SaveIcon className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className="gap-1">
            <span className={textSmCls}>{tCommon("Ok")} 👍🏻</span>
          </Button>
        </div>
      )}
    </div>
  );
}
