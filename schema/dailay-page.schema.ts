import { z } from "zod";

const money = z.number("Must be a number").min(0, "Must be 0 or more"); // [web:111]
const optionalTag = z.string().optional().or(z.literal(""));

export const lineItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: money,
  tag: optionalTag,
});

export const dailySchema = z.object({
  fixed: z.object({
    sd: money,
    sc: money,
    fs: money,
  }),

  // ✅ required arrays (no default)
  earnings: z.array(lineItemSchema),
  businessExpenses: z.array(lineItemSchema),
  dailySpends: z.array(lineItemSchema),

  totalCashCollected: money,
});

export type DailyFormValues = z.infer<typeof dailySchema>;
