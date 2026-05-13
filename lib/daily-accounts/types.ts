import { DailyAccount } from "@/types/daily-account";

export type DailyAccountInput = Omit<
  DailyAccount,
  | "id"
  | "status"
  | "created"
  | "updated"
  | "createdBy"
  | "updatedBy"
  | "notes"
  | "allTags"
  | "totalEarnings"
  | "totalSpends"
>;
