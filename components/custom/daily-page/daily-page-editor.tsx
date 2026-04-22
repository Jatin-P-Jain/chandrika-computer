"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { DailyFormValues, makeDailySchema } from "@/schema/daily-page.schema";
import { formatINR, sumAmounts } from "@/lib/utils";
import { AmountInput } from "./common-components/amount-input";
import { Loader2, Repeat, SaveIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";
import {
  createDailyAccountItem,
  updateDailyAccountItem,
} from "@/app/daily-accounts/write-actions";
import { DailyAccount } from "@/types/daily-account";
import { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";
import type { ReviewItem } from "./save-review-dialog";
import type { CreditDebitImperative } from "../accounts/credit-debit-section";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const DailyReadingsDialog = dynamic(
  () => import("../daily-readings/daily-readings-dialog"),
  { ssr: false },
);

const DailyNotesDialog = dynamic(
  () => import("../daily-notes/daily-notes-dialog"),
  { ssr: false },
);

const SaveReviewDialog = dynamic(
  () => import("./save-review-dialog").then((m) => m.SaveReviewDialog),
  { ssr: false },
);

const FixedExpensesSection = dynamic(
  () => import("./sections/fixed-expenses").then((m) => m.FixedExpensesSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full animate-pulse rounded-md border bg-muted/30" />
    ),
  },
);

const FieldArraySection = dynamic(
  () =>
    import("./common-components/field-array-section").then(
      (m) => m.FieldArraySection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full animate-pulse rounded-md border bg-muted/30" />
    ),
  },
);

const CreditDebitCardsSection = dynamic(
  () =>
    import("../accounts/credit-debit-section").then(
      (m) => m.CreditDebitCardsSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full animate-pulse rounded-md border bg-muted/30" />
    ),
  },
);

type DailyPageMode = "create" | "view" | "edit";

type DailyPageProps = {
  mode: DailyPageMode;
  initialData?: DailyFormValues;
  dailyItemData?: DailyAccount;
  docId: string;
  readings?: {
    success: boolean;
    photocopy: PhotocopyReadingDoc | null;
    stamp: StampReadingDoc | null;
  };
};

function isNonEmptyArray<T>(v: T[] | undefined | null) {
  return Array.isArray(v) && v.length > 0;
}

function formatLineItemSummary(
  items: { label?: string; amount?: number }[],
  max = 6,
) {
  const parts = items.slice(0, max).map((x, i) => {
    const label = String(x.label ?? "").trim() || `#${i + 1}`;
    const amount = typeof x.amount === "number" ? x.amount : 0;
    return `${label}: ${formatINR(amount)}`;
  });

  const remaining = items.length - parts.length;
  return remaining > 0
    ? `${parts.join(", ")}, +${remaining} more`
    : parts.join(", ");
}

export default function DailyPageEditor({
  mode,
  initialData,
  docId,
  readings,
}: DailyPageProps) {
  const tCommon = useTranslations("Common");
  const tToast = useTranslations("Toast");
  const tDailyAccount = useTranslations("DailyAccount");
  const tSaveReview = useTranslations("SaveReview");
  const tCreditsDebits = useTranslations("CreditsDebits");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textBodyCls = clsx(isHi && "text-lg font-[inherit]");

  const tErrors = useTranslations("Validation");
  const dailySchema = useMemo(() => makeDailySchema(tErrors), [tErrors]);

  const updateMode = mode === "edit";
  const areReadingsDone = readings?.success;

  const form = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    defaultValues: initialData ?? {
      fixed: { sd: 0, sc: 0, fs: 0, flexnCard: 0, otherFixedExpenses: [] },
      earnings: { netIncome: 0, otherIncomes: [] },
      businessExpenses: [],
      dailySpends: [],
      creditItems: [],
      debitItems: [],
      notes: [],
      accountsCache: {},
      totalCashCollected: 0,
    },
    mode: "onChange",
  });

  const fixed = useWatch({ control: form.control, name: "fixed" });
  const earnings = useWatch({ control: form.control, name: "earnings" });
  const businessExpenses = useWatch({
    control: form.control,
    name: "businessExpenses",
  });
  const dailySpends = useWatch({ control: form.control, name: "dailySpends" });
  const totalCashCollected = useWatch({
    control: form.control,
    name: "totalCashCollected",
  });

  const totalFixed =
    (fixed?.sd ?? 0) + fixed?.sd * 0.3 + (fixed?.fs ?? 0) + fixed?.flexnCard;
  const totalBusiness = sumAmounts(businessExpenses);
  const totalSpends = sumAmounts(dailySpends);
  const netForDay =
    totalCashCollected - (totalFixed + totalBusiness + totalSpends);
  const totalEarnings = earnings.netIncome + sumAmounts(earnings.otherIncomes);

  const creditDebitRef = useRef<CreditDebitImperative | null>(null);
  const creditDebitAnchorRef = useRef<HTMLDivElement | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewMode, setReviewMode] = useState<
    "BLOCK_READINGS" | "SOFT_CONFIRM"
  >("SOFT_CONFIRM");
  const [pendingData, setPendingData] = useState<DailyFormValues | null>(null);

  const { user, getUserToken } = useAuth();
  const { replace, refresh } = useSafeRouter();
  const [renderForm, setRenderForm] = useState(updateMode || areReadingsDone);

  useEffect(() => {
    form.setValue("earnings.netIncome", netForDay, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [netForDay, form]);

  const onSubmit = async (data: DailyFormValues) => {
    const token = await getUserToken();
    if (!token) return;

    if (mode === "edit") {
      if (!docId) {
        toast.error("Error!", { description: "Missing docId" });
        return;
      }

      const dirtyFields = form.formState.dirtyFields;

      const res = await updateDailyAccountItem(
        docId,
        data,
        user,
        dirtyFields,
        token,
      );

      if (res.error) {
        toast.error("Error!", {
          description: res.message || "An error occurred",
        });
        return;
      }

      toast.success("Success!", { description: tToast("DailyAccountUpdated") });
      replace(`/daily-accounts/${docId}?mode=view`, { scroll: false });
      return;
    }

    const accountExistsErrorMessage = tToast("DailyAccountExists");
    const saveResponse = await createDailyAccountItem(
      data,
      user,
      token,
      accountExistsErrorMessage,
      docId,
    );

    if (!!saveResponse.error || !saveResponse.docId) {
      toast.error("Error!", { description: saveResponse.error });
      return;
    }
    replace(`/daily-accounts/${saveResponse.docId}?mode=view`, {
      scroll: false,
    });
    toast.success("Success!", { description: tToast("DailyAccountCreated") });
  };

  const isFormReady = form.formState.isSubmitted || form.formState.isDirty;
  const canSubmit = form.formState.isValid && isFormReady;
  const isSubmitting = form.formState.isSubmitting;

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(async (data) => {
      const fs = Number(form.getValues("fixed.fs") ?? 0);
      const sd = Number(form.getValues("fixed.sd") ?? 0);

      const creditItems = form.getValues("creditItems") ?? [];
      const debitItems = form.getValues("debitItems") ?? [];

      const dailySpendsNow = form.getValues("dailySpends") ?? [];
      const businessExpensesNow = form.getValues("businessExpenses") ?? [];
      const extraEarnings = form.getValues("earnings.otherIncomes") ?? [];

      const blocking: ReviewItem[] = [];
      const readingsData = readings;
      if (readingsData?.photocopy == null) {
        blocking.push({
          id: "missing-photocopy",
          title: tSaveReview("PhotocopyReadingMissing"),
          description: tSaveReview("PleaseAddReadingsAndSave"),
        });
      }
      if (readingsData?.stamp == null) {
        blocking.push({
          id: "missing-stamp",
          title: tSaveReview("StampReadingMissing"),
          description: tSaveReview("PleaseAddReadingsAndSave"),
        });
      }

      const items: ReviewItem[] = [];

      items.push({
        id: "readings-summary",
        title: tSaveReview("Readings"),
        description:
          fs === 0 || sd === 0
            ? tSaveReview("ReadingsMissingDesc")
            : tSaveReview("ReadingsPresentDesc"),
      });

      items.push({
        id: "credits-summary",
        title: `${tCreditsDebits("Credits")} (${creditItems.length})`,
        description: isNonEmptyArray(creditItems)
          ? formatLineItemSummary(creditItems)
          : (tSaveReview("NoCreditsAdded") ?? "No credits added."),
        actionLabel: isNonEmptyArray(creditItems) ? tCommon("Add") : undefined,
        onAction: isNonEmptyArray(creditItems)
          ? () => {
              setReviewOpen(false);
              creditDebitAnchorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              creditDebitRef.current?.addCredit();
            }
          : undefined,
      });

      items.push({
        id: "debits-summary",
        title: `${tCreditsDebits("Debits")} (${debitItems.length})`,
        description: isNonEmptyArray(debitItems)
          ? formatLineItemSummary(debitItems)
          : tSaveReview("NoDebitsAdded"),
        actionLabel: isNonEmptyArray(debitItems)
          ? (tCommon("Add") ?? "Add")
          : undefined,
        onAction: isNonEmptyArray(debitItems)
          ? () => {
              setReviewOpen(false);
              creditDebitAnchorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              creditDebitRef.current?.addDebit();
            }
          : undefined,
      });

      items.push({
        id: "extra-earnings",
        title: `${tDailyAccount("OtherEarnings")} (${extraEarnings.length})`,
        description: isNonEmptyArray(extraEarnings)
          ? formatLineItemSummary(extraEarnings)
          : tSaveReview("NoExtraEarnings"),
      });

      if (!isNonEmptyArray(dailySpendsNow)) {
        items.push({
          id: "dailyspends-empty",
          title: tDailyAccount("DailySpends"),
          description: tSaveReview("DailySpendsEmptyConfirm"),
        });
      }

      if (!isNonEmptyArray(businessExpensesNow)) {
        items.push({
          id: "businessexpenses-empty",
          title: tDailyAccount("BusinessExpense") ?? "Business expense",
          description: tSaveReview("BusinessExpenseEmptyConfirm"),
        });
      }

      if (blocking.length > 0) {
        setReviewMode("BLOCK_READINGS");
        setReviewItems([...blocking, ...items]);
        setPendingData(null);
        setReviewOpen(true);
        return;
      }

      setReviewMode("SOFT_CONFIRM");
      setReviewItems(items);
      setPendingData(data);
      setReviewOpen(true);
    })(event);
  };

  return renderForm ? (
    <>
      <div className="flex flex-col justify-start items-start w-full">
        <div className="flex w-full justify-between items-center mb-2">
          <DailyReadingsDialog
            readings={readings}
            todayDateYmd={docId}
            onSaved={(saved) => {
              if (saved.photocopy) {
                form.setValue("fixed.fs", saved.photocopy.amount, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
              if (saved.stamp) {
                form.setValue("fixed.sd", saved.stamp.totalAmount, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }

              refresh();
            }}
          />
          <DailyNotesDialog form={form} />
        </div>
        <Card className="w-full p-2 md:p-4 md:py-6 rounded-md dark:bg-slate-800 gap-2 overflow-auto h-full relative min-h-[60vh] max-w-7xl mx-auto">
          <div
            className={clsx(
              "w-full text-center text-shadow-xs text-lg font-semibold font-script flex flex-col",
              textBodyCls,
            )}
          >
            <span className="text-base text-yellow-700">ॐ</span>
            <span className="text-orange-600"> श्री गणेशाय नमः</span>
          </div>

          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1">
              <Accordion
                defaultValue={[
                  "fixed",
                  "earnings.otherIncomes",
                  "businessExpenses",
                  "dailySpends",
                ]}
                orientation="horizontal"
                type="multiple"
                className="grow min-h-0 lg:grid lg:grid-cols-4 gap-3 md:gap-4 flex flex-col w-full overflow-auto no-scrollbar pb-3 md:pb-0"
              >
                <FixedExpensesSection
                  totalBarClassName="p-2"
                  totalFixed={
                    Number(formatINR(totalFixed)) ? totalFixed : totalFixed
                  }
                  readings={readings}
                  readOnly={false}
                />

                <FieldArraySection
                  value="earnings.otherIncomes"
                  title={tDailyAccount("Income")}
                  addButtonText={tDailyAccount("AddIncome")}
                  totalLabel={tDailyAccount("TotalIncome")}
                  totalValue={formatINR(totalEarnings)}
                  totalBarClassName="bg-green-100! text-green-900! p-2"
                  showNet={true}
                  netForDay={netForDay}
                  readOnly={false}
                />

                <FieldArraySection
                  value="businessExpenses"
                  title={tDailyAccount("BusinessExpense")}
                  addButtonText={tDailyAccount("AddExpense")}
                  totalLabel={tDailyAccount("TotalBusinessExpense")}
                  totalValue={formatINR(totalBusiness)}
                  totalBarClassName="p-2"
                  readOnly={false}
                />

                <FieldArraySection
                  value="dailySpends"
                  title={tDailyAccount("DailySpends")}
                  addButtonText={tDailyAccount("AddSpend")}
                  totalLabel={tDailyAccount("TotalDailySpends")}
                  totalValue={formatINR(totalSpends)}
                  totalBarClassName="p-2"
                  readOnly={false}
                />
              </Accordion>
              <div ref={creditDebitAnchorRef}>
                <CreditDebitCardsSection
                  ref={creditDebitRef}
                  disabled={false}
                />
              </div>

              <div className="flex gap-4 w-full justify-center items-center mt-4 flex-col">
                <FormField
                  control={form.control}
                  name="totalCashCollected"
                  render={({ field }) => (
                    <div className="flex flex-col">
                      <FormItem className="flex w-full items-center justify-center flex-col">
                        <FormLabel
                          className={clsx("text-base text-center", textBodyCls)}
                        >
                          {tDailyAccount("TotalCashCollected")}:
                        </FormLabel>
                        <FormControl>
                          <AmountInput
                            value={Number(field.value) || 0}
                            onChange={(n) => field.onChange(n)}
                            inputClassName="h-full text-xl! font-semibold w-full border-0 shadow-none"
                          />
                        </FormControl>
                      </FormItem>
                      <FormMessage className="text-xs" />
                    </div>
                  )}
                />

                <div className="flex gap-2 items-center justify-center lg:absolute lg:top-4 lg:right-4 w-full lg:w-fit">
                  <Button
                    disabled={!canSubmit || isSubmitting}
                    type="submit"
                    className="flex gap-2 font-semibold text-sm w-full lg:w-fit justify-center items-center"
                  >
                    <span>
                      {updateMode
                        ? isSubmitting
                          ? tCommon("Updating")
                          : tCommon("Update")
                        : isSubmitting
                          ? tCommon("Saving")
                          : tCommon("Save")}
                    </span>
                    {updateMode ? (
                      isSubmitting ? (
                        <Loader2 className="animate-spin size-4" />
                      ) : (
                        <Repeat className="size-4" />
                      )
                    ) : isSubmitting ? (
                      <Loader2 className="animate-spin size-4" />
                    ) : (
                      <SaveIcon className="size-4" />
                    )}
                  </Button>
                  {updateMode && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        replace(`/daily-accounts/${docId}`, {
                          scroll: false,
                        })
                      }
                      className="border-red-700 text-red-700 gap-1"
                    >
                      {tCommon("Cancel")}
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </Card>
      </div>
      <SaveReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title={
          reviewMode === "BLOCK_READINGS"
            ? tSaveReview("ReadingsNotAdded")
            : tSaveReview("ConfirmBeforeSave")
        }
        description={
          reviewMode === "BLOCK_READINGS"
            ? tSaveReview("AddReadingsThenSave")
            : tSaveReview("ReviewBelowSections")
        }
        items={reviewItems}
        cancelText={tCommon("Cancel")}
        confirmText={tCommon("ContinueAndSave")}
        hideConfirm={reviewMode === "BLOCK_READINGS"}
        onConfirm={async () => {
          setReviewOpen(false);
          if (!pendingData) return;
          await onSubmit(pendingData);
          setPendingData(null);
        }}
      />
    </>
  ) : (
    <div className=" gap-4 rounded-sm text-center text-muted-foreground flex flex-col justify-center items-center bg-background h-full lg:w-1/2 mx-auto p-4">
      {tDailyAccount("NoDailyAccountFound")}
      <Button
        variant="outline"
        className="shadow-md"
        onClick={() => setRenderForm(true)}
      >
        {tDailyAccount("CreateDailyAccount")}
      </Button>
    </div>
  );
}
