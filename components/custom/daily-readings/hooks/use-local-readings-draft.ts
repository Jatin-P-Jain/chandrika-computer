import * as React from "react";

import type { Denomination } from "@/types/readings";

export type LocalPhotocopyDraft = {
  todayReading: number;
  hasTodayReadingInput: boolean;
  roundOffPhotocopy: boolean;
  roundedPhotocopyAmount: number;
};

export type LocalStampDraft = {
  readings: Record<Denomination, number>;
  enteredReadings: Record<Denomination, boolean>;
  includeStockAddition: boolean;
  stockAdded: Record<Denomination, number>;
};

export const EMPTY_DENOM_BOOLEAN_RECORD: Record<Denomination, boolean> = {
  50: false,
  100: false,
  500: false,
  1000: false,
};

export type LocalReadingsFlags = {
  photocopyDone: boolean;
  stampDone: boolean;
  fullyDone: boolean;
};

export const EMPTY_DENOM_RECORD: Record<Denomination, number> = {
  50: 0,
  100: 0,
  500: 0,
  1000: 0,
};

export function clamp0(n: number) {
  return Math.max(0, Number.isFinite(n) ? n : 0);
}

export function normalizeDenomRecord(
  input?: Partial<Record<Denomination, number>> | null
) {
  return {
    50: clamp0(input?.[50] ?? 0),
    100: clamp0(input?.[100] ?? 0),
    500: clamp0(input?.[500] ?? 0),
    1000: clamp0(input?.[1000] ?? 0),
  };
}

type Args = {
  hasPhotocopyReading: boolean;
  hasStampReading: boolean;
  hasSavedReadings: boolean;
};

export function useLocalReadingsDraft({
  hasPhotocopyReading,
  hasStampReading,
  hasSavedReadings,
}: Args) {
  const [localPhotocopyDraft, setLocalPhotocopyDraft] =
    React.useState<LocalPhotocopyDraft | null>(null);
  const [localStampDraft, setLocalStampDraft] =
    React.useState<LocalStampDraft | null>(null);
  const [localReadingsFlags, setLocalReadingsFlags] =
    React.useState<LocalReadingsFlags | null>({
      photocopyDone: hasPhotocopyReading,
      stampDone: hasStampReading,
      fullyDone: hasSavedReadings,
    });

  const persistPhotocopyDraft = React.useCallback(
    (next: LocalPhotocopyDraft | null) => {
      setLocalPhotocopyDraft(next);
    },
    []
  );

  const persistStampDraft = React.useCallback(
    (next: LocalStampDraft | null) => {
      setLocalStampDraft(next);
    },
    []
  );

  const persistReadingsFlags = React.useCallback((next: LocalReadingsFlags) => {
    setLocalReadingsFlags(next);
  }, []);

  const clearStepDrafts = React.useCallback(() => {
    setLocalPhotocopyDraft(null);
    setLocalStampDraft(null);
  }, []);

  return {
    localPhotocopyDraft,
    localStampDraft,
    localReadingsFlags,
    persistPhotocopyDraft,
    persistStampDraft,
    persistReadingsFlags,
    clearStepDrafts,
  };
}
