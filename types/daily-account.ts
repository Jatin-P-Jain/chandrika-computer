import { UserData } from "./user";
import { NoteItem } from "./daily-notes";

export type DailyAccountStatus = "draft" | "saved" | "edited";

export type AuditEventType =
  | "reading_saved"
  | "reading_updated"
  | "notes_saved"
  | "notes_updated"
  | "account_created"
  | "account_updated";

export type AuditEvent = {
  type: AuditEventType;
  action: string; // "Saved", "Updated", etc.
  entity: "reading" | "notes" | "account";
  user: UserData | null;
  timestamp: string;
};

export type DailyAccountLineItem = {
  label: string;
  amount: number;
  tags?: string[];
};

export type AccountAttachedLineItem = DailyAccountLineItem & {
  accountId: string;
  accountName?: string;
};

export type DailyAccount = {
  id: string;
  status: DailyAccountStatus;
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
  auditTrail?: AuditEvent[]; // Timeline of all changes to readings, notes, and account
};
