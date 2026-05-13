import { UserData } from "./user";

export type AccountRefType = "credit" | "debit";

export type ReferencedDailyAccount = {
  dailyAccountId: string;
  accountTypes: AccountRefType[];
};

export type CreditDebitAccount = {
  id: string;
  name: string;
  description?: string;
  type: AccountRefType; // Primarily credit or debit account

  // Number of unique daily accounts that reference this account.
  mentionsCount: number;

  // Auto-calculated totals based on referenced daily accounts
  totalCredits: number;
  totalDebits: number;

  // Metadata
  createdBy: UserData | null;
  updatedBy: UserData | null;
  created: string;
  updated?: string;
};

// Input type for creating/updating (without id, created, createdBy)
export type CreditDebitAccountInput = Omit<
  CreditDebitAccount,
  | "id"
  | "mentionsCount"
  | "totalCredits"
  | "totalDebits"
  | "created"
  | "updated"
  | "createdBy"
  | "updatedBy"
>;
