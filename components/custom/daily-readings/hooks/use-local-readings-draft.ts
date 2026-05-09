import * as React from "react";

import type { Denomination } from "@/types/readings";

export type LocalPhotocopyDraft = {
  todayReading: number;
  roundOffPhotocopy: boolean;
  roundedPhotocopyAmount: number;
};

export type LocalStampDraft = {
  readings: Record<Denomination, number>;
  includeStockAddition: boolean;
  stockAdded: Record<Denomination, number>;
};

export type LocalReadingsFlags = {
  photocopyDone: boolean;
  stampDone: boolean;
  fullyDone: boolean;
};

export type LocalPreviousBaselineDraft = {
  photoPrev: number;
  stampPrev: Record<Denomination, number>;
  prevReadingsManual: boolean;
  resolvedLookbackDays: number | null;
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

function readLocalStorageJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocalStorageJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeLocalStorageKeys(keys: string[]) {
  if (typeof window === "undefined") return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

type Args = {
  todayDateYmd: string;
  hasPhotocopyReading: boolean;
  hasStampReading: boolean;
  hasSavedReadings: boolean;
};

export function useLocalReadingsDraft({
  todayDateYmd,
  hasPhotocopyReading,
  hasStampReading,
  hasSavedReadings,
}: Args) {
  const localPhotocopyDraftKey = React.useMemo(
    () => `daily-readings-photocopy-draft:${todayDateYmd}`,
    [todayDateYmd]
  );
  const localStampDraftKey = React.useMemo(
    () => `daily-readings-stamp-draft:${todayDateYmd}`,
    [todayDateYmd]
  );
  const localReadingsFlagsKey = React.useMemo(
    () => `daily-readings-flags:${todayDateYmd}`,
    [todayDateYmd]
  );
  const localPreviousBaselineKey = React.useMemo(
    () => `daily-readings-previous-baseline:${todayDateYmd}`,
    [todayDateYmd]
  );

  const [localPhotocopyDraft, setLocalPhotocopyDraft] =
    React.useState<LocalPhotocopyDraft | null>(null);
  const [localStampDraft, setLocalStampDraft] =
    React.useState<LocalStampDraft | null>(null);
  const [localReadingsFlags, setLocalReadingsFlags] =
    React.useState<LocalReadingsFlags | null>(null);
  const [localPreviousBaselineDraft, setLocalPreviousBaselineDraft] =
    React.useState<LocalPreviousBaselineDraft | null>(null);
  const [isPreviousBaselineHydrated, setIsPreviousBaselineHydrated] =
    React.useState(false);

  React.useEffect(() => {
    const parsed = readLocalStorageJson<Partial<LocalPhotocopyDraft>>(
      localPhotocopyDraftKey
    );
    if (!parsed || typeof parsed.todayReading !== "number") {
      setLocalPhotocopyDraft(null);
      return;
    }

    setLocalPhotocopyDraft({
      todayReading: clamp0(parsed.todayReading),
      roundOffPhotocopy: Boolean(parsed.roundOffPhotocopy),
      roundedPhotocopyAmount: clamp0(parsed.roundedPhotocopyAmount ?? 0),
    });
  }, [localPhotocopyDraftKey]);

  React.useEffect(() => {
    const parsed =
      readLocalStorageJson<Partial<LocalStampDraft>>(localStampDraftKey);
    const readingsDraft = parsed?.readings;
    if (!readingsDraft) {
      setLocalStampDraft(null);
      return;
    }

    setLocalStampDraft({
      readings: normalizeDenomRecord(readingsDraft),
      includeStockAddition: Boolean(parsed.includeStockAddition),
      stockAdded: normalizeDenomRecord(parsed.stockAdded),
    });
  }, [localStampDraftKey]);

  React.useEffect(() => {
    const parsed = readLocalStorageJson<Partial<LocalPreviousBaselineDraft>>(
      localPreviousBaselineKey
    );

    if (!parsed?.stampPrev) {
      setLocalPreviousBaselineDraft(null);
      setIsPreviousBaselineHydrated(true);
      return;
    }

    setLocalPreviousBaselineDraft({
      photoPrev: clamp0(parsed.photoPrev ?? 0),
      stampPrev: normalizeDenomRecord(parsed.stampPrev),
      prevReadingsManual: Boolean(parsed.prevReadingsManual),
      resolvedLookbackDays:
        typeof parsed.resolvedLookbackDays === "number"
          ? Math.max(1, Math.floor(parsed.resolvedLookbackDays))
          : null,
    });
    setIsPreviousBaselineHydrated(true);
  }, [localPreviousBaselineKey]);

  React.useEffect(() => {
    const parsed = readLocalStorageJson<Partial<LocalReadingsFlags>>(
      localReadingsFlagsKey
    );
    if (parsed) {
      setLocalReadingsFlags({
        photocopyDone: Boolean(parsed.photocopyDone),
        stampDone: Boolean(parsed.stampDone),
        fullyDone: Boolean(parsed.fullyDone),
      });
      return;
    }

    const initialFlags: LocalReadingsFlags = {
      photocopyDone: hasPhotocopyReading,
      stampDone: hasStampReading,
      fullyDone: hasSavedReadings,
    };
    setLocalReadingsFlags(initialFlags);
    writeLocalStorageJson(localReadingsFlagsKey, initialFlags);
  }, [
    hasPhotocopyReading,
    hasSavedReadings,
    hasStampReading,
    localReadingsFlagsKey,
  ]);

  const persistPhotocopyDraft = React.useCallback(
    (next: LocalPhotocopyDraft | null) => {
      setLocalPhotocopyDraft(next);
      if (next) {
        writeLocalStorageJson(localPhotocopyDraftKey, next);
      } else {
        removeLocalStorageKeys([localPhotocopyDraftKey]);
      }
    },
    [localPhotocopyDraftKey]
  );

  const persistStampDraft = React.useCallback(
    (next: LocalStampDraft | null) => {
      setLocalStampDraft(next);
      if (next) {
        writeLocalStorageJson(localStampDraftKey, next);
      } else {
        removeLocalStorageKeys([localStampDraftKey]);
      }
    },
    [localStampDraftKey]
  );

  const persistReadingsFlags = React.useCallback(
    (next: LocalReadingsFlags) => {
      setLocalReadingsFlags(next);
      writeLocalStorageJson(localReadingsFlagsKey, next);
    },
    [localReadingsFlagsKey]
  );

  const persistPreviousBaseline = React.useCallback(
    (next: LocalPreviousBaselineDraft | null) => {
      setLocalPreviousBaselineDraft(next);
      if (next) {
        writeLocalStorageJson(localPreviousBaselineKey, next);
      } else {
        removeLocalStorageKeys([localPreviousBaselineKey]);
      }
    },
    [localPreviousBaselineKey]
  );

  const clearStepDrafts = React.useCallback(() => {
    setLocalPhotocopyDraft(null);
    setLocalStampDraft(null);
    removeLocalStorageKeys([localPhotocopyDraftKey, localStampDraftKey]);
  }, [localPhotocopyDraftKey, localStampDraftKey]);

  return {
    localPhotocopyDraft,
    localStampDraft,
    localReadingsFlags,
    localPreviousBaselineDraft,
    isPreviousBaselineHydrated,
    persistPhotocopyDraft,
    persistStampDraft,
    persistReadingsFlags,
    persistPreviousBaseline,
    clearStepDrafts,
  };
}
