"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import type {
  Denomination,
  PhotocopyReadingDoc,
  StampReadingDoc,
} from "@/types/readings";
import {
  getReadings,
  savePhotocopyReading,
  saveStampReading,
} from "@/app/daily-accounts/readings-actions";
import {
  photocopyReadingSchema,
  stampReadingSchema,
  stampStockAdditionSchema,
} from "@/schema/readings.schema";
import {
  CheckCircle,
  ChevronsRight,
  Loader2,
  TriangleAlert,
  X,
  ClockFading,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useBreakpoints } from "@/hooks/useBreakPoints";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useAuth } from "@/context/useAuth";
import { DateDisplay } from "../date-display";
import clsx from "clsx";
import PreviousReadingsResolver from "./previous-readings-resolver";
import {
  EMPTY_DENOM_RECORD,
  normalizeDenomRecord,
  useLocalReadingsDraft,
  type LocalPhotocopyDraft,
  type LocalReadingsFlags,
  type LocalStampDraft,
} from "./hooks/use-local-readings-draft";
import { useReadingsDialogNavigation } from "./hooks/use-readings-dialog-navigation";

const PhotocopyStep = dynamic(() => import("./steps/photocopy-step"), {
  loading: () => (
    <div className="h-56 w-full animate-pulse rounded-md border bg-muted/30" />
  ),
});

const StampStep = dynamic(() => import("./steps/stamp-step"), {
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-md border bg-muted/30" />
  ),
});

const ReviewStep = dynamic(() => import("./steps/review-step"), {
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-md border bg-muted/30" />
  ),
});

const DENOMS: Denomination[] = [50, 100, 500, 1000];

function clamp0(n: number) {
  return Math.max(0, Number.isFinite(n) ? n : 0);
}

function hasUsablePreviousBaseline(res: {
  photocopy: PhotocopyReadingDoc | null;
  stamp: StampReadingDoc | null;
}) {
  // Previous baseline is usable if either document exists, even when values are zero.
  return Boolean(res.photocopy || res.stamp);
}

type Props = {
  todayDateYmd: string;
  onSaved?: (saved: {
    photocopy?: PhotocopyReadingDoc;
    stamp?: StampReadingDoc;
  }) => void;
  syncing?: boolean;
  readings?: {
    success: boolean;
    photocopy?: PhotocopyReadingDoc | null;
    stamp?: StampReadingDoc | null;
  };
  startOpen?: boolean;
  readOnly?: boolean;
};

type Step = "photocopy" | "stamp" | "review";

export default function DailyReadingsDialog({
  todayDateYmd,
  onSaved,
  syncing = false,
  readings,
  startOpen = false,
  readOnly = false,
}: Props) {
  const tCommon = useTranslations("Common");
  const tReadings = useTranslations("Readings");
  const { textPageHeadCls, textBodyCls, textSmCls, textXsCls } =
    useLocaleTypography();
  const { authState } = useAuth();

  const hasPhotocopyReading = Boolean(readings?.photocopy);
  const hasStampReading = Boolean(readings?.stamp);
  const hasSavedReadings = hasPhotocopyReading && hasStampReading;
  const {
    localPhotocopyDraft,
    localStampDraft,
    localReadingsFlags,
    persistPhotocopyDraft,
    persistStampDraft,
    persistReadingsFlags,
    clearStepDrafts,
  } = useLocalReadingsDraft({
    hasPhotocopyReading,
    hasStampReading,
    hasSavedReadings,
  });
  const hasLocalPhotocopyDraft = Boolean(localPhotocopyDraft);
  const hasLocalStampDraft = Boolean(localStampDraft);
  const hasEffectivePhotocopy =
    (localReadingsFlags
      ? Boolean(localReadingsFlags.photocopyDone)
      : hasPhotocopyReading) || hasLocalPhotocopyDraft;
  const hasEffectiveStamp =
    (localReadingsFlags
      ? Boolean(localReadingsFlags.stampDone)
      : hasStampReading) || hasLocalStampDraft;
  const hasEffectiveFull = localReadingsFlags
    ? Boolean(localReadingsFlags.fullyDone)
    : hasSavedReadings;
  const hasPartialReadings =
    !hasEffectiveFull && (hasEffectivePhotocopy || hasEffectiveStamp);
  const isReadOnlyView = readOnly || hasEffectiveFull;
  const preferredEditableStep: Step = hasEffectivePhotocopy
    ? hasEffectiveStamp
      ? "review"
      : "stamp"
    : "photocopy";
  const shouldLoadPreviousReadings =
    localReadingsFlags !== null && !isReadOnlyView;

  const { isTabletUp } = useBreakpoints();

  const [open, setOpen] = React.useState(startOpen);
  const prevReadingsInitKeyRef = React.useRef<string | null>(null);
  const [mobileViewportMaxHeight, setMobileViewportMaxHeight] = React.useState<
    number | null
  >(null);
  const [step, setStep] = React.useState<Step>(
    isReadOnlyView ? "review" : preferredEditableStep,
  );
  const [loadingPrev, setLoadingPrev] = React.useState(false);
  const [initializingPrev, setInitializingPrev] = React.useState(false);
  const [missingPreviousReadings, setMissingPreviousReadings] =
    React.useState(false);
  const [showPreviousReadingsResolver, setShowPreviousReadingsResolver] =
    React.useState(false);
  const [resolverOpenedFromEdit, setResolverOpenedFromEdit] =
    React.useState(false);
  const [lookbackDays, setLookbackDays] = React.useState(1);
  const [resolvedLookbackDays, setResolvedLookbackDays] = React.useState<
    number | null
  >(null);
  const [manualPhotoPrev, setManualPhotoPrev] = React.useState(0);
  const [manualStampPrev, setManualStampPrev] =
    React.useState<Record<Denomination, number>>(EMPTY_DENOM_RECORD);
  const [saving, setSaving] = React.useState(false);
  const [savingPhotocopyStep, setSavingPhotocopyStep] = React.useState(false);
  const [includeStockAddition, setIncludeStockAddition] = React.useState(false);
  const [roundOffPhotocopy, setRoundOffPhotocopy] = React.useState(
    Boolean(readings?.photocopy?.isRounded),
  );
  const [roundedPhotocopyAmount, setRoundedPhotocopyAmount] = React.useState(
    readings?.photocopy?.roundedAmount ?? readings?.photocopy?.amount ?? 0,
  );

  // yesterday readings
  const [photoPrev, setPhotoPrev] = React.useState(0);
  const [stampPrev, setStampPrev] =
    React.useState<Record<Denomination, number>>(EMPTY_DENOM_RECORD);
  // NEW: when readings are already saved, user must confirm+save only if they changed something
  const [hasEdits, setHasEdits] = React.useState(false);

  // IMPORTANT: schema uses preprocess; type RHF as input/output to avoid Resolver mismatch.
  const photoForm = useForm<z.input<typeof photocopyReadingSchema>>({
    resolver: zodResolver(photocopyReadingSchema),
    defaultValues: { todayReading: readings?.photocopy?.todayReading ?? 0 },
    mode: "onChange",
  });

  const stampForm = useForm<z.input<typeof stampReadingSchema>>({
    resolver: zodResolver(stampReadingSchema),
    defaultValues: {
      r50: clamp0(readings?.stamp?.parts?.[50]?.todayReading ?? 0),
      r100: clamp0(readings?.stamp?.parts?.[100]?.todayReading ?? 0),
      r500: clamp0(readings?.stamp?.parts?.[500]?.todayReading ?? 0),
      r1000: clamp0(readings?.stamp?.parts?.[1000]?.todayReading ?? 0),
    },
    mode: "onChange",
  });

  const stockForm = useForm<z.input<typeof stampStockAdditionSchema>>({
    resolver: zodResolver(stampStockAdditionSchema),
    defaultValues: {
      s50: 0,
      s100: 0,
      s500: 0,
      s1000: 0,
    },
    mode: "onChange",
  });

  const readingsFound = hasSavedReadings;
  const hasSavedStockAddition = DENOMS.some(
    (denom) => (readings?.stamp?.parts?.[denom]?.stockAdded ?? 0) > 0,
  );

  const {
    closeDialog,
    goToStep,
    openPreviousReadingsResolverFromEdit,
    handleMobileDrawerOpenChange,
  } = useReadingsDialogNavigation({
    photoPrev,
    stampPrev,
    setOpen,
    setStep,
    setManualPhotoPrev,
    setManualStampPrev,
    setResolverOpenedFromEdit,
    setShowPreviousReadingsResolver,
  });

  // In read-only mode, always reset back to review on open/close.
  React.useEffect(() => {
    if (isReadOnlyView) {
      setStep("review");
    }
  }, [isReadOnlyView, open]);

  React.useEffect(() => {
    if (isTabletUp || !open) {
      setMobileViewportMaxHeight(null);
      return;
    }

    const syncMobileViewportHeight = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      setMobileViewportMaxHeight(
        Math.max(320, Math.floor(viewportHeight * 0.92)),
      );
    };

    syncMobileViewportHeight();

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncMobileViewportHeight);
    viewport?.addEventListener("scroll", syncMobileViewportHeight);
    window.addEventListener("resize", syncMobileViewportHeight);

    return () => {
      viewport?.removeEventListener("resize", syncMobileViewportHeight);
      viewport?.removeEventListener("scroll", syncMobileViewportHeight);
      window.removeEventListener("resize", syncMobileViewportHeight);
    };
  }, [isTabletUp, open]);

  // reset step when dialog opens (optional but keeps UX clean)
  React.useEffect(() => {
    if (!open) return;
    if (isReadOnlyView) {
      setStep("review");
      return;
    }

    setStep(preferredEditableStep);
  }, [open, isReadOnlyView, preferredEditableStep]);

  // NEW: reset edit state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setHasEdits(false);
      setShowPreviousReadingsResolver(false);
      setResolverOpenedFromEdit(false);
    } else {
      setHasEdits(false);
    }
  }, [open]);

  // NEW: when existing readings are loaded, ensure forms reflect them and clear edit state
  React.useEffect(() => {
    if (!open) return;

    const savedPhotoToday = readings?.photocopy?.todayReading;
    const localPhotoToday = localPhotocopyDraft?.todayReading;

    photoForm.reset(
      { todayReading: savedPhotoToday ?? localPhotoToday ?? 0 },
      { keepDirty: false },
    );

    stampForm.reset(
      {
        r50: clamp0(readings?.stamp?.parts?.[50]?.todayReading ?? 0),
        r100: clamp0(readings?.stamp?.parts?.[100]?.todayReading ?? 0),
        r500: clamp0(readings?.stamp?.parts?.[500]?.todayReading ?? 0),
        r1000: clamp0(readings?.stamp?.parts?.[1000]?.todayReading ?? 0),
      },
      { keepDirty: false },
    );

    if (!readings?.stamp?.parts && localStampDraft) {
      stampForm.reset(
        {
          r50: localStampDraft.readings[50],
          r100: localStampDraft.readings[100],
          r500: localStampDraft.readings[500],
          r1000: localStampDraft.readings[1000],
        },
        { keepDirty: false },
      );
    }

    stockForm.reset(
      {
        s50:
          readings?.stamp?.parts?.[50]?.stockAdded ??
          localStampDraft?.stockAdded[50] ??
          0,
        s100:
          readings?.stamp?.parts?.[100]?.stockAdded ??
          localStampDraft?.stockAdded[100] ??
          0,
        s500:
          readings?.stamp?.parts?.[500]?.stockAdded ??
          localStampDraft?.stockAdded[500] ??
          0,
        s1000:
          readings?.stamp?.parts?.[1000]?.stockAdded ??
          localStampDraft?.stockAdded[1000] ??
          0,
      },
      { keepDirty: false },
    );

    if (readings?.stamp?.parts) {
      setIncludeStockAddition(
        DENOMS.some(
          (denom) => (readings.stamp?.parts?.[denom]?.stockAdded ?? 0) > 0,
        ),
      );
    } else if (localStampDraft) {
      setIncludeStockAddition(localStampDraft.includeStockAddition);
    } else {
      setIncludeStockAddition(false);
    }
    if (typeof readings?.photocopy?.prevReading === "number") {
      setPhotoPrev(readings.photocopy.prevReading);
    }
    if (readings?.stamp?.parts) {
      setStampPrev({
        50: readings.stamp.parts?.[50]?.prevReading ?? 0,
        100: readings.stamp.parts?.[100]?.prevReading ?? 0,
        500: readings.stamp.parts?.[500]?.prevReading ?? 0,
        1000: readings.stamp.parts?.[1000]?.prevReading ?? 0,
      });
    }
    setRoundOffPhotocopy(
      Boolean(
        readings?.photocopy?.isRounded ??
        localPhotocopyDraft?.roundOffPhotocopy,
      ),
    );
    setRoundedPhotocopyAmount(
      readings?.photocopy?.roundedAmount ??
        readings?.photocopy?.amount ??
        localPhotocopyDraft?.roundedPhotocopyAmount ??
        0,
    );

    setHasEdits(false);
  }, [
    open,
    readings?.photocopy?.todayReading,
    readings?.photocopy?.prevReading,
    readings?.photocopy?.roundedAmount,
    readings?.photocopy?.amount,
    readings?.photocopy?.isRounded,
    localPhotocopyDraft,
    localStampDraft,
    readings?.stamp?.parts,
    photoForm,
    stampForm,
    stockForm,
  ]);

  // NEW: detect user edits when readings were already saved
  React.useEffect(() => {
    if (!open) return;
    if (!readingsFound) return;

    const hasAnyEdits =
      photoForm.formState.isDirty ||
      stampForm.formState.isDirty ||
      stockForm.formState.isDirty ||
      includeStockAddition !== hasSavedStockAddition;

    setHasEdits(hasAnyEdits);
  }, [
    open,
    readingsFound,
    photoForm.formState.isDirty,
    stampForm.formState.isDirty,
    stockForm.formState.isDirty,
    includeStockAddition,
    hasSavedStockAddition,
  ]);

  const applyPreviousReadings = React.useCallback(
    (res: {
      photocopy: PhotocopyReadingDoc | null;
      stamp: StampReadingDoc | null;
    }) => {
      setPhotoPrev(res.photocopy?.todayReading ?? 0);

      const prevParts = res.stamp?.parts;
      setStampPrev(
        normalizeDenomRecord({
          50: prevParts?.[50]?.todayReading,
          100: prevParts?.[100]?.todayReading,
          500: prevParts?.[500]?.todayReading,
          1000: prevParts?.[1000]?.todayReading,
        }),
      );
    },
    [],
  );

  const applyManualPreviousReadings = React.useCallback(
    (manual: {
      photoPrev: number;
      stampPrev: Record<Denomination, number>;
    }) => {
      const nextPhotoPrev = clamp0(manual.photoPrev);
      const nextStampPrev = normalizeDenomRecord(manual.stampPrev);

      setManualPhotoPrev(nextPhotoPrev);
      setManualStampPrev(nextStampPrev);
      setPhotoPrev(nextPhotoPrev);
      setStampPrev(nextStampPrev);
      setMissingPreviousReadings(false);
      setResolvedLookbackDays(null);
    },
    [],
  );

  const fetchPreviousByLookback = React.useCallback(
    async (days: number) => {
      const normalizedDays = Math.max(1, Math.floor(days || 1));
      setLoadingPrev(true);
      try {
        const res = await getReadings(todayDateYmd, -normalizedDays);
        if (!hasUsablePreviousBaseline(res)) {
          setMissingPreviousReadings(true);
          setResolvedLookbackDays(null);
          return false;
        }

        applyPreviousReadings(res);
        setMissingPreviousReadings(false);
        setShowPreviousReadingsResolver(false);
        setResolverOpenedFromEdit(false);
        setResolvedLookbackDays(normalizedDays);
        return true;
      } catch (e) {
        toast.error(tReadings("FailedToLoadPreviousReadings"), {
          description: e instanceof Error ? e.message : "Unknown error",
        });
        return false;
      } finally {
        setLoadingPrev(false);
      }
    },
    [applyPreviousReadings, tReadings, todayDateYmd],
  );

  // Resolve previous readings when dialog opens.
  React.useEffect(() => {
    if (!open) return;
    if (!shouldLoadPreviousReadings) return;

    const initKey = `${todayDateYmd}:open`;
    if (prevReadingsInitKeyRef.current === initKey) {
      return;
    }
    prevReadingsInitKeyRef.current = initKey;

    (async () => {
      setInitializingPrev(true);
      setMissingPreviousReadings(false);
      setShowPreviousReadingsResolver(false);
      setResolverOpenedFromEdit(false);
      setResolvedLookbackDays(null);
      setLookbackDays(1);
      setRoundOffPhotocopy(Boolean(readings?.photocopy?.isRounded));
      setRoundedPhotocopyAmount(
        readings?.photocopy?.roundedAmount ?? readings?.photocopy?.amount ?? 0,
      );

      setManualPhotoPrev(0);
      setManualStampPrev(EMPTY_DENOM_RECORD);

      const found = await fetchPreviousByLookback(1);
      if (!found) {
        setMissingPreviousReadings(true);
      }

      setInitializingPrev(false);
    })();
  }, [
    open,
    applyManualPreviousReadings,
    fetchPreviousByLookback,
    readings?.photocopy?.amount,
    readings?.photocopy?.isRounded,
    readings?.photocopy?.roundedAmount,
    shouldLoadPreviousReadings,
    todayDateYmd,
  ]);

  React.useEffect(() => {
    if (!open) {
      prevReadingsInitKeyRef.current = null;
    }
  }, [open]);

  // Live calculations from watch()
  const photoToday = photoForm.watch("todayReading");
  const photoDirtyFields = photoForm.formState.dirtyFields;
  const photoTouchedFields = photoForm.formState.touchedFields;
  const photoRate = 2;
  const hasPhotocopyTodayInput = Boolean(
    isReadOnlyView ||
    hasPhotocopyReading ||
    localPhotocopyDraft?.hasTodayReadingInput ||
    photoDirtyFields.todayReading ||
    photoTouchedFields.todayReading ||
    (photoToday ?? 0) > 0,
  );
  const photoDiff = hasPhotocopyTodayInput
    ? clamp0((photoToday ?? 0) - photoPrev)
    : 0;
  const photoActualAmount = hasPhotocopyTodayInput
    ? clamp0(photoDiff * photoRate)
    : 0;
  const photoAmount = roundOffPhotocopy
    ? hasPhotocopyTodayInput
      ? clamp0(roundedPhotocopyAmount)
      : 0
    : photoActualAmount;

  const r50 = stampForm.watch("r50") ?? 0;
  const r100 = stampForm.watch("r100") ?? 0;
  const r500 = stampForm.watch("r500") ?? 0;
  const r1000 = stampForm.watch("r1000") ?? 0;
  const stampDirtyFields = stampForm.formState.dirtyFields;
  const stampTouchedFields = stampForm.formState.touchedFields;
  const s50 = includeStockAddition ? (stockForm.watch("s50") ?? 0) : 0;
  const s100 = includeStockAddition ? (stockForm.watch("s100") ?? 0) : 0;
  const s500 = includeStockAddition ? (stockForm.watch("s500") ?? 0) : 0;
  const s1000 = includeStockAddition ? (stockForm.watch("s1000") ?? 0) : 0;

  const stampFieldByDenom: Record<
    Denomination,
    "r50" | "r100" | "r500" | "r1000"
  > = {
    50: "r50",
    100: "r100",
    500: "r500",
    1000: "r1000",
  };

  const todayByDenom: Record<Denomination, number> = {
    50: r50,
    100: r100,
    500: r500,
    1000: r1000,
  };

  const stampTodayInputByDenom: Record<Denomination, boolean> = {
    50: Boolean(
      isReadOnlyView ||
      hasStampReading ||
      localStampDraft?.enteredReadings?.[50] ||
      stampDirtyFields.r50 ||
      stampTouchedFields.r50 ||
      todayByDenom[50] > 0,
    ),
    100: Boolean(
      isReadOnlyView ||
      hasStampReading ||
      localStampDraft?.enteredReadings?.[100] ||
      stampDirtyFields.r100 ||
      stampTouchedFields.r100 ||
      todayByDenom[100] > 0,
    ),
    500: Boolean(
      isReadOnlyView ||
      hasStampReading ||
      localStampDraft?.enteredReadings?.[500] ||
      stampDirtyFields.r500 ||
      stampTouchedFields.r500 ||
      todayByDenom[500] > 0,
    ),
    1000: Boolean(
      isReadOnlyView ||
      hasStampReading ||
      localStampDraft?.enteredReadings?.[1000] ||
      stampDirtyFields.r1000 ||
      stampTouchedFields.r1000 ||
      todayByDenom[1000] > 0,
    ),
  };

  const shouldCalculateStampForDenom = (denom: Denomination) => {
    return stampTodayInputByDenom[denom];
  };

  const showStampCalculationByDenom: Record<Denomination, boolean> = {
    50: shouldCalculateStampForDenom(50),
    100: shouldCalculateStampForDenom(100),
    500: shouldCalculateStampForDenom(500),
    1000: shouldCalculateStampForDenom(1000),
  };

  const missingStampTodayReadings = DENOMS.filter(
    (denom) => !stampTodayInputByDenom[denom],
  );
  const missingStampTodayReadingLabels = missingStampTodayReadings
    .map((denom) => `₹${denom}`)
    .join(", ");
  const canProceedFromPhotocopy = hasPhotocopyTodayInput;
  const canProceedFromStamp = missingStampTodayReadings.length === 0;
  const canConfirmReadings = canProceedFromPhotocopy && canProceedFromStamp;

  const stockFieldByDenom: Record<
    Denomination,
    "s50" | "s100" | "s500" | "s1000"
  > = {
    50: "s50",
    100: "s100",
    500: "s500",
    1000: "s1000",
  };

  const stampSold = {
    50: shouldCalculateStampForDenom(50)
      ? clamp0(stampPrev[50] + s50 - r50)
      : 0,
    100: shouldCalculateStampForDenom(100)
      ? clamp0(stampPrev[100] + s100 - r100)
      : 0,
    500: shouldCalculateStampForDenom(500)
      ? clamp0(stampPrev[500] + s500 - r500)
      : 0,
    1000: shouldCalculateStampForDenom(1000)
      ? clamp0(stampPrev[1000] + s1000 - r1000)
      : 0,
  } as const;

  const stampAmounts = {
    50: clamp0(stampSold[50] * 50),
    100: clamp0(stampSold[100] * 100),
    500: clamp0(stampSold[500] * 500),
    1000: clamp0(stampSold[1000] * 1000),
  } as const;

  const stampStockAdded = {
    50: s50,
    100: s100,
    500: s500,
    1000: s1000,
  } as const;

  const stampTotal = DENOMS.reduce((acc, d) => acc + stampAmounts[d], 0);

  // Step navigation
  const goNextFromPhotocopy = async () => {
    if (!hasPhotocopyTodayInput) {
      toast.error(tReadings("PhotocopyReadingRequired"));
      return;
    }

    const valid = await photoForm.trigger();
    if (!valid) return;

    setSavingPhotocopyStep(true);
    try {
      const photoValues = photoForm.getValues();
      const nextDraft: LocalPhotocopyDraft = {
        todayReading: clamp0(photoValues.todayReading ?? 0),
        hasTodayReadingInput: Boolean(
          photoDirtyFields.todayReading ||
          photoTouchedFields.todayReading ||
          clamp0(photoValues.todayReading ?? 0) > 0,
        ),
        roundOffPhotocopy,
        roundedPhotocopyAmount: clamp0(roundedPhotocopyAmount),
      };

      persistPhotocopyDraft(nextDraft);

      const nextFlags: LocalReadingsFlags = {
        photocopyDone: true,
        stampDone: Boolean(localReadingsFlags?.stampDone),
        fullyDone: false,
      };
      persistReadingsFlags(nextFlags);
      photoForm.reset(
        { todayReading: nextDraft.todayReading },
        { keepDirty: false },
      );
    } finally {
      setSavingPhotocopyStep(false);
    }

    goToStep("stamp");
  };

  const goNextFromStamp = async () => {
    if (missingStampTodayReadings.length > 0) {
      toast.error(
        tReadings("StampReadingsRequired", {
          denominations: missingStampTodayReadingLabels,
        }),
      );
      return;
    }

    const valid = await stampForm.trigger();
    if (!valid) return;

    const stampValues = stampForm.getValues();
    const stockValues = stockForm.getValues();
    const nextStampDraft: LocalStampDraft = {
      readings: {
        50: clamp0(stampValues.r50 ?? 0),
        100: clamp0(stampValues.r100 ?? 0),
        500: clamp0(stampValues.r500 ?? 0),
        1000: clamp0(stampValues.r1000 ?? 0),
      },
      enteredReadings: {
        50: Boolean(
          stampDirtyFields.r50 ||
          stampTouchedFields.r50 ||
          clamp0(stampValues.r50 ?? 0) > 0,
        ),
        100: Boolean(
          stampDirtyFields.r100 ||
          stampTouchedFields.r100 ||
          clamp0(stampValues.r100 ?? 0) > 0,
        ),
        500: Boolean(
          stampDirtyFields.r500 ||
          stampTouchedFields.r500 ||
          clamp0(stampValues.r500 ?? 0) > 0,
        ),
        1000: Boolean(
          stampDirtyFields.r1000 ||
          stampTouchedFields.r1000 ||
          clamp0(stampValues.r1000 ?? 0) > 0,
        ),
      },
      includeStockAddition,
      stockAdded: {
        50: includeStockAddition ? clamp0(stockValues.s50 ?? 0) : 0,
        100: includeStockAddition ? clamp0(stockValues.s100 ?? 0) : 0,
        500: includeStockAddition ? clamp0(stockValues.s500 ?? 0) : 0,
        1000: includeStockAddition ? clamp0(stockValues.s1000 ?? 0) : 0,
      },
    };

    persistStampDraft(nextStampDraft);

    const nextFlags: LocalReadingsFlags = {
      photocopyDone: Boolean(
        localReadingsFlags?.photocopyDone || hasLocalPhotocopyDraft,
      ),
      stampDone: true,
      fullyDone: false,
    };
    persistReadingsFlags(nextFlags);

    goToStep("review");
  };

  const goBack = () => {
    setStep((s) => (s === "review" ? "stamp" : "photocopy"));
  };

  // FINAL confirm: write to DB only here
  const onConfirmSave = async () => {
    try {
      setSaving(true);

      if (!hasPhotocopyTodayInput) {
        setStep("photocopy");
        toast.error(tReadings("PhotocopyReadingRequired"));
        return;
      }

      if (missingStampTodayReadings.length > 0) {
        setStep("stamp");
        toast.error(
          tReadings("StampReadingsRequired", {
            denominations: missingStampTodayReadingLabels,
          }),
        );
        return;
      }

      const pv = await photoForm.trigger();
      if (!pv) {
        setStep("photocopy");
        return;
      }

      const sv = await stampForm.trigger();
      if (!sv) {
        setStep("stamp");
        return;
      }

      if (includeStockAddition) {
        const skv = await stockForm.trigger();
        if (!skv) {
          setStep("stamp");
          return;
        }
      }

      const photoValues = photoForm.getValues();
      const stampValues = stampForm.getValues();
      const stockValues = includeStockAddition ? stockForm.getValues() : null;

      if (authState.status !== "ready") {
        toast.error("Authentication required");
        return;
      }

      // Force-refresh token so latest custom claims are available on every device.
      // Without this, one device can keep a stale token (missing admin claim)
      // and server actions fail with a generic production RSC error.
      const tokenResult = await authState.currentUser.getIdTokenResult(true);
      if (!tokenResult.claims.admin) {
        toast.error("You are not authorized to save readings.");
        return;
      }

      const token = tokenResult.token;
      const auditTimestamp = new Date().toISOString();
      const auditKind: "saved" | "updated" = readingsFound
        ? "updated"
        : "saved";

      // Save both; if you want strict atomicity, you can create one server action that writes both in a transaction.
      const [photoRes, stampRes] = await Promise.all([
        savePhotocopyReading({
          todayDateYmd,
          todayReading: photoValues.todayReading,
          prevReading: photoPrev,
          useRoundedAmount: roundOffPhotocopy,
          roundedAmount: roundOffPhotocopy ? roundedPhotocopyAmount : null,
          user: authState.clientUser,
          authtoken: token,
          auditTimestamp,
          auditKind,
        }),
        saveStampReading({
          todayDateYmd,
          partsTodayReadings: {
            50: stampValues.r50,
            100: stampValues.r100,
            500: stampValues.r500,
            1000: stampValues.r1000,
          },
          prevPartsReadings: stampPrev,
          partsStockAdded: includeStockAddition
            ? {
                50: stockValues?.s50 ?? 0,
                100: stockValues?.s100 ?? 0,
                500: stockValues?.s500 ?? 0,
                1000: stockValues?.s1000 ?? 0,
              }
            : undefined,
          user: authState.clientUser,
          authtoken: token,
          auditTimestamp,
          auditKind,
        }),
      ]);

      if (!photoRes.success) {
        throw new Error(photoRes.error || "Unable to save photocopy reading");
      }

      if (!stampRes.success) {
        throw new Error(stampRes.error || "Unable to save stamp reading");
      }

      toast.success("Saved photocopy & stamp");
      onSaved?.({ photocopy: photoRes.data, stamp: stampRes.data });

      // NEW: reset dirty/edit state after successful save
      photoForm.reset(
        { todayReading: photoValues.todayReading },
        { keepDirty: false },
      );
      stampForm.reset(
        {
          r50: stampValues.r50,
          r100: stampValues.r100,
          r500: stampValues.r500,
          r1000: stampValues.r1000,
        },
        { keepDirty: false },
      );
      if (includeStockAddition) {
        stockForm.reset(
          {
            s50: 0,
            s100: 0,
            s500: 0,
            s1000: 0,
          },
          { keepDirty: false },
        );
      }
      setHasEdits(false);
      clearStepDrafts();

      const nextFlags: LocalReadingsFlags = {
        photocopyDone: true,
        stampDone: true,
        fullyDone: true,
      };
      persistReadingsFlags(nextFlags);

      closeDialog();
    } catch (e) {
      console.error("[Readings] Save failed", e);

      const message = e instanceof Error ? e.message : "Unknown error";
      const isMaskedProdServerError = message.includes(
        "Server Components render",
      );

      toast.error("Save failed", {
        description: isMaskedProdServerError
          ? "Session or authorization issue. Please refresh and login again."
          : message,
      });
    } finally {
      setSaving(false);
    }
  };

  const StepHeader = () => {
    const itemCls = (active: boolean) =>
      [
        "",
        active ? "text-foreground font-medium" : "text-muted-foreground",
        textBodyCls,
      ].join(" ");

    return (
      <div className="flex items-center justify-between gap-1 border rounded-md px-3 py-2 overflow-x-auto">
        <span className={itemCls(step === "photocopy")}>
          1. {tReadings("Photocopy")}{" "}
          {hasEffectivePhotocopy ? (
            <CheckCircle className="inline size-4 text-green-700" />
          ) : null}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={itemCls(step === "stamp")}>
          2. {tReadings("Stamp")}{" "}
          {hasEffectiveStamp ? (
            <CheckCircle className="inline size-4 text-green-700" />
          ) : null}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={itemCls(step === "review")}>
          3. {tReadings("Review")}
        </span>
      </div>
    );
  };

  const TriggerButton = (
    <Button
      className={[
        "shadow-md font-medium! items-center flex justify-center",
        textBodyCls,
        readingsFound
          ? "border-green-700 text-green-700 hover:text-green-800 font-semibold"
          : hasPartialReadings
            ? "border-amber-700 text-amber-700 hover:text-amber-800 font-semibold"
            : "text-primary",
      ].join(" ")}
      variant={"outline"}
      disabled={syncing}
    >
      <span className="hidden md:flex">
        {tReadings("PhotocopyStampReadings")}{" "}
      </span>
      <span className="md:hidden">{tReadings("SD&FSReadings")} </span>
      {syncing ? (
        <Loader2 className="size-4 animate-spin" />
      ) : readingsFound ? (
        <CheckCircle className="size-4 text-green-700" />
      ) : hasPartialReadings ? (
        <ClockFading className="size-4 text-amber-700" />
      ) : (
        <ChevronsRight className="size-4" />
      )}
    </Button>
  );

  const Content = isReadOnlyView ? (
    // Read-only mode: Show review step with option to view other steps
    <div className="w-full flex min-h-0 flex-col gap-2 overflow-auto">
      {step !== "review" && <StepHeader />}

      {resolvedLookbackDays && resolvedLookbackDays > 1 ? (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
          {tReadings("UsingLatestReadingsFromDaysAgo")} {resolvedLookbackDays}.{" "}
          {tReadings("PleaseVerifyBeforeContinue")}
        </div>
      ) : null}

      {step === "photocopy" ? (
        <PhotocopyStep
          control={photoForm.control}
          todayReadingError={
            photoForm.formState.errors.todayReading
              ? String(photoForm.formState.errors.todayReading.message)
              : undefined
          }
          loadingPrev={loadingPrev}
          saving={saving}
          savingPhotocopyStep={savingPhotocopyStep}
          photoPrev={photoPrev}
          photoDiff={photoDiff}
          photoActualAmount={photoActualAmount}
          photoAmount={photoAmount}
          roundOffPhotocopy={roundOffPhotocopy}
          roundedPhotocopyAmount={roundedPhotocopyAmount}
          textPageHeadCls={textPageHeadCls}
          textBodyCls={textBodyCls}
          textSmCls={textSmCls}
          tCommon={tCommon}
          tReadings={tReadings}
          canEditPreviousReadings={true}
          disableNext={!canProceedFromPhotocopy}
          onEditPreviousReadings={openPreviousReadingsResolverFromEdit}
          onRoundOffChange={(checked) => {
            setRoundOffPhotocopy(checked);
            if (checked) {
              setRoundedPhotocopyAmount((current) =>
                current > 0 ? current : Math.round(photoActualAmount),
              );
            }
          }}
          onRoundedAmountChange={setRoundedPhotocopyAmount}
          onCancel={closeDialog}
          onNext={() => goToStep("review")}
        />
      ) : step === "stamp" ? (
        <StampStep
          control={stampForm.control}
          errors={stampForm.formState.errors}
          stampFieldByDenom={stampFieldByDenom}
          showStampCalculationByDenom={showStampCalculationByDenom}
          stockControl={stockForm.control}
          stockErrors={stockForm.formState.errors}
          stockFieldByDenom={stockFieldByDenom}
          denoms={DENOMS}
          stampPrev={stampPrev}
          stampSold={stampSold}
          stampAmounts={stampAmounts}
          stampTotal={stampTotal}
          textPageHeadCls={textPageHeadCls}
          textBodyCls={textBodyCls}
          textSmCls={textSmCls}
          tCommon={tCommon}
          tReadings={tReadings}
          saving={saving}
          loadingPrev={loadingPrev}
          includeStockAddition={includeStockAddition}
          disableNext={!canProceedFromStamp}
          onBack={() => goToStep("review")}
          onNext={() => goToStep("review")}
          onToggleStockAddition={setIncludeStockAddition}
        />
      ) : (
        <ReviewStep
          denoms={DENOMS}
          textPageHeadCls={textPageHeadCls}
          textBodyCls={textBodyCls}
          textSmCls={textSmCls}
          textXsCls={textXsCls}
          tCommon={tCommon}
          tReadings={tReadings}
          photoPrev={photoPrev}
          photoToday={photoToday ?? 0}
          photoDiff={photoDiff}
          photoActualAmount={photoActualAmount}
          photoAmount={photoAmount}
          photoIsRounded={roundOffPhotocopy}
          stampPrev={stampPrev}
          stampStockAdded={stampStockAdded}
          stampSold={stampSold}
          stampAmounts={stampAmounts}
          stampTotal={stampTotal}
          todayByDenom={todayByDenom}
          showStampCalculationByDenom={showStampCalculationByDenom}
          readingsFound={readingsFound}
          hasEdits={hasEdits}
          saving={saving}
          loadingPrev={loadingPrev}
          readOnly={readOnly}
          includeStockAddition={includeStockAddition}
          stockFormIsDirty={stockForm.formState.isDirty}
          disableConfirmSave={!canConfirmReadings}
          onEditPhotocopy={() => goToStep("photocopy")}
          onEditStamp={() => goToStep("stamp")}
          onBack={goBack}
          onConfirmSave={onConfirmSave}
        />
      )}
    </div>
  ) : (
    // Edit mode: Show full workflow
    <>
      <div className="w-full flex min-h-0 flex-col gap-2 overflow-auto">
        <StepHeader />

        {resolvedLookbackDays && resolvedLookbackDays > 1 ? (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
            {tReadings("UsingLatestReadingsFromDaysAgo")} {resolvedLookbackDays}
            . {tReadings("PleaseVerifyBeforeContinue")}
          </div>
        ) : null}

        <div className="flex items-center justify-between w-full flex-col gap-2 md:flex-row">
          {hasEdits && (
            <div className="flex gap-2 items-center justify-start text-yellow-700 text-sm">
              <TriangleAlert className="size-4 text-yellow-700" />
              {tReadings("EditedSomeValues")}
            </div>
          )}
        </div>

        {step === "photocopy" ? (
          <PhotocopyStep
            control={photoForm.control}
            todayReadingError={
              photoForm.formState.errors.todayReading
                ? String(photoForm.formState.errors.todayReading.message)
                : undefined
            }
            loadingPrev={loadingPrev}
            saving={saving}
            savingPhotocopyStep={savingPhotocopyStep}
            photoPrev={photoPrev}
            photoDiff={photoDiff}
            photoActualAmount={photoActualAmount}
            photoAmount={photoAmount}
            roundOffPhotocopy={roundOffPhotocopy}
            roundedPhotocopyAmount={roundedPhotocopyAmount}
            textPageHeadCls={textPageHeadCls}
            textBodyCls={textBodyCls}
            textSmCls={textSmCls}
            tCommon={tCommon}
            tReadings={tReadings}
            canEditPreviousReadings={true}
            disableNext={!canProceedFromPhotocopy}
            onEditPreviousReadings={openPreviousReadingsResolverFromEdit}
            onRoundOffChange={(checked) => {
              setRoundOffPhotocopy(checked);
              if (checked) {
                setRoundedPhotocopyAmount((current) =>
                  current > 0 ? current : Math.round(photoActualAmount),
                );
              }
            }}
            onRoundedAmountChange={setRoundedPhotocopyAmount}
            onCancel={closeDialog}
            onNext={goNextFromPhotocopy}
          />
        ) : null}

        {step === "stamp" ? (
          <StampStep
            control={stampForm.control}
            errors={stampForm.formState.errors}
            stampFieldByDenom={stampFieldByDenom}
            showStampCalculationByDenom={showStampCalculationByDenom}
            stockControl={stockForm.control}
            stockErrors={stockForm.formState.errors}
            stockFieldByDenom={stockFieldByDenom}
            denoms={DENOMS}
            stampPrev={stampPrev}
            stampSold={stampSold}
            stampAmounts={stampAmounts}
            stampTotal={stampTotal}
            textPageHeadCls={textPageHeadCls}
            textBodyCls={textBodyCls}
            textSmCls={textSmCls}
            tCommon={tCommon}
            tReadings={tReadings}
            saving={saving}
            loadingPrev={loadingPrev}
            includeStockAddition={includeStockAddition}
            disableNext={!canProceedFromStamp}
            onBack={goBack}
            onNext={goNextFromStamp}
            onToggleStockAddition={setIncludeStockAddition}
          />
        ) : null}

        {step === "review" ? (
          <ReviewStep
            denoms={DENOMS}
            textPageHeadCls={textPageHeadCls}
            textBodyCls={textBodyCls}
            textSmCls={textSmCls}
            textXsCls={textXsCls}
            tCommon={tCommon}
            tReadings={tReadings}
            photoPrev={photoPrev}
            photoToday={photoToday ?? 0}
            photoDiff={photoDiff}
            photoActualAmount={photoActualAmount}
            photoAmount={photoAmount}
            photoIsRounded={roundOffPhotocopy}
            stampPrev={stampPrev}
            stampStockAdded={stampStockAdded}
            stampSold={stampSold}
            stampAmounts={stampAmounts}
            stampTotal={stampTotal}
            todayByDenom={todayByDenom}
            showStampCalculationByDenom={showStampCalculationByDenom}
            readingsFound={readingsFound}
            hasEdits={hasEdits}
            saving={saving}
            loadingPrev={loadingPrev}
            readOnly={false}
            includeStockAddition={includeStockAddition}
            stockFormIsDirty={stockForm.formState.isDirty}
            disableConfirmSave={!canConfirmReadings}
            onEditPhotocopy={() => goToStep("photocopy")}
            onEditStamp={() => goToStep("stamp")}
            onBack={goBack}
            onConfirmSave={onConfirmSave}
          />
        ) : null}
      </div>
    </>
  );

  const PreviousReadingsResolverContent = (
    <PreviousReadingsResolver
      resolverOpenedFromEdit={resolverOpenedFromEdit}
      textBodyCls={textBodyCls}
      textSmCls={textSmCls}
      denoms={DENOMS}
      lookbackDays={lookbackDays}
      loadingPrev={loadingPrev}
      manualPhotoPrev={manualPhotoPrev}
      manualStampPrev={manualStampPrev}
      tCommon={tCommon}
      tReadings={tReadings}
      onLookbackDaysChange={setLookbackDays}
      onFindLatestReadings={async () => {
        const days = Math.max(1, Math.floor(lookbackDays || 1));
        const found = await fetchPreviousByLookback(days);
        if (!found) {
          toast.error(tReadings("NoReadingsForHolidayOffset"));
          return;
        }
        toast.success(tReadings("LatestReadingsFoundVerify"));
      }}
      onManualPhotoPrevChange={setManualPhotoPrev}
      onManualStampPrevChange={(denom, value) =>
        setManualStampPrev((prev) => ({
          ...prev,
          [denom]: value,
        }))
      }
      onUseManualReadings={async () => {
        applyManualPreviousReadings({
          photoPrev: manualPhotoPrev,
          stampPrev: manualStampPrev,
        });

        setShowPreviousReadingsResolver(false);
        setResolverOpenedFromEdit(false);
        toast.success(tReadings("ManualPreviousReadingsSet"));
      }}
      onBackToReadings={() => {
        setShowPreviousReadingsResolver(false);
        setResolverOpenedFromEdit(false);
      }}
    />
  );

  const InitialLoading = (
    <div className="w-full rounded-md border p-4 text-sm text-muted-foreground inline-flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      {tReadings("LoadingYesterdaysReadings")}
    </div>
  );

  const ActiveContent = isReadOnlyView
    ? Content
    : shouldLoadPreviousReadings && initializingPrev
      ? InitialLoading
      : (shouldLoadPreviousReadings || resolverOpenedFromEdit) &&
          (missingPreviousReadings || showPreviousReadingsResolver)
        ? PreviousReadingsResolverContent
        : Content;

  if (isTabletUp) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{TriggerButton}</DialogTrigger>

        <DialogContent
          className="min-w-[90%] p-0 px-3 py-4 md:px-4 md:py-6 shadow-2xl overflow-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isReadOnlyView
                ? tReadings("SD&PhotocopyStampReadings")
                : tReadings("EnterReadings")}
            </DialogTitle>
          </DialogHeader>

          {ActiveContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleMobileDrawerOpenChange}
      dismissible={false}
      disablePreventScroll={false}
      repositionInputs={false}
    >
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>

      <DrawerContent
        className="max-h-[98dvh] p-0 px-3 py-3 shadow-2xl [&>div:first-child]:hidden md:px-4 md:py-6"
        style={
          mobileViewportMaxHeight
            ? { maxHeight: `${mobileViewportMaxHeight}px` }
            : undefined
        }
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
        onCloseAutoFocus={(e: Event) => e.preventDefault()}
      >
        <DrawerHeader className="flex-row items-center justify-between gap-2 text-left">
          <DrawerTitle
            className={clsx("flex items-center gap-2 text-lg", textPageHeadCls)}
          >
            <DateDisplay
              value={todayDateYmd}
              dayRequired={false}
              type="docId"
              className="text-sm text-muted-foreground"
            />
            <span
              aria-hidden="true"
              className="inline-flex shrink-0 text-foreground/70 font-semibold leading-none"
            >
              |
            </span>
            {isReadOnlyView ? (
              <>
                <span className="hidden md:flex">
                  {tReadings("PhotocopyStampReadings")}{" "}
                </span>
                <span className="md:hidden">{tReadings("SD&FSReadings")} </span>
              </>
            ) : (
              tReadings("EnterReadings")
            )}
          </DrawerTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={closeDialog}
          >
            <X className="size-4" />
          </Button>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto pb-2">{ActiveContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
