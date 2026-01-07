import { number, z } from "zod";

const money = z.number("Must be a number").min(1, "Must be 1 or more"); // [web:111]

export const lineItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: money,
  tags: z.array(z.string()).optional(),
});

export const dailySchema = z.object({
  fixed: z.object({
    sd: money,
    sc: z.number().min(0),
    fs: money,
  }),

  // ✅ required arrays (no default)
  earnings: z.object({
    netIncome: z.number().min(1),
    otherIncomes: z.array(lineItemSchema),
  }),
  businessExpenses: z.array(lineItemSchema),
  dailySpends: z.array(lineItemSchema),

  totalCashCollected: money,
});

export type DailyFormValues = z.infer<typeof dailySchema>;
