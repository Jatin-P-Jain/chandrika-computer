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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useBreakpoints } from "@/hooks/useBreakPoints";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useAuth } from "@/context/useAuth";

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
  const { textBodyCls, textSmCls, textXsCls } = useLocaleTypography();
  const { authState } = useAuth();

  const { isTabletUp } = useBreakpoints();

  const [open, setOpen] = React.useState(startOpen);
  const [step, setStep] = React.useState<Step>(
    readOnly ? "review" : "photocopy",
  );
  const [loadingPrev, setLoadingPrev] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [includeStockAddition, setIncludeStockAddition] = React.useState(false);

  // yesterday readings
  const [photoPrev, setPhotoPrev] = React.useState(0);
  const [stampPrev, setStampPrev] = React.useState<
    Record<Denomination, number>
  >({
    50: 0,
    100: 0,
    500: 0,
    1000: 0,
  });

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
      r50: readings?.stamp?.parts?.[50]?.todayReading ?? 0,
      r100: readings?.stamp?.parts?.[100]?.todayReading ?? 0,
      r500: readings?.stamp?.parts?.[500]?.todayReading ?? 0,
      r1000: readings?.stamp?.parts?.[1000]?.todayReading ?? 0,
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

  const readingsFound = !!(
    readings?.success ||
    readings?.photocopy ||
    readings?.stamp
  );

  // In read-only mode, always reset back to review on open/close.
  React.useEffect(() => {
    if (readOnly) {
      setStep("review");
    }
  }, [readOnly, open]);

  // reset step when dialog opens/closes (optional but keeps UX clean)
  React.useEffect(() => {
    if (readOnly) return; // Skip this for read-only mode
    if (open && !readingsFound) {
      setStep("photocopy");
    } else {
      setStep("review");
    }
  }, [open, readingsFound, readOnly]);

  // NEW: reset edit state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setHasEdits(false);
    } else {
      setHasEdits(false);
    }
  }, [open]);

  // NEW: when existing readings are loaded, ensure forms reflect them and clear edit state
  React.useEffect(() => {
    if (!open) return;

    photoForm.reset(
      { todayReading: readings?.photocopy?.todayReading ?? 0 },
      { keepDirty: false },
    );

    stampForm.reset(
      {
        r50: readings?.stamp?.parts?.[50]?.todayReading ?? 0,
        r100: readings?.stamp?.parts?.[100]?.todayReading ?? 0,
        r500: readings?.stamp?.parts?.[500]?.todayReading ?? 0,
        r1000: readings?.stamp?.parts?.[1000]?.todayReading ?? 0,
      },
      { keepDirty: false },
    );

    stockForm.reset(
      {
        s50: readings?.stamp?.parts?.[50]?.stockAdded ?? 0,
        s100: readings?.stamp?.parts?.[100]?.stockAdded ?? 0,
        s500: readings?.stamp?.parts?.[500]?.stockAdded ?? 0,
        s1000: readings?.stamp?.parts?.[1000]?.stockAdded ?? 0,
      },
      { keepDirty: false },
    );

    setIncludeStockAddition(
      DENOMS.some(
        (denom) => (readings?.stamp?.parts?.[denom]?.stockAdded ?? 0) > 0,
      ),
    );

    setHasEdits(false);
  }, [
    open,
    readings?.photocopy?.todayReading,
    readings?.stamp?.parts,
    photoForm,
    stampForm,
    stockForm,
  ]);

  // NEW: detect user edits when readings were already saved
  React.useEffect(() => {
    if (!open) return;
    if (!readingsFound) return;

    if (
      photoForm.formState.isDirty ||
      stampForm.formState.isDirty ||
      stockForm.formState.isDirty
    ) {
      setHasEdits(true);
    }
  }, [
    open,
    readingsFound,
    photoForm.formState.isDirty,
    stampForm.formState.isDirty,
    stockForm.formState.isDirty,
  ]);

  // Fetch yesterday on open
  React.useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoadingPrev(true);
        const res = await getReadings(todayDateYmd, -1);

        setPhotoPrev(res.photocopy?.todayReading ?? 0);

        const prevParts = res.stamp?.parts;
        setStampPrev({
          50: prevParts?.[50]?.todayReading ?? 0,
          100: prevParts?.[100]?.todayReading ?? 0,
          500: prevParts?.[500]?.todayReading ?? 0,
          1000: prevParts?.[1000]?.todayReading ?? 0,
        });
      } catch (e) {
        toast.error("Failed to load yesterday", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
      } finally {
        setLoadingPrev(false);
      }
    })();
  }, [open, todayDateYmd]);

  // Live calculations from watch()
  const photoToday = photoForm.watch("todayReading");
  const photoRate = 1.5;
  const photoDiff = clamp0((photoToday ?? 0) - photoPrev);
  const photoAmount = clamp0(photoDiff * photoRate);

  const r50 = stampForm.watch("r50") ?? 0;
  const r100 = stampForm.watch("r100") ?? 0;
  const r500 = stampForm.watch("r500") ?? 0;
  const r1000 = stampForm.watch("r1000") ?? 0;
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
    50: clamp0(r50 - stampPrev[50] - s50),
    100: clamp0(r100 - stampPrev[100] - s100),
    500: clamp0(r500 - stampPrev[500] - s500),
    1000: clamp0(r1000 - stampPrev[1000] - s1000),
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
  const todayByDenom: Record<Denomination, number> = {
    50: r50,
    100: r100,
    500: r500,
    1000: r1000,
  };

  // Step navigation
  const goNextFromPhotocopy = async () => {
    const valid = await photoForm.trigger();
    if (!valid) return;
    setStep("stamp");
  };

  const goNextFromStamp = async () => {
    const valid = await stampForm.trigger();
    if (!valid) return;
    setStep("review");
  };

  const goBack = () => {
    setStep((s) => (s === "review" ? "stamp" : "photocopy"));
  };

  // FINAL confirm: write to DB only here
  const onConfirmSave = async () => {
    try {
      setSaving(true);

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

      const token = await authState.currentUser.getIdToken();
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

      setOpen(false);
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const StepHeader = () => {
    const itemCls = (active: boolean) =>
      [
        "text-sm",
        active ? "text-foreground font-medium" : "text-muted-foreground",
        textBodyCls,
      ].join(" ");

    return (
      <div className="flex items-center justify-between gap-1 border rounded-md px-3 py-2 overflow-x-auto">
        <span className={itemCls(step === "photocopy")}>
          1. {tReadings("Photocopy")}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={itemCls(step === "stamp")}>
          2. {tReadings("Stamp")}
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
        "shadow-md font-medium!",
        readingsFound
          ? "border-green-700 text-green-700 hover:text-green-800"
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
      ) : (
        <ChevronsRight className="size-4" />
      )}
    </Button>
  );

  const Content = readOnly ? (
    // Read-only mode: Show review step with option to view other steps
    <div className="w-full flex flex-col gap-2 overflow-auto">
      {step !== "review" && <StepHeader />}

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
          photoPrev={photoPrev}
          photoDiff={photoDiff}
          photoAmount={photoAmount}
          textBodyCls={textBodyCls}
          textSmCls={textSmCls}
          tCommon={tCommon}
          tReadings={tReadings}
          onCancel={() => setOpen(false)}
          onNext={() => setStep("review")}
        />
      ) : step === "stamp" ? (
        <StampStep
          control={stampForm.control}
          errors={stampForm.formState.errors}
          stampFieldByDenom={stampFieldByDenom}
          stockControl={stockForm.control}
          stockErrors={stockForm.formState.errors}
          stockFieldByDenom={stockFieldByDenom}
          denoms={DENOMS}
          stampPrev={stampPrev}
          stampSold={stampSold}
          stampAmounts={stampAmounts}
          stampTotal={stampTotal}
          textBodyCls={textBodyCls}
          textSmCls={textSmCls}
          tCommon={tCommon}
          tReadings={tReadings}
          saving={saving}
          loadingPrev={loadingPrev}
          includeStockAddition={includeStockAddition}
          onBack={() => setStep("review")}
          onNext={() => setStep("review")}
          onToggleStockAddition={setIncludeStockAddition}
        />
      ) : (
        <ReviewStep
          denoms={DENOMS}
          textBodyCls={textBodyCls}
          textSmCls={textSmCls}
          textXsCls={textXsCls}
          tCommon={tCommon}
          tReadings={tReadings}
          photoPrev={photoPrev}
          photoToday={photoToday ?? 0}
          photoDiff={photoDiff}
          photoAmount={photoAmount}
          stampPrev={stampPrev}
          stampStockAdded={stampStockAdded}
          stampSold={stampSold}
          stampAmounts={stampAmounts}
          stampTotal={stampTotal}
          todayByDenom={todayByDenom}
          readingsFound={readingsFound}
          hasEdits={hasEdits}
          saving={saving}
          loadingPrev={loadingPrev}
          readOnly={readOnly}
          onEditPhotocopy={() => setStep("photocopy")}
          onEditStamp={() => setStep("stamp")}
          onBack={goBack}
          onConfirmSave={onConfirmSave}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  ) : (
    // Edit mode: Show full workflow
    <>
      <div className="w-full flex flex-col gap-2 overflow-auto">
        <StepHeader />

        <div className="flex items-center justify-between w-full flex-col gap-2 md:flex-row">
          {readings?.success && (
            <div className="flex gap-2 items-center justify-start text-green-700 text-xs">
              <CheckCircle className="size-4 text-green-700" />
              {tReadings("ReadingsAlreadySaved")}
            </div>
          )}
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
            photoPrev={photoPrev}
            photoDiff={photoDiff}
            photoAmount={photoAmount}
            textBodyCls={textBodyCls}
            textSmCls={textSmCls}
            tCommon={tCommon}
            tReadings={tReadings}
            onCancel={() => setOpen(false)}
            onNext={goNextFromPhotocopy}
          />
        ) : null}

        {step === "stamp" ? (
          <StampStep
            control={stampForm.control}
            errors={stampForm.formState.errors}
            stampFieldByDenom={stampFieldByDenom}
            stockControl={stockForm.control}
            stockErrors={stockForm.formState.errors}
            stockFieldByDenom={stockFieldByDenom}
            denoms={DENOMS}
            stampPrev={stampPrev}
            stampSold={stampSold}
            stampAmounts={stampAmounts}
            stampTotal={stampTotal}
            textBodyCls={textBodyCls}
            textSmCls={textSmCls}
            tCommon={tCommon}
            tReadings={tReadings}
            saving={saving}
            loadingPrev={loadingPrev}
            includeStockAddition={includeStockAddition}
            onBack={goBack}
            onNext={goNextFromStamp}
            onToggleStockAddition={setIncludeStockAddition}
          />
        ) : null}

        {step === "review" ? (
          <ReviewStep
            denoms={DENOMS}
            textBodyCls={textBodyCls}
            textSmCls={textSmCls}
            textXsCls={textXsCls}
            tCommon={tCommon}
            tReadings={tReadings}
            photoPrev={photoPrev}
            photoToday={photoToday ?? 0}
            photoDiff={photoDiff}
            photoAmount={photoAmount}
            stampPrev={stampPrev}
            stampStockAdded={stampStockAdded}
            stampSold={stampSold}
            stampAmounts={stampAmounts}
            stampTotal={stampTotal}
            todayByDenom={todayByDenom}
            readingsFound={readingsFound}
            hasEdits={hasEdits}
            saving={saving}
            loadingPrev={loadingPrev}
            readOnly={false}
            onEditPhotocopy={() => setStep("photocopy")}
            onEditStamp={() => setStep("stamp")}
            onBack={goBack}
            onConfirmSave={onConfirmSave}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </div>
    </>
  );

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
              {readOnly
                ? tReadings("SD&PhotocopyStampReadings")
                : tReadings("EnterReadings")}
            </DialogTitle>
          </DialogHeader>

          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>

      <DrawerContent
        className="p-0 px-3 py-3 md:px-4 md:py-6 shadow-2xl"
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
        onCloseAutoFocus={(e: Event) => e.preventDefault()}
      >
        <DrawerHeader>
          <DrawerTitle>
            {readOnly
              ? tReadings("PhotocopyStampReadings")
              : tReadings("EnterReadings")}
          </DrawerTitle>
        </DrawerHeader>
        {Content}
      </DrawerContent>
    </Drawer>
  );
}
