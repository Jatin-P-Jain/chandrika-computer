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

function toMillis(ts: Timestamp): number | null {
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

export const normalizeDailyAccount = (raw: any): DailyAccount => {
  return {
    fixed: {
      sd: toNumber(raw?.fixed?.sd, 0),
      sc: toNumber(raw?.fixed?.sc, 0),
      fs: toNumber(raw?.fixed?.fs, 0),
    },
    earnings: {
      netIncome: toNumber(raw?.earnings?.netIncome, 0),
      otherIncomes: toLineItems(raw?.earnings?.otherIncomes),
    },
    businessExpenses: toLineItems(raw?.businessExpenses),
    dailySpends: toLineItems(raw?.dailySpends),
    totalCashCollected: toNumber(raw?.totalCashCollected, 0),
    created: toMillis(raw?.created)
      ? new Date(toMillis(raw?.created)!)!.toLocaleString()
      : "",
    updated: toMillis(raw?.updated)
      ? new Date(toMillis(raw?.updated)!)!.toLocaleString()
      : "",
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
