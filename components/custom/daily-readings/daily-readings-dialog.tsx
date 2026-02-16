// components/custom/daily-readings/daily-readings-dialog.tsx
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
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2Icon,
  Pencil,
  SaveIcon,
  X,
} from "lucide-react";
import { ReadingInput } from "../daily-page/common-components/reading-input";
import { formatINR } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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

  // reset step when dialog opens/closes (optional but keeps UX clean)
  React.useEffect(() => {
    if (open) {
      setStep("photocopy");
    }
  }, [open]);

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
        "text-xs",
        active ? "text-foreground font-medium" : "text-muted-foreground",
      ].join(" ");

    return (
      <div className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
        <span className={itemCls(step === "photocopy")}>1. Photocopy</span>
        <span className="text-muted-foreground">→</span>
        <span className={itemCls(step === "stamp")}>2. Stamp</span>
        <span className="text-muted-foreground">→</span>
        <span className={itemCls(step === "review")}>3. Review</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="text-sm p-0 flex justify-center items-center text-primary"
          variant={"ghost"}
        >
          Photocopy & Stamp Readings <ChevronsRight className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="min-w-[50%] p-0 px-3 py-4 md:px-4 md:py-6">
        <DialogHeader>
          <DialogTitle>Enter Readings</DialogTitle>
        </DialogHeader>

        <div className="w-full space-y-3">
          <StepHeader />

          {/* STEP 1: Photocopy (UI unchanged) */}
          {step === "photocopy" ? (
            <div className="space-y-3 w-full">
              <div className="flex text-xs italic">
                Photocopy Machine Reading
              </div>

              <div className="text-sm text-muted-foreground flex items-center gap-2 justify-start">
                Yesterday:{" "}
                {loadingPrev ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <b>{photoPrev}</b>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Today :</div>
                <Controller
                  control={photoForm.control}
                  name="todayReading"
                  render={({ field }) => (
                    <ReadingInput
                      value={(field.value as number) ?? 0}
                      onChange={field.onChange}
                      placeholder="0"
                      inputClassName="w-fit"
                    />
                  )}
                />

                {photoForm.formState.errors.todayReading ? (
                  <p className="text-xs text-destructive">
                    {String(photoForm.formState.errors.todayReading.message)}
                  </p>
                ) : null}
              </div>

              <div className="text-sm">
                Total Copies = <b>{photoDiff}</b>
              </div>

              <div className="rounded-md border p-3 text-sm flex flex-col gap-2">
                <div className="flex justify-between items-center w-full">
                  <span className="flex gap-2 justify-start items-center">
                    Total Amount (FS) = Copies × 1.5 ={" "}
                    <b className="text-base">{formatINR(photoAmount)}</b>
                  </span>
                  <span className="text-xs text-muted-foreground italic hidden md:inline-flex">
                    {" "}
                    @ ₹1.5 / copy
                  </span>
                </div>
                <span className="text-xs text-amber-700 italic">
                  Note: These values will be used directly in today&apos;s daily
                  account.
                </span>
              </div>

              {/* Stepper controls */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="gap-1"
                >
                  <X className="size-4" /> Cancel
                </Button>
                <Button
                  onClick={goNextFromPhotocopy}
                  disabled={saving || loadingPrev}
                  className="gap-0"
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 2: Stamp (UI unchanged) */}
          {step === "stamp" ? (
            <div className="space-y-4 w-full">
              <div className="space-y-3">
                {loadingPrev && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2 justify-start">
                    Loading Yesterday&apos;s readings{" "}
                    <Loader2Icon className="size-3 animate-spin" />
                  </div>
                )}

                <div className="grid md:grid-cols-4 grid-cols-1 gap-2 w-full max-h-[55vh] overflow-auto no-scrollbar">
                  {/* ₹50 */}
                  <div className="rounded-md border p-3 space-y-1">
                    <div className="text-sm font-medium">₹ 50</div>
                    <div className="text-xs italic">
                      Closing Stamp Serial Numbers
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Yesterday: <b>{stampPrev[50]}</b>
                    </div>

                    <Label className="text-xs text-muted-foreground">
                      Today :
                    </Label>

                    <Controller
                      control={stampForm.control}
                      name="r50"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                    {stampForm.formState.errors.r50 ? (
                      <p className="text-xs text-destructive">
                        {String(stampForm.formState.errors.r50.message)}
                      </p>
                    ) : null}

                    <div className="text-sm">
                      Stamps Sold: <b>{stampSold[50]}</b>
                    </div>
                    <div className="text-sm">
                      Amount: <b>{formatINR(stampAmounts[50])}</b>
                    </div>
                  </div>

                  {/* ₹100 */}
                  <div className="rounded-md border p-3 space-y-1">
                    <div className="text-sm font-medium">₹ 100</div>
                    <div className="text-xs italic">
                      Closing Stamp Serial Numbers
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Yesterday: <b>{stampPrev[100]}</b>
                    </div>

                    <Label className="text-xs text-muted-foreground">
                      Today :
                    </Label>

                    <Controller
                      control={stampForm.control}
                      name="r100"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                    {stampForm.formState.errors.r100 ? (
                      <p className="text-xs text-destructive">
                        {String(stampForm.formState.errors.r100.message)}
                      </p>
                    ) : null}

                    <div className="text-sm">
                      Stamps Sold: <b>{stampSold[100]}</b>
                    </div>
                    <div className="text-sm">
                      Amount: <b>{formatINR(stampAmounts[100])}</b>
                    </div>
                  </div>

                  {/* ₹500 */}
                  <div className="rounded-md border p-3 space-y-1">
                    <div className="text-sm font-medium">₹ 500</div>
                    <div className="text-xs italic">
                      Closing Stamp Serial Numbers
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Yesterday: <b>{stampPrev[500]}</b>
                    </div>

                    <Label className="text-xs text-muted-foreground">
                      Today :
                    </Label>

                    <Controller
                      control={stampForm.control}
                      name="r500"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                    {stampForm.formState.errors.r500 ? (
                      <p className="text-xs text-destructive">
                        {String(stampForm.formState.errors.r500.message)}
                      </p>
                    ) : null}

                    <div className="text-sm">
                      Stamps Sold: <b>{stampSold[500]}</b>
                    </div>
                    <div className="text-sm">
                      Amount: <b>{formatINR(stampAmounts[500])}</b>
                    </div>
                  </div>

                  {/* ₹1000 */}
                  <div className="rounded-md border p-3 space-y-1">
                    <div className="text-sm font-medium">₹ 1000</div>
                    <div className="text-xs italic">
                      Closing Stamp Serial Numbers
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Yesterday: <b>{stampPrev[1000]}</b>
                    </div>

                    <Label className="text-xs text-muted-foreground">
                      Today :
                    </Label>

                    <Controller
                      control={stampForm.control}
                      name="r1000"
                      render={({ field }) => (
                        <ReadingInput
                          value={(field.value as number) ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                    {stampForm.formState.errors.r1000 ? (
                      <p className="text-xs text-destructive">
                        {String(stampForm.formState.errors.r1000.message)}
                      </p>
                    ) : null}

                    <div className="text-sm">
                      Stamps Sold: <b>{stampSold[1000]}</b>
                    </div>
                    <div className="text-sm">
                      Amount: <b>{formatINR(stampAmounts[1000])}</b>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-3 text-sm flex flex-col gap-2 items-center justify-center">
                  <span>
                    Total Stamp Duty (SD):{" "}
                    <b className="text-base">{formatINR(stampTotal)}</b>
                  </span>
                  <span className="text-xs text-amber-700 italic">
                    Note: These values will be used directly in today&apos;s
                    daily account.
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
                  <ChevronLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={goNextFromStamp}
                  disabled={saving || loadingPrev}
                  className="gap-0"
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 3: Review + editable (jump back to edit) */}
          {step === "review" ? (
            <div className="space-y-4 w-full max-h-[70vh] overflow-auto no-scrollbar">
              {/* Review block (does not change your messaging; just shows unified view) */}
              <div className="rounded-md border p-3 text-sm flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="italic">Photocopy Machine Reading</span>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 text-primary text-xs"
                    onClick={() => setStep("photocopy")}
                    disabled={saving}
                  >
                    Edit <Pencil className="size-3" />
                  </Button>
                </div>

                <div className="text-xs">
                  Yesterday: <b>{photoPrev}</b>
                </div>
                <div className="text-xs">
                  Today: <b>{photoToday ?? 0}</b>
                </div>
                <div className="text-xs">
                  Total Copies: <b>{photoDiff}</b>
                </div>
                <div className="">
                  Total Amount (FS): <b>{formatINR(photoAmount)}</b>
                </div>

                <span className="text-xs text-amber-700 italic">
                  Note: These values will be used directly in today&apos;s daily
                  account.
                </span>
              </div>

              <div className="rounded-md border p-3 text-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className=" italic">Closing Stamp Serial Numbers</span>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 text-primary text-xs"
                    onClick={() => setStep("stamp")}
                    disabled={saving}
                  >
                    Edit <Pencil className="size-3" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-4 grid-cols-1 gap-1">
                  {DENOMS.map((d) => (
                    <div key={d} className="rounded-md border p-2">
                      <div className="font-medium mb-1">₹ {d}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        Yesterday: <b>{stampPrev[d]}</b>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        Today:{" "}
                        <b>
                          {d === 50
                            ? r50
                            : d === 100
                              ? r100
                              : d === 500
                                ? r500
                                : r1000}
                        </b>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        Sold Quantity: <b>{stampSold[d]}</b>
                      </div>
                      <div className=" flex items-center justify-between mt-1">
                        Amount: <b>{formatINR(stampAmounts[d])}</b>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-1">
                  Total Stamp Duty (SD): <b>{formatINR(stampTotal)}</b>
                </div>

                <span className="text-xs text-amber-700 italic">
                  Note: These values will be used directly in today&apos;s daily
                  account.
                </span>
              </div>

              {/* Final controls: only here we save */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={goBack}
                  disabled={saving}
                  className="gap-0"
                >
                  <ChevronLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={onConfirmSave}
                  disabled={saving || loadingPrev}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2Icon className="size-4 animate-spin" />
                      Saving
                    </span>
                  ) : (
                    "Confirm & Save"
                  )}
                  <SaveIcon className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
