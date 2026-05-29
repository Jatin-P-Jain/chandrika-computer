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
  draftStorageKey: string;
  hasPhotocopyReading: boolean;
  hasStampReading: boolean;
  hasSavedReadings: boolean;
};

type StoredReadingsDraft = {
  photocopyDraft: LocalPhotocopyDraft | null;
  stampDraft: LocalStampDraft | null;
  flags: LocalReadingsFlags;
};

function getEffectiveFlags(
  storedDraft: StoredReadingsDraft | null,
  hasPhotocopyReading: boolean,
  hasStampReading: boolean,
  hasSavedReadings: boolean
): LocalReadingsFlags {
  return {
    photocopyDone:
      hasPhotocopyReading || Boolean(storedDraft?.flags.photocopyDone),
    stampDone: hasStampReading || Boolean(storedDraft?.flags.stampDone),
    fullyDone: hasSavedReadings || Boolean(storedDraft?.flags.fullyDone),
  };
}

function readStoredDraft(key: string): StoredReadingsDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    return JSON.parse(raw) as StoredReadingsDraft;
  } catch {
    return null;
  }
}

function writeStoredDraft(key: string, value: StoredReadingsDraft) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and continue with in-memory draft only.
  }
}

function clearStoredDraft(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

export function useLocalReadingsDraft({
  draftStorageKey,
  hasPhotocopyReading,
  hasStampReading,
  hasSavedReadings,
}: Args) {
  const storedDraft = React.useMemo(
    () => readStoredDraft(draftStorageKey),
    [draftStorageKey]
  );
  const initialFlags = getEffectiveFlags(
    storedDraft,
    hasPhotocopyReading,
    hasStampReading,
    hasSavedReadings
  );
  const [localPhotocopyDraft, setLocalPhotocopyDraft] =
    React.useState<LocalPhotocopyDraft | null>(
      hasSavedReadings ? null : storedDraft?.photocopyDraft ?? null
    );
  const [localStampDraft, setLocalStampDraft] =
    React.useState<LocalStampDraft | null>(
      hasSavedReadings ? null : storedDraft?.stampDraft ?? null
    );
  const [localReadingsFlags, setLocalReadingsFlags] =
    React.useState<LocalReadingsFlags | null>(initialFlags);
  const localPhotocopyDraftRef = React.useRef<LocalPhotocopyDraft | null>(
    hasSavedReadings ? null : storedDraft?.photocopyDraft ?? null
  );
  const localStampDraftRef = React.useRef<LocalStampDraft | null>(
    hasSavedReadings ? null : storedDraft?.stampDraft ?? null
  );
  const localReadingsFlagsRef = React.useRef<LocalReadingsFlags | null>(
    initialFlags
  );

  React.useEffect(() => {
    const nextStoredDraft = readStoredDraft(draftStorageKey);

    if (hasSavedReadings) {
      const nextFlags = getEffectiveFlags(
        nextStoredDraft,
        hasPhotocopyReading,
        hasStampReading,
        hasSavedReadings
      );

      clearStoredDraft(draftStorageKey);
      localPhotocopyDraftRef.current = null;
      localStampDraftRef.current = null;
      localReadingsFlagsRef.current = nextFlags;
      setLocalPhotocopyDraft(null);
      setLocalStampDraft(null);
      setLocalReadingsFlags(nextFlags);
      return;
    }

    const nextFlags = getEffectiveFlags(
      nextStoredDraft,
      hasPhotocopyReading,
      hasStampReading,
      hasSavedReadings
    );
    const nextPhotocopyDraft = nextStoredDraft?.photocopyDraft ?? null;
    const nextStampDraft = nextStoredDraft?.stampDraft ?? null;

    localPhotocopyDraftRef.current = nextPhotocopyDraft;
    localStampDraftRef.current = nextStampDraft;
    localReadingsFlagsRef.current = nextFlags;
    setLocalPhotocopyDraft(nextPhotocopyDraft);
    setLocalStampDraft(nextStampDraft);
    setLocalReadingsFlags(nextFlags);
  }, [draftStorageKey, hasPhotocopyReading, hasStampReading, hasSavedReadings]);

  React.useEffect(() => {
    if (hasSavedReadings) {
      clearStoredDraft(draftStorageKey);
    }
  }, [draftStorageKey, hasSavedReadings]);

  const syncStoredDraft = React.useCallback(
    (
      photocopyDraft: LocalPhotocopyDraft | null,
      stampDraft: LocalStampDraft | null,
      flags: LocalReadingsFlags | null
    ) => {
      if (!flags) {
        clearStoredDraft(draftStorageKey);
        return;
      }

      writeStoredDraft(draftStorageKey, {
        photocopyDraft,
        stampDraft,
        flags,
      });
    },
    [draftStorageKey]
  );

  const persistPhotocopyDraft = React.useCallback(
    (next: LocalPhotocopyDraft | null) => {
      localPhotocopyDraftRef.current = next;
      setLocalPhotocopyDraft(next);
      syncStoredDraft(
        next,
        localStampDraftRef.current,
        localReadingsFlagsRef.current
      );
    },
    [syncStoredDraft]
  );

  const persistStampDraft = React.useCallback(
    (next: LocalStampDraft | null) => {
      localStampDraftRef.current = next;
      setLocalStampDraft(next);
      syncStoredDraft(
        localPhotocopyDraftRef.current,
        next,
        localReadingsFlagsRef.current
      );
    },
    [syncStoredDraft]
  );

  const persistReadingsFlags = React.useCallback(
    (next: LocalReadingsFlags) => {
      localReadingsFlagsRef.current = next;
      setLocalReadingsFlags(next);
      syncStoredDraft(
        localPhotocopyDraftRef.current,
        localStampDraftRef.current,
        next
      );
    },
    [syncStoredDraft]
  );

  const clearStepDrafts = React.useCallback(() => {
    localPhotocopyDraftRef.current = null;
    localStampDraftRef.current = null;
    setLocalPhotocopyDraft(null);
    setLocalStampDraft(null);
    clearStoredDraft(draftStorageKey);
  }, [draftStorageKey]);

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
