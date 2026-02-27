import { z } from "zod";
import { noteItemSchema } from "./daily-notes-schema";

type TFunction = (key: string) => string;

export const makeDailySchema = (t?: TFunction) => {
  const money = z.number().min(0, t ? t("Required") : "Errors.moneyMin1");

  const lineItemSchema = z.object({
    label: z.string().min(1, t ? t("Required") : "Errors.required"),
    amount: money,
    tags: z.array(z.string()).optional(),
  });

  const accountLineItemSchema = lineItemSchema.extend({
    accountId: z.string().min(1, t ? t("Required") : "Errors.required"),
  });

  return z.object({
    fixed: z.object({
      sd: money,
      sc: z.number().min(0, t ? t("Required") : "Errors.nonNegative"),
      fs: money,
      flexnCard: money,
      otherFixedExpenses: z.array(lineItemSchema),
    }),
    earnings: z.object({
      netIncome: z.number().min(1, t ? t("Required") : "Errors.moneyMin1"),
      otherIncomes: z.array(lineItemSchema),
    }),
    businessExpenses: z.array(lineItemSchema),
    dailySpends: z.array(lineItemSchema),

    creditItems: z.array(accountLineItemSchema),
    debitItems: z.array(accountLineItemSchema),

    // NEW:
    notes: z.array(noteItemSchema),

    accountsCache: z.record(z.string(), z.string()).optional(), // { [accountId]: accountName }

    totalCashCollected: money,
  });
};

export type DailyFormValues = z.infer<ReturnType<typeof makeDailySchema>>;
export const dailySchema = makeDailySchema();
