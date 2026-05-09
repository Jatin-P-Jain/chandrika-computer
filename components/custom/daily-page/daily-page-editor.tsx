"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";

import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { DailyAccount } from "@/types/daily-account";
import type { NoteItem } from "@/types/daily-notes";
import { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";
import type { CreditDebitImperative } from "../accounts/credit-debit-section";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import AuditTrail from "../audit-trail";
import { buildSaveReviewItems } from "./utils/build-save-review-items";
import { handleDailyFormSubmitErrors } from "./utils/handle-submit-errors";
import { useSaveReviewFlow } from "./hooks/use-save-review-flow";
import { useDailyPageSubmitFlow } from "./hooks/use-daily-page-submit-flow";
import { useReviewNavigationActions } from "./hooks/use-review-navigation-actions";

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

export default function DailyPageEditor({
  mode,
  initialData,
  dailyItemData,
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

  const initialNotes = useMemo<NoteItem[]>(() => {
    return (dailyItemData?.notes ?? []).map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }));
  }, [dailyItemData?.notes]);

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
  const creditItems = useWatch({ control: form.control, name: "creditItems" });
  const debitItems = useWatch({ control: form.control, name: "debitItems" });
  const totalCashCollected = useWatch({
    control: form.control,
    name: "totalCashCollected",
  });

  const totalFixed =
    (fixed?.sd ?? 0) + fixed?.sd * 0.3 + (fixed?.fs ?? 0) + fixed?.flexnCard;
  const totalBusiness = sumAmounts(businessExpenses);
  const totalSpends = sumAmounts(dailySpends);
  const totalCredits = sumAmounts(creditItems);
  const totalDebits = sumAmounts(debitItems);
  const totalOtherIncomes = sumAmounts(earnings.otherIncomes);
  const netForDay =
    totalCashCollected +
    totalDebits +
    totalBusiness +
    totalSpends -
    totalCredits -
    totalFixed -
    totalOtherIncomes;
  const totalEarnings = earnings.netIncome + totalOtherIncomes;

  const creditDebitRef = useRef<CreditDebitImperative | null>(null);
  const creditDebitAnchorRef = useRef<HTMLDivElement | null>(null);
  const suppressDraftPersistRef = useRef(false);

  const [isCancelling, setIsCancelling] = useState(false);
  const [localReadings, setLocalReadings] = useState(readings);

  const { user, getUserToken } = useAuth();
  const { replace, refresh } = useSafeRouter();
  const hasExistingDoc = Boolean(dailyItemData?.id);
  const isPersistedAccount =
    dailyItemData?.status === "saved" || dailyItemData?.status === "edited";
  const isExistingDraft = hasExistingDoc && !isPersistedAccount;
  const [renderForm, setRenderForm] = useState(
    updateMode || areReadingsDone || hasExistingDoc,
  );

  useEffect(() => {
    form.setValue("earnings.netIncome", netForDay, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [netForDay, form]);

  const isReadingsSyncing = false;

  useEffect(() => {
    setLocalReadings(readings);
  }, [readings]);

  const { persistDraft, submitDaily } = useDailyPageSubmitFlow({
    mode,
    docId,
    user,
    getUserToken,
    getValues: () => form.getValues(),
    isDirty: form.formState.isDirty,
    dirtyFields: form.formState.dirtyFields,
    suppressDraftPersistRef,
    tToast,
    navigateToDoc: (_nextDocId) =>
      replace(`/daily-accounts`, { scroll: false }),
  });

  const isFormReady =
    isExistingDraft || form.formState.isSubmitted || form.formState.isDirty;
  const hasPositiveNetIncome = netForDay > 0;
  const canSubmit = isFormReady && (!updateMode || hasPositiveNetIncome);
  const isSubmitting = form.formState.isSubmitting;
  const primaryActionLabel = isPersistedAccount
    ? tCommon("Update")
    : isSubmitting
      ? tCommon("Completing")
      : tDailyAccount("CompleteDailyAccount");

  const {
    reviewOpen,
    reviewItems,
    reviewMode,
    isSaving,
    openBlockingReview,
    openSoftReview,
    handleReviewOpenChange,
    handleReviewConfirm,
  } = useSaveReviewFlow({
    onSubmit: submitDaily,
    suppressDraftPersistRef,
  });

  const { scrollToSection, addCredit, addDebit } = useReviewNavigationActions({
    creditDebitAnchorRef,
    creditDebitRef,
    closeReview: () => handleReviewOpenChange(false),
  });

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(
      async (data) => {
        const fs = Number(form.getValues("fixed.fs") ?? 0);
        const sd = Number(form.getValues("fixed.sd") ?? 0);

        const creditItems = form.getValues("creditItems") ?? [];
        const debitItems = form.getValues("debitItems") ?? [];

        const dailySpendsNow = form.getValues("dailySpends") ?? [];
        const businessExpensesNow = form.getValues("businessExpenses") ?? [];
        const extraEarnings = form.getValues("earnings.otherIncomes") ?? [];

        const { blocking, items } = buildSaveReviewItems({
          fs,
          sd,
          notes: initialNotes,
          readingsData: localReadings,
          creditItems,
          debitItems,
          dailySpendsNow,
          businessExpensesNow,
          extraEarnings,
          tSaveReview,
          tDailyAccount,
          tCreditsDebits,
          tCommon,
          onGoOtherIncomes: () => scrollToSection("section-other-incomes"),
          onGoBusinessExpenses: () =>
            scrollToSection("section-business-expenses"),
          onAddCredit: addCredit,
          onAddDebit: addDebit,
          onGoDailySpends: () => scrollToSection("section-daily-spends"),
        });

        if (blocking.length > 0) {
          openBlockingReview([...blocking, ...items]);
          return;
        }

        openSoftReview(data, items);
      },
      (errors) => {
        suppressDraftPersistRef.current = false;
        handleDailyFormSubmitErrors({
          errors,
          totalCashCollected: Number(form.getValues("totalCashCollected") ?? 0),
          tDailyAccount,
          tCreditsDebits,
          focusCashInput: () => {
            requestAnimationFrame(() => {
              const input = document.getElementById(
                "total-cash-collected-input",
              );
              if (input instanceof HTMLInputElement) {
                input.focus();
              }
            });
          },
        });
      },
    )(event);
  };

  return renderForm ? (
    <>
      <div className="flex flex-col justify-start items-start w-full">
        <div className="flex w-full justify-between items-center mb-2">
          <DailyReadingsDialog
            readings={localReadings}
            syncing={isReadingsSyncing}
            todayDateYmd={docId}
            onSaved={(saved) => {
              setLocalReadings((prev) => {
                const nextPhotocopy =
                  saved.photocopy ?? prev?.photocopy ?? null;
                const nextStamp = saved.stamp ?? prev?.stamp ?? null;

                return {
                  success: Boolean(nextPhotocopy || nextStamp),
                  photocopy: nextPhotocopy,
                  stamp: nextStamp,
                };
              });

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

              // Refresh only after stamp save (final/combined save); otherwise
              // photocopy-only save on "Next" remounts UI and closes the dialog.
              if (saved.stamp) {
                refresh();
              }
            }}
          />
          <DailyNotesDialog initialNotes={initialNotes} docId={docId} />
        </div>
        {/* Status badge — always visible so user knows account state */}

        <div className="bg-card p-1 w-full md:p-4 md:py-6 rounded-md dark:bg-slate-800 gap-2 overflow-auto h-full relative min-h-[60vh] max-w-7xl mx-auto no-scrollbar">
          <div
            className={clsx(
              "w-full text-center text-shadow-xs text-lg font-semibold font-script flex flex-col no-scrollbar",
              textBodyCls,
            )}
          >
            <span className="text-base text-yellow-700">ॐ</span>
            <span className="text-orange-600"> श्री गणेशाय नमः</span>
          </div>
          {dailyItemData?.status && (
            <div className="absolute top-2 right-2">
              {dailyItemData.status === "draft" && (
                <Badge
                  variant="outline"
                  className="text-[11px] border-amber-400 text-amber-700 bg-amber-50"
                >
                  {tDailyAccount("Draft")}
                </Badge>
              )}
            </div>
          )}

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
                className="grow min-h-0 lg:grid lg:grid-cols-4 gap-1 md:gap-0 flex flex-col w-full overflow-auto no-scrollbar pb-3 md:pb-0"
              >
                <FixedExpensesSection
                  totalBarClassName="p-2"
                  totalFixed={
                    Number(formatINR(totalFixed)) ? totalFixed : totalFixed
                  }
                  readings={localReadings}
                  isReadingsSyncing={isReadingsSyncing}
                  readOnly={false}
                  onPersist={persistDraft}
                />

                <span id="section-other-incomes" />
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
                  onPersist={persistDraft}
                />

                <span id="section-business-expenses" />
                <FieldArraySection
                  value="businessExpenses"
                  title={tDailyAccount("BusinessExpense")}
                  addButtonText={tDailyAccount("AddExpense")}
                  totalLabel={tDailyAccount("TotalBusinessExpense")}
                  totalValue={formatINR(totalBusiness)}
                  totalBarClassName="p-2"
                  readOnly={false}
                  onPersist={persistDraft}
                />

                <span id="section-daily-spends" />
                <FieldArraySection
                  value="dailySpends"
                  title={tDailyAccount("DailySpends")}
                  addButtonText={tDailyAccount("AddSpend")}
                  totalLabel={tDailyAccount("TotalDailySpends")}
                  totalValue={formatINR(totalSpends)}
                  totalBarClassName="p-2"
                  readOnly={false}
                  onPersist={persistDraft}
                />
              </Accordion>
              <div
                ref={creditDebitAnchorRef}
                className="border rounded-md md:mt-4"
              >
                <CreditDebitCardsSection
                  ref={creditDebitRef}
                  disabled={false}
                  onPersist={persistDraft}
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
                            inputId="total-cash-collected-input"
                            value={Number(field.value) || 0}
                            onChange={(n) => field.onChange(n)}
                            onBlur={persistDraft}
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
                    onPointerDownCapture={() => {
                      suppressDraftPersistRef.current = true;
                    }}
                    className="flex gap-2 font-semibold text-sm flex-1 justify-center items-center"
                  >
                    <span>{primaryActionLabel}</span>
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
                      disabled={isSubmitting || isCancelling}
                      onClick={() => {
                        if (isCancelling) return;
                        setIsCancelling(true);
                        replace(`/daily-accounts/${docId}`, {
                          scroll: false,
                        });
                      }}
                      className="border-red-700 text-red-700 gap-1"
                    >
                      {tCommon("Cancel")}
                      {isCancelling ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <X className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
          {hasExistingDoc ? (
            <div className="flex justify-end items-center w-full bg-muted p-1.5 rounded-md mt-3">
              <AuditTrail auditTrail={dailyItemData?.auditTrail} />
            </div>
          ) : null}
        </div>
      </div>
      <SaveReviewDialog
        open={reviewOpen}
        onOpenChange={handleReviewOpenChange}
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
        confirmText={
          isPersistedAccount
            ? tCommon("Update")
            : tCommon("ContinueAndComplete")
        }
        hideConfirm={reviewMode === "BLOCK_READINGS"}
        onConfirm={handleReviewConfirm}
        isSaving={isSaving}
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
