import type { FieldErrors } from "react-hook-form";
import { toast } from "sonner";

import type { DailyFormValues } from "@/schema/daily-page.schema";

type Translator = (key: string) => string;

export function collectInvalidPaths(
  errors: FieldErrors<DailyFormValues>,
  prefix = ""
): string[] {
  const out: string[] = [];

  for (const [key, val] of Object.entries(errors)) {
    if (!val) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const node = val as unknown as { message?: string };

    if (typeof node.message === "string") {
      out.push(path);
      continue;
    }

    if (typeof val === "object") {
      out.push(
        ...collectInvalidPaths(val as FieldErrors<DailyFormValues>, path)
      );
    }
  }

  return out;
}

function toReadableFieldName(
  path: string,
  tDailyAccount: Translator,
  tCreditsDebits: Translator
): string {
  if (path === "totalCashCollected") {
    return tDailyAccount("TotalCashCollected");
  }
  if (path === "earnings.netIncome") {
    return tDailyAccount("TotalIncome");
  }
  if (path.startsWith("fixed.")) {
    return tDailyAccount("FixedExpenses");
  }
  if (path.startsWith("earnings.otherIncomes")) {
    return tDailyAccount("OtherEarnings");
  }
  if (path.startsWith("businessExpenses")) {
    return tDailyAccount("BusinessExpense");
  }
  if (path.startsWith("dailySpends")) {
    return tDailyAccount("DailySpends");
  }
  if (path.startsWith("creditItems")) {
    return tCreditsDebits("Credits");
  }
  if (path.startsWith("debitItems")) {
    return tCreditsDebits("Debits");
  }

  return path
    .replace(/\.\d+\./g, " - ")
    .replace(/\./g, " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

type HandleArgs = {
  errors: FieldErrors<DailyFormValues>;
  totalCashCollected: number;
  tDailyAccount: Translator;
  tCreditsDebits: Translator;
  focusCashInput: () => void;
};

export function handleDailyFormSubmitErrors({
  errors,
  totalCashCollected,
  tDailyAccount,
  tCreditsDebits,
  focusCashInput,
}: HandleArgs) {
  const invalidPaths = collectInvalidPaths(errors);

  const hasMissingCash =
    invalidPaths.includes("totalCashCollected") || totalCashCollected <= 0;

  if (hasMissingCash) {
    toast.error(tDailyAccount("TotalCashCollected"), {
      description: "Please enter total cash collected before saving.",
    });
    focusCashInput();
    return;
  }

  const readableFields = Array.from(
    new Set(
      invalidPaths
        .filter((path) => path !== "totalCashCollected")
        .map((path) => toReadableFieldName(path, tDailyAccount, tCreditsDebits))
    )
  );

  if (readableFields.length > 0) {
    const firstFew = readableFields.slice(0, 4).join(", ");
    const more =
      readableFields.length > 4 ? ` +${readableFields.length - 4} more` : "";

    toast.error("Please fix these fields", {
      description: `${firstFew}${more}`,
    });
  }
}
