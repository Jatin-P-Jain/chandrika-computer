"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DailyFormValues } from "@/schema/daily-page.schema";
import { DailyAccount } from "@/types/daily-account";
import { formatINR, sumAmounts } from "@/lib/utils";
import { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";
import CreatedOrUpdated from "../created-or-updated";
import { ChevronsRight, ListTodo, PencilIcon } from "lucide-react";
import type { NoteItem } from "@/types/daily-notes";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const DailyReadingsDialog = dynamic(
  () => import("../daily-readings/daily-readings-dialog"),
  { ssr: false },
);

const DailyNotesReadOnlyDialog = dynamic(
  () => import("@/components/custom/daily-notes/daily-notes-read-only-dialog"),
  { ssr: false },
);

type LineItem = { label: string; amount: number; tags?: string[] };

function ReadOnlyListSection({
  title,
  items,
  totalLabel,
  totalValue,
  accentClassName,
  textHeadCls,
  textBodyCls,
}: {
  title: string;
  items: LineItem[];
  totalLabel: string;
  totalValue: number;
  accentClassName?: string;
  textHeadCls: string;
  textBodyCls: string;
}) {
  return (
    <Card className="p-3 gap-2 border shadow-sm">
      <div
        className={clsx(
          "text-primary font-semibold border-b pb-2",
          textHeadCls,
        )}
      >
        {title}
      </div>

      <div className="flex flex-col gap-2 max-h-72 overflow-auto no-scrollbar">
        {items.length === 0 ? (
          <div
            className={clsx(
              "text-sm text-muted-foreground italic",
              textBodyCls,
            )}
          >
            -
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex justify-between gap-3"
            >
              <div className="flex flex-col items-end text-right">
                <span className={clsx("text-sm", textBodyCls)}>
                  {item.label || "-"}
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {(item.tags ?? []).map((tag, tagIndex) => (
                    <Badge
                      key={`${tag}-${tagIndex}`}
                      variant="secondary"
                      className="rounded-md text-[10px] text-muted-foreground font-semibold"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <span className={clsx("font-semibold tabular-nums", textHeadCls)}>
                {formatINR(Number(item.amount) || 0)}
              </span>
            </div>
          ))
        )}
      </div>

      <div
        className={clsx(
          "flex justify-between items-center border-t py-1",
          accentClassName,
        )}
      >
        <span className={clsx("text-sm", textBodyCls)}>{totalLabel}</span>
        <span className={clsx("font-semibold tabular-nums", textHeadCls)}>
          {formatINR(totalValue)}
        </span>
      </div>
    </Card>
  );
}

function ReadOnlyAccountSection({
  title,
  items,
  textHeadCls,
  textBodyCls,
}: {
  title: string;
  items: { label: string; accountId?: string; amount: number }[];
  textHeadCls: string;
  textBodyCls: string;
}) {
  return (
    <Card className="p-3 gap-2 border shadow-none h-fit">
      <div
        className={clsx(
          "text-primary font-semibold border-b pb-2",
          textHeadCls,
        )}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2 max-h-72 overflow-auto no-scrollbar">
        {items.length === 0 ? (
          <div
            className={clsx(
              "text-sm text-muted-foreground italic",
              textBodyCls,
            )}
          >
            -
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.accountId ?? "acc"}-${index}`}
              className="flex justify-between gap-3"
            >
              <div className="flex flex-col items-end text-right">
                <span className={clsx("text-sm", textBodyCls)}>
                  {item.label || "-"}
                </span>
              </div>
              <span className={clsx("font-semibold tabular-nums", textHeadCls)}>
                {formatINR(Number(item.amount) || 0)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

type DailyPageProps = {
  initialData?: DailyFormValues;
  dailyItemData?: DailyAccount;
  docId: string;
  readings?: {
    success: boolean;
    photocopy: PhotocopyReadingDoc | null;
    stamp: StampReadingDoc | null;
  };
};

export default function DailyPageReadOnly({
  initialData,
  dailyItemData,
  docId,
  readings,
}: DailyPageProps) {
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const tReadings = useTranslations("Readings");
  const tCreditsDebits = useTranslations("CreditsDebits");
  const tNotes = useTranslations("Notes");
  const { push, refresh } = useSafeRouter();
  const { textBodyCls, textDisplayCls } = useLocaleTypography();
  const baseData: DailyFormValues = initialData ?? {
    fixed: { sd: 0, sc: 0, fs: 0, flexnCard: 0, otherFixedExpenses: [] },
    earnings: { netIncome: 0, otherIncomes: [] },
    businessExpenses: [],
    dailySpends: [],
    creditItems: [],
    debitItems: [],
    notes: [],
    accountsCache: {},
    totalCashCollected: 0,
  };

  const [localReadings, setLocalReadings] = useState(readings);

  const fixedData = useMemo(() => {
    const sd = localReadings?.stamp?.totalAmount ?? baseData.fixed.sd ?? 0;
    const fs = localReadings?.photocopy?.amount ?? baseData.fixed.fs ?? 0;
    const sc = sd * 0.3;
    return {
      ...baseData.fixed,
      sd,
      fs,
      sc,
    };
  }, [baseData.fixed, localReadings]);

  const totalFixed =
    (fixedData.sd ?? 0) +
    (fixedData.sc ?? 0) +
    (fixedData.fs ?? 0) +
    (fixedData.flexnCard ?? 0);
  const totalBusiness = sumAmounts(baseData.businessExpenses);
  const totalSpends = sumAmounts(baseData.dailySpends);
  const totalEarnings =
    baseData.earnings.netIncome + sumAmounts(baseData.earnings.otherIncomes);
  const [readingsDialogMounted, setReadingsDialogMounted] = useState(false);
  const [localNotes, setLocalNotes] = useState<NoteItem[]>(
    (baseData.notes as NoteItem[]) ?? [],
  );

  return (
    <div className="flex flex-col justify-start items-start w-full">
      <div className="flex w-full justify-between items-center mb-2">
        {readingsDialogMounted ? (
          <DailyReadingsDialog
            startOpen={true}
            readings={localReadings}
            todayDateYmd={docId}
            readOnly={true}
            onSaved={(saved: {
              photocopy?: PhotocopyReadingDoc;
              stamp?: StampReadingDoc;
            }) => {
              setLocalReadings((prev) => ({
                success: true,
                photocopy: saved.photocopy ?? prev?.photocopy ?? null,
                stamp: saved.stamp ?? prev?.stamp ?? null,
              }));
              refresh();
            }}
          />
        ) : (
          <Button
            className="shadow-md font-medium! text-primary"
            variant={"outline"}
            onClick={() => setReadingsDialogMounted(true)}
          >
            <span className="hidden md:flex">
              {tReadings("PhotocopyStampReadings")}
            </span>
            <span className="md:hidden">{tReadings("SD&FSReadings")}</span>
            <ChevronsRight className="size-4" />
          </Button>
        )}
        <DailyNotesReadOnlyDialog
          notes={localNotes}
          docId={docId}
          onNotesUpdated={setLocalNotes}
        />
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

        <div className="flex flex-col flex-1">
          <div className="grow min-h-0 lg:grid lg:grid-cols-4 gap-3 md:gap-4 flex flex-col w-full overflow-auto no-scrollbar pb-3 md:pb-0">
            <ReadOnlyListSection
              title={tDailyAccount("FixedExpenses")}
              items={[
                { label: tDailyAccount("StampDuty"), amount: fixedData.sd },
                { label: tDailyAccount("SurCharge"), amount: fixedData.sc },
                { label: tDailyAccount("Photocopy"), amount: fixedData.fs },
                {
                  label: tDailyAccount("FlexAndCard"),
                  amount: fixedData.flexnCard,
                },
                ...((fixedData.otherFixedExpenses ?? []) as LineItem[]),
              ]}
              totalLabel={tDailyAccount("TotalFixed")}
              totalValue={totalFixed}
              textHeadCls={textDisplayCls}
              textBodyCls={textBodyCls}
            />

            <ReadOnlyListSection
              title={tDailyAccount("Income")}
              items={(baseData.earnings.otherIncomes ?? []) as LineItem[]}
              totalLabel={tDailyAccount("TotalIncome")}
              totalValue={totalEarnings}
              accentClassName="bg-green-100 text-green-900 rounded-md px-1"
              textHeadCls={textDisplayCls}
              textBodyCls={textBodyCls}
            />

            <ReadOnlyListSection
              title={tDailyAccount("BusinessExpense")}
              items={(baseData.businessExpenses ?? []) as LineItem[]}
              totalLabel={tDailyAccount("TotalBusinessExpense")}
              totalValue={totalBusiness}
              textHeadCls={textDisplayCls}
              textBodyCls={textBodyCls}
            />

            <ReadOnlyListSection
              title={tDailyAccount("DailySpends")}
              items={(baseData.dailySpends ?? []) as LineItem[]}
              totalLabel={tDailyAccount("TotalDailySpends")}
              totalValue={totalSpends}
              textHeadCls={textDisplayCls}
              textBodyCls={textBodyCls}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-36 gap-4 mt-2">
            <ReadOnlyAccountSection
              title={tCreditsDebits("Credits")}
              items={baseData.creditItems ?? []}
              textHeadCls={textDisplayCls}
              textBodyCls={textBodyCls}
            />
            <ReadOnlyAccountSection
              title={tCreditsDebits("Debits")}
              items={baseData.debitItems ?? []}
              textHeadCls={textDisplayCls}
              textBodyCls={textBodyCls}
            />
          </div>

          <div className="flex gap-4 w-full justify-center items-center mt-4 flex-col">
            <div className="flex flex-col md:flex-row justify-center w-full gap-3">
              <div className="flex flex-col items-center justify-center w-full lg:pl-42">
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
                    textDisplayCls,
                  )}
                >
                  {formatINR(baseData.totalCashCollected)}
                </span>
              </div>
              <div className="flex justify-end items-center w-full bg-muted p-1.5 rounded-md">
                <CreatedOrUpdated
                  createdBy={dailyItemData?.createdBy}
                  updatedBy={dailyItemData?.updatedBy}
                  created={dailyItemData?.created}
                  updated={dailyItemData?.updated}
                />
              </div>
            </div>

            <Button
              variant={"outline"}
              type="button"
              onClick={() => push(`/daily-accounts/${docId}?mode=edit`)}
              className="p-1! px-2! h-fit! text-primary border-primary flex gap-1 absolute top-4 right-4 font-semibold text-xs w-fit justify-center items-center"
            >
              <PencilIcon className="size-3" />
              <span>{tCommon("Edit")}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
