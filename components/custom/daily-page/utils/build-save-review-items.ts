import { formatINR } from "@/lib/utils";

import type { ReviewItem } from "../save-review-dialog";
import type { PhotocopyReadingDoc, StampReadingDoc } from "@/types/readings";
import type { NoteItem } from "@/types/daily-notes";

type LineItem = { label?: string; amount?: number; accountName?: string };

type Translator = (key: string) => string;

function isNonEmptyArray<T>(v: T[] | undefined | null) {
  return Array.isArray(v) && v.length > 0;
}

function formatLineItemSummary(items: LineItem[], max = 6) {
  const parts = items.slice(0, max).map((x, i) => {
    const label =
      String(x.accountName ?? "").trim() ||
      String(x.label ?? "").trim() ||
      `#${i + 1}`;
    const amount = typeof x.amount === "number" ? x.amount : 0;
    return `${label}: ${formatINR(amount)}`;
  });

  const remaining = items.length - parts.length;
  return remaining > 0
    ? `${parts.join(", ")}, +${remaining} more`
    : parts.join(", ");
}

type Args = {
  fs: number;
  sd: number;
  notes?: NoteItem[];
  readingsData?: {
    photocopy: PhotocopyReadingDoc | null;
    stamp: StampReadingDoc | null;
  };
  creditItems: LineItem[];
  debitItems: LineItem[];
  dailySpendsNow: LineItem[];
  businessExpensesNow: LineItem[];
  extraEarnings: LineItem[];
  tSaveReview: Translator;
  tDailyAccount: Translator;
  tCreditsDebits: Translator;
  tCommon: Translator;
  onGoOtherIncomes: () => void;
  onGoBusinessExpenses: () => void;
  onAddCredit: () => void;
  onAddDebit: () => void;
  onGoDailySpends: () => void;
};

export function buildSaveReviewItems({
  fs,
  sd,
  notes,
  readingsData,
  creditItems,
  debitItems,
  dailySpendsNow,
  businessExpensesNow,
  extraEarnings,
  tSaveReview,
  tDailyAccount,
  tCreditsDebits,
  tCommon,
  onGoOtherIncomes,
  onGoBusinessExpenses,
  onAddCredit,
  onAddDebit,
  onGoDailySpends,
}: Args) {
  const blocking: ReviewItem[] = [];

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
  const readingsDone = fs > 0 && sd > 0;

  items.push({
    id: "readings-summary",
    title: tSaveReview("Readings"),
    filled: readingsDone,
    description: readingsDone
      ? tSaveReview("ReadingsPresentDesc")
      : tSaveReview("ReadingsMissingDesc"),
  });

  items.push({
    id: "extra-earnings",
    title: tDailyAccount("OtherEarnings"),
    count: extraEarnings.length,
    filled: isNonEmptyArray(extraEarnings),
    description: isNonEmptyArray(extraEarnings)
      ? formatLineItemSummary(extraEarnings)
      : tSaveReview("NoExtraEarnings"),
    actionLabel: tDailyAccount("AddIncome"),
    onAction: onGoOtherIncomes,
  });

  items.push({
    id: "businessexpenses-summary",
    title: tDailyAccount("BusinessExpense"),
    count: businessExpensesNow.length,
    filled: isNonEmptyArray(businessExpensesNow),
    description: isNonEmptyArray(businessExpensesNow)
      ? formatLineItemSummary(businessExpensesNow)
      : tSaveReview("BusinessExpenseEmptyConfirm"),
    actionLabel: tDailyAccount("AddExpense"),
    onAction: onGoBusinessExpenses,
  });

  items.push({
    id: "credits-summary",
    title: tCreditsDebits("Credits"),
    count: creditItems.length,
    filled: isNonEmptyArray(creditItems),
    description: isNonEmptyArray(creditItems)
      ? formatLineItemSummary(creditItems)
      : tSaveReview("NoCreditsAdded") ?? "No credits added.",
    actionLabel: tCommon("Add"),
    onAction: onAddCredit,
  });

  items.push({
    id: "debits-summary",
    title: tCreditsDebits("Debits"),
    count: debitItems.length,
    filled: isNonEmptyArray(debitItems),
    description: isNonEmptyArray(debitItems)
      ? formatLineItemSummary(debitItems)
      : tSaveReview("NoDebitsAdded"),
    actionLabel: tCommon("Add"),
    onAction: onAddDebit,
  });

  items.push({
    id: "dailyspends-summary",
    title: tDailyAccount("DailySpends"),
    count: dailySpendsNow.length,
    filled: isNonEmptyArray(dailySpendsNow),
    description: isNonEmptyArray(dailySpendsNow)
      ? formatLineItemSummary(dailySpendsNow)
      : tSaveReview("DailySpendsEmptyConfirm"),
    actionLabel: tDailyAccount("AddSpend"),
    onAction: onGoDailySpends,
  });

  const openNotes = (notes ?? []).filter((n) => n.status === "open");
  items.push({
    id: "notes-summary",
    title: tSaveReview("Notes"),
    count: openNotes.length,
    filled: openNotes.length > 0,
    description:
      openNotes.length > 0
        ? openNotes
            .slice(0, 3)
            .map((n) => n.text.split("\n")[0].slice(0, 60))
            .join(" • ")
        : tSaveReview("NoNotes"),
  });

  return { blocking, items };
}
