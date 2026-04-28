import { DailyAccount } from "@/types/daily-account";

export type DailyAccountInput = Omit<
  DailyAccount,
  | "id"
  | "created"
  | "updated"
  | "createdBy"
  | "updatedBy"
  | "notes"
  | "allTags"
  | "accountsCache"
  | "totalEarnings"
  | "totalSpends"
>;
