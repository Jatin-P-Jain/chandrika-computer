"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReadingInput } from "@/components/custom/daily-page/common-components/reading-input";
import { Separator } from "@/components/ui/separator";
import type { Denomination } from "@/types/readings";
import clsx from "clsx";

type Props = {
  resolverOpenedFromEdit: boolean;
  textBodyCls: string;
  textSmCls: string;
  denoms: Denomination[];
  lookbackDays: number;
  loadingPrev: boolean;
  manualPhotoPrev: number;
  manualStampPrev: Record<Denomination, number>;
  tCommon: (key: string) => string;
  tReadings: (key: string) => string;
  onLookbackDaysChange: (value: number) => void;
  onFindLatestReadings: () => void | Promise<void>;
  onManualPhotoPrevChange: (value: number) => void;
  onManualStampPrevChange: (denomination: Denomination, value: number) => void;
  onUseManualReadings: () => void | Promise<void>;
  onBackToReadings: () => void;
};

export default function PreviousReadingsResolver({
  resolverOpenedFromEdit,
  textBodyCls,
  textSmCls,
  denoms,
  lookbackDays,
  loadingPrev,
  manualPhotoPrev,
  manualStampPrev,
  tCommon,
  tReadings,
  onLookbackDaysChange,
  onFindLatestReadings,
  onManualPhotoPrevChange,
  onManualStampPrevChange,
  onUseManualReadings,
  onBackToReadings,
}: Props) {
  return (
    <div className="w-full rounded-md border p-3 md:p-4 space-y-3 h-full overflow-auto">
      <div className="font-medium text-amber-700 flex items-center gap-1 justify-center">
        <AlertTriangle className="size-4" />
        {resolverOpenedFromEdit
          ? tReadings("EditPreviousReadings")
          : tReadings("NoPreviousReadingsFound")}
      </div>
      <p className={"text-xs text-muted-foreground " + textSmCls}>
        {resolverOpenedFromEdit
          ? tReadings("EditPreviousReadingsHelp")
          : tReadings("AskRecentHolidays")}
      </p>

      <div className="flex flex-row items-end gap-2">
        <div className="space-y-1">
          <Label className={clsx("text-base", textSmCls)}>
            {tReadings("RecentHolidayCount")}
          </Label>
          <ReadingInput
            value={lookbackDays}
            onChange={(n) => onLookbackDaysChange(Math.max(1, n || 1))}
            placeholder="1"
            inputClassName="text-base flex mx-auto items-center text-center"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loadingPrev}
          onClick={onFindLatestReadings}
        >
          {loadingPrev ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-4 animate-spin" />
              {tReadings("LoadingYesterdaysReadings")}
            </span>
          ) : (
            tReadings("FindLatestReadings")
          )}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs">{tCommon("Or")}</span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-3">
        <div className={"font-medium " + textBodyCls}>
          {tReadings("EnterPreviousReadingsManually")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className={clsx("text-base", textSmCls)}>
              {tReadings("PhotocopyPreviousReading")}
            </Label>
            <ReadingInput
              value={manualPhotoPrev}
              onChange={(n) => onManualPhotoPrevChange(Math.max(0, n || 0))}
              placeholder="0"
              inputClassName="text-base text-right"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {denoms.map((denom) => (
            <div key={denom} className="space-y-1">
              <Label className={clsx("text-base", textSmCls)}>₹ {denom}</Label>
              <ReadingInput
                value={manualStampPrev[denom]}
                onChange={(n) =>
                  onManualStampPrevChange(denom, Math.max(0, n || 0))
                }
                placeholder="0"
                inputClassName="text-base text-right"
              />
            </div>
          ))}
        </div>

        <Button type="button" onClick={onUseManualReadings} className="text-base">
          {tReadings("UseManualReadings")}
        </Button>

        {resolverOpenedFromEdit ? (
          <Button type="button" variant="outline" onClick={onBackToReadings}>
            {tReadings("BackToReadings")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
