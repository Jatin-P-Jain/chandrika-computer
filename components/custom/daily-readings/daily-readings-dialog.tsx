"use client";

import * as React from "react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
} from "@/schema/readings.schema";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2Icon,
  Pencil,
  SaveIcon,
  TriangleAlert,
  X,
} from "lucide-react";
import { ReadingInput } from "../daily-page/common-components/reading-input";
import { formatINR } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { useBreakpoints } from "@/hooks/useBreakPoints";

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
  readings?: {
    success: boolean;
    photocopy?: PhotocopyReadingDoc | null;
    stamp?: StampReadingDoc | null;
  };
};

type Step = "photocopy" | "stamp" | "review";

export default function DailyReadingsDialog({
  todayDateYmd,
  onSaved,
  readings,
}: Props) {
  const tCommon = useTranslations("Common");
  const tReadings = useTranslations("Readings");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textBodyCls = clsx(isHi && "text-base! font-[inherit]");
  const textSmCls = clsx(isHi && "text-sm! font-[inherit]");
  const textXsCls = clsx(isHi && "text-xs! font-[inherit]");

  const { isTabletUp } = useBreakpoints();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("photocopy");
  const [loadingPrev, setLoadingPrev] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

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

  const readingsFound = readings?.success;

  // reset step when dialog opens/closes (optional but keeps UX clean)
  React.useEffect(() => {
    if (open && !readingsFound) {
      setStep("photocopy");
    } else {
      setStep("review");
    }
  }, [open, readingsFound]);

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

    setHasEdits(false);
  }, [
    open,
    readings?.photocopy?.todayReading,
    readings?.stamp?.parts,
    photoForm,
    stampForm,
  ]);

  // NEW: detect user edits when readings were already saved
  React.useEffect(() => {
    if (!open) return;
    if (!readingsFound) return;

    if (photoForm.formState.isDirty || stampForm.formState.isDirty) {
      setHasEdits(true);
    }
  }, [
    open,
    readingsFound,
    photoForm.formState.isDirty,
    stampForm.formState.isDirty,
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

  const stampSold = {
    50: clamp0(r50 - stampPrev[50]),
    100: clamp0(r100 - stampPrev[100]),
    500: clamp0(r500 - stampPrev[500]),
    1000: clamp0(r1000 - stampPrev[1000]),
  } as const;

  const stampAmounts = {
    50: clamp0((r50 - stampPrev[50]) * 50),
    100: clamp0((r100 - stampPrev[100]) * 100),
    500: clamp0((r500 - stampPrev[500]) * 500),
    1000: clamp0((r1000 - stampPrev[1000]) * 1000),
  } as const;

  const stampTotal = DENOMS.reduce((acc, d) => acc + stampAmounts[d], 0);

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
    setStep((s) =>
      s === "review" ? "stamp" : s === "stamp" ? "photocopy" : "photocopy",
    );
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

      const photoValues = photoForm.getValues();
      const stampValues = stampForm.getValues();

      // Save both; if you want strict atomicity, you can create one server action that writes both in a transaction.
      const [photoRes, stampRes] = await Promise.all([
        savePhotocopyReading({
          todayDateYmd,
          todayReading: photoValues.todayReading,
          prevReading: photoPrev,
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
      <div className="flex items-center justify-between gap-1 border rounded-md px-3 py-2">
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
      className="text-sm p-0! flex justify-center items-center text-primary"
      variant={"ghost"}
    >
      <span className="hidden md:flex">
        {tReadings("PhotocopyStampReadings")}{" "}
      </span>
      <span className="md:hidden">{tReadings("SD&FSReadings")} </span>
      <ChevronsRight className="size-4" />
    </Button>
  );

  const Content = (
    <>
      <div className="w-full flex flex-col gap-2 overflow-auto">
        <StepHeader />
        <div className="flex items-center justify-between w-full flex-col gap-2 md:flex-row ">
          {readings?.success && (
            <div className="flex gap-2 items-center justify-start text-green-700 text-xs">
              <CheckCircle className="size-4 text-green-700" />{" "}
              {tReadings("ReadingsAlreadySaved")}
            </div>
          )}
          {hasEdits && (
            <div className="flex gap-2 items-center justify-start text-yellow-700 text-sm">
              <TriangleAlert className="size-4 text-yellow-700" />{" "}
              {tReadings("EditedSomeValues")}
            </div>
          )}
        </div>
        {/* STEP 1: Photocopy (UI unchanged) */}
        {step === "photocopy" ? (
          <div className="flex flex-col  gap-2 w-full">
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
                <div
                  className={clsx("text-xs text-muted-foreground", textSmCls)}
                >
                  {tReadings("Today")} :
                </div>
                <Controller
                  control={photoForm.control}
                  name="todayReading"
                  render={({ field }) => (
                    <ReadingInput
                      value={(field.value as number) ?? 0}
                      onChange={field.onChange}
                      placeholder="0"
                      inputClassName={clsx(
                        "w-fit! text-sm text-right",
                        textSmCls,
                      )}
                    />
                  )}
                />

                {photoForm.formState.errors.todayReading ? (
                  <p className="text-xs text-destructive">
                    {String(photoForm.formState.errors.todayReading.message)}
                  </p>
                ) : null}
              </div>

              <div
                className={clsx(
                  "text-xs text-muted-foreground flex justify-between items-center pr-3",
                  textSmCls,
                )}
              >
                {tReadings("TotalCopies")} ={" "}
                <b className="text-sm">{photoDiff}</b>
              </div>

              <div className="rounded-md border px-3 py-1 text-sm flex flex-col gap-2 my-4">
                <div className="flex justify-between items-center w-full">
                  <span className="flex gap-2 justify-start items-center">
                    {tReadings("TotalAmount")} = {tReadings("Copies")} × 1.5 ={" "}
                    <b className="text-base tabular-nums">
                      {formatINR(photoAmount)}
                    </b>
                  </span>
                  <span className="text-xs text-muted-foreground italic hidden md:inline-flex">
                    {" "}
                    {tReadings("FSRate")}
                  </span>
                </div>
                <span className="text-xs text-amber-700 italic">
                  {tReadings("NoteValuesUsedDirectly")}
                </span>
              </div>
            </div>

            {/* Stepper controls */}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="gap-1"
              >
                <X className="size-4" /> {tCommon("Cancel")}
              </Button>
              <Button
                onClick={goNextFromPhotocopy}
                disabled={saving || loadingPrev}
                className="gap-0"
              >
                {tCommon("Next")} <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
        {/* STEP 2: Stamp (UI unchanged) */}
        {step === "stamp" ? (
          <div className="space-y-4 w-full ">
            <div className="space-y-3 max-h-[50vh] overflow-auto no-scrollbar">
              {loadingPrev && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 justify-start">
                  {tReadings("LoadingYesterdaysReadings")}{" "}
                  <Loader2Icon className="size-3 animate-spin" />
                </div>
              )}

              <div className="grid md:grid-cols-4 grid-cols-1 gap-2 w-full">
                {/* ₹50 */}
                <div className="rounded-md border p-3 space-y-1">
                  <div className={clsx("text-sm font-medium", textBodyCls)}>
                    ₹ 50
                  </div>
                  <div className="text-xs italic">
                    {tReadings("ClosingStampSerialNumbers")}
                  </div>
                  <div
                    className={clsx(
                      "text-xs text-muted-foreground flex items-center justify-between pr-3",
                      textSmCls,
                    )}
                  >
                    {tReadings("Yesterday")}: <b>{stampPrev[50]}</b>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label
                      className={clsx(
                        "text-xs text-muted-foreground w-full",
                        textSmCls,
                      )}
                    >
                      {tReadings("Today")} :
                    </Label>
                    <Controller
                      control={stampForm.control}
                      name="r50"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                          inputClassName="w-fit! text-right"
                        />
                      )}
                    />
                  </div>
                  {stampForm.formState.errors.r50 ? (
                    <p className="text-xs text-destructive">
                      {String(stampForm.formState.errors.r50.message)}
                    </p>
                  ) : null}

                  <div
                    className={clsx(
                      "text-sm flex items-center justify-between mt-2 pr-3",
                    )}
                  >
                    {tReadings("StampsSold")}: <b>{stampSold[50]}</b>
                  </div>
                  <div
                    className={clsx(
                      "text-sm flex justify-between items-center",
                      textBodyCls,
                    )}
                  >
                    {tCommon("Amount")}:{" "}
                    <b className="tabular-nums">
                      {formatINR(stampAmounts[50])}
                    </b>
                  </div>
                </div>

                {/* ₹100 */}
                <div className="rounded-md border p-3 space-y-1">
                  <div className={clsx("text-sm font-medium", textBodyCls)}>
                    ₹ 100
                  </div>
                  <div className="text-xs italic">
                    {tReadings("ClosingStampSerialNumbers")}
                  </div>
                  <div
                    className={clsx(
                      "text-xs text-muted-foreground flex items-center justify-between pr-3",
                      textSmCls,
                    )}
                  >
                    {tReadings("Yesterday")}: <b>{stampPrev[100]}</b>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label
                      className={clsx(
                        "text-xs text-muted-foreground w-full",
                        textSmCls,
                      )}
                    >
                      {tReadings("Today")} :
                    </Label>
                    <Controller
                      control={stampForm.control}
                      name="r100"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                          inputClassName="w-fit! text-right"
                        />
                      )}
                    />
                  </div>
                  {stampForm.formState.errors.r100 ? (
                    <p className="text-xs text-destructive">
                      {String(stampForm.formState.errors.r100.message)}
                    </p>
                  ) : null}

                  <div
                    className={clsx(
                      "text-sm flex items-center justify-between mt-2 pr-3",
                    )}
                  >
                    {tReadings("StampsSold")}: <b>{stampSold[100]}</b>
                  </div>
                  <div
                    className={clsx(
                      "text-sm flex justify-between items-center",
                      textBodyCls,
                    )}
                  >
                    {tCommon("Amount")}: <b>{formatINR(stampAmounts[100])}</b>
                  </div>
                </div>

                {/* ₹500 */}
                <div className="rounded-md border p-3 space-y-1">
                  <div className={clsx("text-sm font-medium", textBodyCls)}>
                    ₹ 500
                  </div>
                  <div className="text-xs italic">
                    {tReadings("ClosingStampSerialNumbers")}
                  </div>
                  <div
                    className={clsx(
                      "text-xs text-muted-foreground flex items-center justify-between pr-3",
                      textSmCls,
                    )}
                  >
                    {tReadings("Yesterday")}: <b>{stampPrev[500]}</b>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label
                      className={clsx(
                        "text-xs text-muted-foreground w-full",
                        textSmCls,
                      )}
                    >
                      {tReadings("Today")} :
                    </Label>
                    <Controller
                      control={stampForm.control}
                      name="r500"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                          inputClassName="w-fit! text-right"
                        />
                      )}
                    />
                  </div>
                  {stampForm.formState.errors.r500 ? (
                    <p className="text-xs text-destructive">
                      {String(stampForm.formState.errors.r500.message)}
                    </p>
                  ) : null}

                  <div
                    className={clsx(
                      "text-sm flex items-center justify-between mt-2 pr-3",
                    )}
                  >
                    {tReadings("StampsSold")}: <b>{stampSold[500]}</b>
                  </div>
                  <div
                    className={clsx(
                      "text-sm flex justify-between items-center",
                      textBodyCls,
                    )}
                  >
                    {tCommon("Amount")}:{" "}
                    <b className="tabular-nums">
                      {formatINR(stampAmounts[500])}
                    </b>
                  </div>
                </div>

                {/* ₹1000 */}
                <div className="rounded-md border p-3 space-y-1">
                  <div className={clsx("text-sm font-medium", textBodyCls)}>
                    ₹ 1000
                  </div>
                  <div className="text-xs italic">
                    {tReadings("ClosingStampSerialNumbers")}
                  </div>
                  <div
                    className={clsx(
                      "text-xs text-muted-foreground flex items-center justify-between pr-3",
                      textSmCls,
                    )}
                  >
                    {tReadings("Yesterday")}: <b>{stampPrev[1000]}</b>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label
                      className={clsx(
                        "text-xs text-muted-foreground w-full",
                        textSmCls,
                      )}
                    >
                      {tReadings("Today")} :
                    </Label>
                    <Controller
                      control={stampForm.control}
                      name="r1000"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                          inputClassName="w-fit! text-right"
                        />
                      )}
                    />
                  </div>
                  {stampForm.formState.errors.r1000 ? (
                    <p className="text-xs text-destructive">
                      {String(stampForm.formState.errors.r1000.message)}
                    </p>
                  ) : null}

                  <div
                    className={clsx(
                      "text-sm flex items-center justify-between mt-2 pr-3",
                    )}
                  >
                    {tReadings("StampsSold")}: <b>{stampSold[1000]}</b>
                  </div>
                  <div
                    className={clsx(
                      "text-sm flex justify-between items-center",
                      textBodyCls,
                    )}
                  >
                    {tCommon("Amount")}:{" "}
                    <b className="tabular-nums">
                      {formatINR(stampAmounts[1000])}
                    </b>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-3 text-sm flex flex-col gap-2 items-center justify-center">
                <span>
                  {tReadings("TotalStampDuty")} (SD):{" "}
                  <b className="text-base tabular-nums">
                    {formatINR(stampTotal)}
                  </b>
                </span>
                <span className="text-xs text-amber-700 italic">
                  {tReadings("NoteValuesUsedDirectly")}
                </span>
              </div>
            </div>

            {/* Stepper controls */}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={goBack}
                disabled={saving}
                className="gap-0"
              >
                <ChevronLeft className="size-4" /> {tCommon("Back")}
              </Button>
              <Button
                onClick={goNextFromStamp}
                disabled={saving || loadingPrev}
                className="gap-0"
              >
                {tCommon("Next")} <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
        {/* STEP 3: Review + editable (jump back to edit) */}
        {step === "review" ? (
          <div className="space-y-4 w-full">
            <div className="max-h-[50vh] overflow-auto no-scrollbar flex flex-col gap-4">
              {/* Photocopy review */}
              <div className="rounded-md border p-3 text-sm flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      "italic text-muted-foreground",
                      textBodyCls,
                    )}
                  >
                    {tReadings("PhotocopyMachineReading")}
                  </span>
                  <Button
                    variant="ghost"
                    className={clsx(
                      "h-auto p-0 text-primary text-xs gap-1",
                      textXsCls,
                    )}
                    onClick={() => setStep("photocopy")}
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
                  <b className="text-foreground tabular-nums">
                    {photoToday ?? 0}
                  </b>
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

                <span
                  className={clsx("text-xs text-amber-700 italic", textXsCls)}
                >
                  {tReadings("NoteValuesUsedDirectly")}
                </span>
              </div>

              {/* Stamp review */}
              <div className="rounded-md border p-3 text-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      "italic text-muted-foreground",
                      textBodyCls,
                    )}
                  >
                    {tReadings("ClosingStampSerialNumbers")}
                  </span>
                  <Button
                    variant="ghost"
                    className={clsx(
                      "h-auto p-0 text-primary text-xs gap-1",
                      textXsCls,
                    )}
                    onClick={() => setStep("stamp")}
                    disabled={saving}
                  >
                    {tCommon("Edit")} <Pencil className="size-3" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-4 grid-cols-1 gap-1">
                  {DENOMS.map((d) => (
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
                        <b className="text-foreground tabular-nums">
                          {stampPrev[d]}
                        </b>
                      </div>

                      <div
                        className={clsx(
                          "text-xs text-muted-foreground flex items-center justify-between",
                          textSmCls,
                        )}
                      >
                        {tReadings("Today")}:{" "}
                        <b className="text-foreground tabular-nums">
                          {d === 50
                            ? r50
                            : d === 100
                              ? r100
                              : d === 500
                                ? r500
                                : r1000}
                        </b>
                      </div>

                      <div
                        className={clsx(
                          "text-xs text-muted-foreground flex items-center justify-between",
                          textSmCls,
                        )}
                      >
                        {tReadings("StampsSold")}:{" "}
                        <b className="text-foreground tabular-nums">
                          {stampSold[d]}
                        </b>
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

                <span
                  className={clsx("text-xs text-amber-700 italic", textXsCls)}
                >
                  {tReadings("NoteValuesUsedDirectly")}
                </span>
              </div>
            </div>

            {/* Final controls: only here we save */}
            {!readingsFound || hasEdits ? (
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={goBack}
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
                    <span
                      className={clsx("flex items-center gap-2", textSmCls)}
                    >
                      <Loader2Icon className="size-4 animate-spin" />
                      {tCommon("Saving")}
                    </span>
                  ) : (
                    <span className={textSmCls}>
                      {tCommon("ConfirmAndSave")}
                    </span>
                  )}
                  <SaveIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button onClick={() => setOpen(false)} className="gap-1">
                  <span className={textSmCls}>{tCommon("Ok")} 👍🏻</span>
                  {/* <SaveIcon className="size-4" /> */}
                </Button>
              </div>
            )}
          </div>
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
            <DialogTitle>{tReadings("EnterReadings")}</DialogTitle>
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
          <DrawerTitle>{tReadings("EnterReadings")}</DrawerTitle>
        </DrawerHeader>
        {Content}
      </DrawerContent>
    </Drawer>
  );
}
