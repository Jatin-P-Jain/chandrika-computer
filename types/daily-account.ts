import { UserData } from "./user";
import { NoteItem } from "./daily-notes";

export type DailyAccountLineItem = {
  label: string;
  amount: number;
  tags?: string[];
};

export type AccountAttachedLineItem = DailyAccountLineItem & {
  accountId: string;
};

export type DailyAccount = {
  id: string;
  fixed: {
    sd: number;
    sc: number;
    fs: number;
    flexnCard: number;
    otherFixedExpenses: DailyAccountLineItem[];
  };
  earnings: {
    netIncome: number;
    otherIncomes: DailyAccountLineItem[];
  };
  businessExpenses: DailyAccountLineItem[];
  dailySpends: DailyAccountLineItem[];

  creditItems: AccountAttachedLineItem[];
  debitItems: AccountAttachedLineItem[];

  accountsCache?: Record<string, { name: string }>; // NEW: Cache for account names to avoid extra lookups

  // NEW:
  notes: NoteItem[];

  allTags: string[];
  totalEarnings: number;
  totalSpends: number;
  totalCashCollected: number;
  createdBy: UserData;
  updatedBy: UserData;
  created: string;
  updated?: string;
  lastNotedAt?: string;
  lastReadingAt?: string;
};
