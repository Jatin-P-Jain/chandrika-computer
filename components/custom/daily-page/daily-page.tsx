// components/custom/daily-page/daily-page.tsx
"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { FixedExpensesSection } from "./sections/fixed-expenses";
import { FieldArraySection } from "./common-components/field-array-section";
import { AmountInput } from "./common-components/amount-input";
import { Loader2, PencilIcon, Repeat, SaveIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";
import {
  createDailyAccountItem,
  updateDailyAccountItem,
} from "@/app/daily-accounts/actions";
import { DailyAccount } from "@/types/daily-account";
import CreatedOrUpdated from "../created-or-updated";
import { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";
import DailyReadingsDialog from "../daily-readings/daily-readings-dialog";
import DailyNotesDialog from "../daily-notes/daily-notes-dialog";
import { CreditDebitCardsSection } from "../accounts/credit-debit-section";

type DailyPageMode = "create" | "view" | "edit";

type DailyPageProps = {
  mode: DailyPageMode;
  initialData?: DailyFormValues;
  dailyItemData?: DailyAccount;
  docId: string;
  readings?: {
    photocopy: PhotocopyReadingDoc | null;
    stamp: StampReadingDoc | null;
  };
};

export default function DailyPage({
  mode,
  initialData,
  dailyItemData,
  docId,
  readings,
}: DailyPageProps) {
  const tCommon = useTranslations("Common");
  const tToast = useTranslations("Toast");
  const tDailyAccount = useTranslations("DailyAccount");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textBodyCls = clsx(isHi && "text-lg font-[inherit]");
  const textHeadCls = clsx(isHi && "text-2xl! font-[inherit]");

  const tErrors = useTranslations("Validation");
  const dailySchema = useMemo(() => makeDailySchema(tErrors), [tErrors]);

  const isReadOnly = mode === "view";
  const updateMode = mode === "edit";
  const areReadingsDone = !!readings?.photocopy || !!readings?.stamp;

  const form = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    defaultValues: initialData ?? {
      fixed: { sd: 0, sc: 0, fs: 0 },
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

  // existing watches
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

  const totalFixed = (fixed?.sd ?? 0) + fixed?.sd * 0.3 + (fixed?.fs ?? 0);
  const totalBusiness = sumAmounts(businessExpenses);
  const totalSpends = sumAmounts(dailySpends);
  const netForDay =
    totalCashCollected - (totalFixed + totalBusiness + totalSpends);
  const totalEarnings = earnings.netIncome + sumAmounts(earnings.otherIncomes);

  const { user, getUserToken } = useAuth();
  const router = useRouter();
  const [renderForm, setRenderForm] = useState(
    isReadOnly || updateMode || areReadingsDone,
  );

  // Keep this even in edit mode so netIncome is auto‑derived
  useEffect(() => {
    if (!isReadOnly) {
      form.setValue("earnings.netIncome", netForDay, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [netForDay, form, isReadOnly]);

  const onSubmit = async (data: DailyFormValues) => {
    if (isReadOnly) return;

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
        console.log("Error", res);
        toast.error("Error!", {
          description: res.message || "An error occurred",
        });
        return;
      }

      toast.success("Success!", { description: tToast("DailyAccountUpdated") });
      router.replace(`/daily-accounts/${docId}?mode=view`, { scroll: false });
      return;
    }

    // create flow
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
    router.replace(`/daily-accounts/${saveResponse.docId}?mode=view`, {
      scroll: false,
    });
    toast.success("Success!", { description: tToast("DailyAccountCreated") });
  };

  const isFormReady = form.formState.isSubmitted || form.formState.isDirty;
  const canSubmit = form.formState.isValid && isFormReady && !isReadOnly;
  const isSubmitting = form.formState.isSubmitting;

  const handleEditClick = () => {
    if (!docId) return;
    // Same route, but with ?id=<docId>&mode=edit
    router.push(`/daily-accounts/${docId}?mode=edit`);
  };

  return renderForm ? (
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

            // Keep server-prop readings in sync for view/reload correctness
            router.refresh();
          }}
        />
        <DailyNotesDialog form={form} readOnly={mode === "view"} />
      </div>
      <Card
        className={clsx(
          "w-full p-2 md:p-4 md:py-6 rounded-md dark:bg-slate-800 gap-2 overflow-auto h-full relative min-h-[60vh] max-w-7xl mx-auto",
        )}
      >
        <div
          className={clsx(
            "w-full text-center text-shadow-xs text-lg font-semibold font-script flex flex-col",
            textBodyCls,
          )}
        >
          <span className="text-base text-yellow-700">ॐ</span>
          <span className="text-orange-600"> श्री गणेशाय नमः</span>
        </div>

        {/* You can still wrap in Form, even for read-only, to reuse watch() logic */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1"
          >
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
              />

              <FieldArraySection
                value="businessExpenses"
                title={tDailyAccount("BusinessExpense")}
                addButtonText={tDailyAccount("AddExpense")}
                totalLabel={tDailyAccount("TotalBusinessExpense")}
                totalValue={formatINR(totalBusiness)}
                totalBarClassName="p-2"
                readOnly={isReadOnly}
              />

              <FieldArraySection
                value="dailySpends"
                title={tDailyAccount("DailySpends")}
                addButtonText={tDailyAccount("AddSpend")}
                totalLabel={tDailyAccount("TotalDailySpends")}
                totalValue={formatINR(totalSpends)}
                totalBarClassName="p-2"
                readOnly={isReadOnly}
              />
            </Accordion>
            <CreditDebitCardsSection disabled={isReadOnly} />

            {/* Final input / read-only display */}
            <div className="flex gap-4 w-full justify-center items-center mt-4 flex-col">
              {isReadOnly ? (
                <div className="flex flex-col md:flex-row justify-center w-full">
                  <div className="flex flex-col gap-4 items-center justify-center w-full lg:pl-42">
                    <span
                      className={clsx(
                        "text-base text-center font-semibold text-muted-foreground",
                        textBodyCls,
                      )}
                    >
                      {tDailyAccount("TotalCashCollected")}:
                    </span>
                    <span
                      className={clsx(
                        "text-xl font-semibold text-center text-primary",
                        textHeadCls,
                      )}
                    >
                      {formatINR(totalCashCollected)}
                    </span>
                  </div>
                  <div className="flex justify-end items-center mt-3 md:mt-0">
                    <div className="flex ">
                      <CreatedOrUpdated
                        createdBy={dailyItemData?.createdBy}
                        updatedBy={dailyItemData?.updatedBy}
                        created={dailyItemData?.created}
                        updated={dailyItemData?.updated}
                      />
                    </div>
                  </div>
                </div>
              ) : (
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
              )}

              {isReadOnly ? (
                <>
                  <Button
                    variant={"outline"}
                    type="button"
                    onClick={handleEditClick}
                    className="text-primary border-primary flex gap-2 lg:absolute lg:top-4 lg:right-4 font-semibold text-sm w-full lg:w-fit justify-center items-center"
                  >
                    <span>{tCommon("Edit")}</span>
                    {<PencilIcon className="size-4" />}
                  </Button>
                </>
              ) : (
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
                        router.replace(`/daily-accounts/${docId}`, {
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
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
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
