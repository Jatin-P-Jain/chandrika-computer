import { DailyAccount } from "@/types/daily-account";
import { Timestamp } from "firebase/firestore";

export type DirtyFields =
  | boolean
  | { [key: string]: DirtyFields }
  | DirtyFields[];

export function getDirtyValues<T>(dirty: DirtyFields, values: T): Partial<T> {
  if (dirty === true) return values as any;
  // If any element in an array is dirty, send the whole array (RHF can't express partial array patches reliably). [web:105]
  if (Array.isArray(dirty)) return values as any;

  if (!dirty || typeof dirty !== "object") return {};

  const out: any = {};
  for (const key of Object.keys(dirty)) {
    const childDirty = (dirty as any)[key];
    const childValue = (values as any)?.[key];

    const child = getDirtyValues(childDirty, childValue);
    if (
      childDirty === true ||
      (child && Object.keys(child as any).length > 0)
    ) {
      out[key] = childDirty === true ? childValue : child;
    }
  }

  return out;
}

export function toMillis(ts: Timestamp): number | null {
  if (!ts) return null;

  // Firestore Timestamp has toMillis()
  if (typeof (ts as Timestamp).toMillis === "function")
    return (ts as Timestamp).toMillis();

  // If it was already a Date for some reason
  if (ts instanceof Date) return ts.getTime();

  return null;
}

const toNumber = (v: any, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toLineItems = (arr: any) =>
  Array.isArray(arr)
    ? arr.map((x) => ({
        label: String(x?.label ?? ""),
        amount: toNumber(x?.amount, 0),
        tags: Array.isArray(x?.tags) ? x.tags.map(String) : undefined,
      }))
    : [];
const toUser = (user: any) => {
  return {
    uid: String(user?.uid ?? ""),
    displayName: String(user?.displayName ?? ""),
    email: String(user?.email ?? ""),
    phoneNumber: String(user?.phoneNumber ?? ""),
    phoneVerified: Boolean(user?.phoneVerified ?? false),
    photoUrl: String(user?.photoUrl ?? ""),
    role: String(user?.role ?? "user"),
  };
};

export const normalizeDailyAccount = (raw: any): DailyAccount => {
  return {
    id: String(raw?.id ?? ""),
    fixed: {
      sd: toNumber(raw?.fixed?.sd, 0),
      sc: toNumber(raw?.fixed?.sc, 0),
      fs: toNumber(raw?.fixed?.fs, 0),
      flexnCard: toNumber(raw?.fixed?.flexnCard, 0),
      otherFixedExpenses: toLineItems(raw?.earnings?.otherFixedExpenses),
    },
    earnings: {
      netIncome: toNumber(raw?.earnings?.netIncome, 0),
      otherIncomes: toLineItems(raw?.earnings?.otherIncomes),
    },
    businessExpenses: toLineItems(raw?.businessExpenses),
    dailySpends: toLineItems(raw?.dailySpends),
    allTags: extractAllTags(raw),
    totalEarnings: toNumber(raw?.totalEarnings, 0),
    totalSpends: toNumber(raw?.totalSpends, 0),
    totalCashCollected: toNumber(raw?.totalCashCollected, 0),
    created: toMillis(raw?.created)
      ? new Date(toMillis(raw?.created)!).toISOString()
      : "",
    updated: toMillis(raw?.updated)
      ? new Date(toMillis(raw?.updated)!).toISOString()
      : "",
    createdBy: toUser(raw?.createdBy),
    updatedBy: toUser(raw?.updatedBy),
  };
};

// --- helpers for update ---
function isPlainObject(v: unknown): v is Record<string, any> {
  return (
    !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
  );
}

// Deep merge objects; arrays are replaced (field arrays should be replaced as a whole). [web:168]
export function deepMerge<T>(base: T, patch: any): T {
  if (!isPlainObject(base) || !isPlainObject(patch))
    return (patch ?? base) as T;

  const out: any = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv === undefined) continue;

    const bv = out[key];

    if (Array.isArray(pv)) {
      out[key] = pv;
    } else if (isPlainObject(pv) && isPlainObject(bv)) {
      out[key] = deepMerge(bv, pv);
    } else {
      out[key] = pv;
    }
  }
  return out as T;
}

// 🔥 HELPER FUNCTIONS (add these)
export function extractAllTags(data: any): string[] {
  const tags: string[] = [];

  // Earnings → otherIncomes tags
  if (data.earnings?.otherIncomes?.length) {
    data.earnings.otherIncomes.forEach((income: any) => {
      if (Array.isArray(income.tags)) {
        tags.push(...income.tags);
      }
    });
  }

  // Business Expenses tags
  if (Array.isArray(data.businessExpenses)) {
    data.businessExpenses.forEach((expense: any) => {
      if (Array.isArray(expense.tags)) {
        tags.push(...expense.tags);
      }
    });
  }

  // Daily Spends tags
  if (Array.isArray(data.dailySpends)) {
    data.dailySpends.forEach((spend: any) => {
      if (Array.isArray(spend.tags)) {
        tags.push(...spend.tags);
      }
    });
  }

  return Array.from(new Set(tags)); // Unique tags
}

export function calculateTotals(data: any) {
  let earnings = data.earnings.netIncome;
  let spends = 0;

  // Total earnings from otherIncomes
  if (data.earnings?.otherIncomes?.length) {
    data.earnings.otherIncomes.forEach((income: any) => {
      earnings += Number(income.amount) || 0;
    });
  }

  // Total business expenses
  if (Array.isArray(data.businessExpenses)) {
    data.businessExpenses.forEach((expense: any) => {
      spends += Number(expense.amount) || 0;
    });
  }

  // Total daily spends
  if (Array.isArray(data.dailySpends)) {
    data.dailySpends.forEach((spend: any) => {
      spends += Number(spend.amount) || 0;
    });
  }

  return {
    earnings,
    spends,
  };
}
