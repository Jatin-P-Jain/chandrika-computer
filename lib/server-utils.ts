import { DailyAccount } from "@/types/daily-account";

export type DirtyFields =
  | true
  | false
  | null
  | undefined
  | { [key: string]: DirtyFields }
  | DirtyFields[];

type UnknownRecord = Record<string, unknown>;

type DailyAccountLineItem = {
  label: string;
  amount: number;
  tags?: string[];
};

type AccountAttachedLineItem = DailyAccountLineItem & {
  accountId: string;
  accountName?: string;
};

type UserShape = {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  phoneVerified: boolean;
  photoUrl: string;
  role: string;
};

type TimestampLike = { toMillis: () => number };
type NoteItemStatus = "open" | "done" | "dismissed";

type NoteItem = {
  id: string;
  text: string;
  status: NoteItemStatus;
  createdAt: Date;
  updatedAt: Date;
};

type AuditEntity = "reading" | "notes" | "account";
type AuditType =
  | "reading_saved"
  | "reading_updated"
  | "notes_saved"
  | "notes_updated"
  | "account_created"
  | "account_updated";

type AuditEventShape = {
  type: AuditType;
  action: string;
  entity: AuditEntity;
  user: UserShape | null;
  timestamp: string;
};

type DailyAccountStatus = "draft" | "saved" | "edited";

function toDailyAccountStatus(v: unknown): DailyAccountStatus {
  if (v === "draft" || v === "saved" || v === "edited") return v;
  return "draft";
}

function isNoteStatus(v: unknown): v is NoteItemStatus {
  return v === "open" || v === "done" || v === "dismissed";
}

function toDateFromFirestoreLike(v: unknown): Date {
  const ms = toMillis(v);
  return ms ? new Date(ms) : new Date(0);
}

function toNoteItem(v: unknown): NoteItem {
  const r = getObj(v);
  const statusRaw = getNested(r, "status");
  const status: NoteItemStatus = isNoteStatus(statusRaw) ? statusRaw : "open";

  return {
    id: toStringSafe(getNested(r, "id")),
    text: toStringSafe(getNested(r, "text")),
    status,
    createdAt: toDateFromFirestoreLike(getNested(r, "createdAt")),
    updatedAt: toDateFromFirestoreLike(getNested(r, "updatedAt")),
  };
}

function toNoteItems(arr: unknown): NoteItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(toNoteItem);
}

function isAuditEntity(v: unknown): v is AuditEntity {
  return v === "reading" || v === "notes" || v === "account";
}

function isAuditType(v: unknown): v is AuditType {
  return (
    v === "reading_saved" ||
    v === "reading_updated" ||
    v === "notes_saved" ||
    v === "notes_updated" ||
    v === "account_created" ||
    v === "account_updated"
  );
}

function toAuditEvent(v: unknown): AuditEventShape | null {
  const r = getObj(v);

  const typeRaw = getNested(r, "type");
  const entityRaw = getNested(r, "entity");
  const action = toStringSafe(getNested(r, "action"));
  const timestamp = toStringSafe(getNested(r, "timestamp"));
  const userRaw = getNested(r, "user");

  if (!isAuditType(typeRaw) || !isAuditEntity(entityRaw)) return null;
  if (!action || !timestamp) return null;

  return {
    type: typeRaw,
    action,
    entity: entityRaw,
    user: userRaw == null ? null : toUser(userRaw),
    timestamp,
  };
}

function toAuditTrail(arr: unknown): AuditEventShape[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(toAuditEvent)
    .filter((event): event is AuditEventShape => event !== null);
}

function isRecord(v: unknown): v is UnknownRecord {
  return (
    !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
  );
}

function getObj(v: unknown): UnknownRecord {
  return isRecord(v) ? v : {};
}

function getNested(obj: UnknownRecord, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toStringSafe(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

function toStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => toStringSafe(x));
}

function toDailyLineItem(v: unknown): DailyAccountLineItem {
  const r = getObj(v);
  return {
    label: toStringSafe(getNested(r, "label")),
    amount: toNumber(getNested(r, "amount"), 0),
    tags: toStringArray(getNested(r, "tags")),
  };
}

function toDailyLineItems(arr: unknown): DailyAccountLineItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(toDailyLineItem);
}

function toAccountAttachedLineItem(v: unknown): AccountAttachedLineItem {
  const r = getObj(v);
  return {
    accountId: toStringSafe(getNested(r, "accountId")),
    accountName: toStringSafe(getNested(r, "accountName")),
    label: toStringSafe(getNested(r, "label")),
    amount: toNumber(getNested(r, "amount"), 0),
    tags: toStringArray(getNested(r, "tags")),
  };
}

function toAccountAttachedLineItems(arr: unknown): AccountAttachedLineItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(toAccountAttachedLineItem);
}

function toUser(user: unknown): UserShape {
  const u = getObj(user);

  return {
    uid: toStringSafe(getNested(u, "uid")),
    displayName: toStringSafe(getNested(u, "displayName")),
    email: toStringSafe(getNested(u, "email")),
    phoneNumber: toStringSafe(getNested(u, "phoneNumber")),
    phoneVerified: Boolean(getNested(u, "phoneVerified") ?? false),
    photoUrl: toStringSafe(getNested(u, "photoUrl")),
    role: toStringSafe(getNested(u, "role") ?? "user"),
  };
}

export function getDirtyValues<T>(dirty: DirtyFields, values: T): Partial<T> {
  // leaf: include as-is
  if (dirty === true) return values as unknown as Partial<T>;

  // array: if any element dirty, send whole array
  if (Array.isArray(dirty)) return values as unknown as Partial<T>;

  // not dirty / invalid shape
  if (!dirty || typeof dirty !== "object") return {};

  // if we got an object dirty map but values isn't an object, nothing to extract
  if (!isRecord(values)) return {};

  const out: Record<string, unknown> = {};

  for (const key of Object.keys(dirty as Record<string, DirtyFields>)) {
    const childDirty = (dirty as Record<string, DirtyFields>)[key];
    if (!childDirty) continue;

    const childValue = (values as Record<string, unknown>)[key];

    // Critical guard: dirty key exists but value missing -> skip
    if (childValue === undefined) continue;

    // recurse
    const child = getDirtyValues(childDirty, childValue);

    // include only if it actually produced something, or leaf dirty=true
    if (
      childDirty === true ||
      (isRecord(child) && Object.keys(child).length > 0)
    ) {
      out[key] = childDirty === true ? childValue : child;
    }
  }

  return out as Partial<T>;
}

export function toMillis(ts: unknown): number | null {
  if (!ts) return null;

  // Firestore Timestamp has toMillis() [web:553]
  if (typeof ts === "object" && ts !== null) {
    const maybe = ts as TimestampLike;
    if (typeof maybe.toMillis === "function") return maybe.toMillis();
  }

  if (ts instanceof Date) return ts.getTime();

  return null;
}

export const normalizeDailyAccount = (raw: unknown): DailyAccount => {
  const r = getObj(raw);

  const fixed = getObj(getNested(r, "fixed"));
  const earnings = getObj(getNested(r, "earnings"));
  const createdBy = toUser(getNested(r, "createdBy"));
  const statusRaw = getNested(r, "status");
  const inferredStatus =
    statusRaw == null
      ? createdBy.uid
        ? "saved"
        : "draft"
      : toDailyAccountStatus(statusRaw);

  const createdMillis = toMillis(getNested(r, "created"));
  const updatedMillis = toMillis(getNested(r, "updated"));
  const lastNotedAtMillis = toMillis(getNested(r, "lastNotedAt"));
  const lastReadingAtMillis = toMillis(getNested(r, "lastReadingAt"));

  return {
    id: toStringSafe(getNested(r, "id")),
    status: inferredStatus,

    fixed: {
      sd: toNumber(getNested(fixed, "sd"), 0),
      sc: toNumber(getNested(fixed, "sc"), 0),
      fs: toNumber(getNested(fixed, "fs"), 0),
      flexnCard: toNumber(getNested(fixed, "flexnCard"), 0),
      otherFixedExpenses: toDailyLineItems(
        getNested(fixed, "otherFixedExpenses")
      ),
    },

    earnings: {
      netIncome: toNumber(getNested(earnings, "netIncome"), 0),
      otherIncomes: toDailyLineItems(getNested(earnings, "otherIncomes")),
    },

    businessExpenses: toDailyLineItems(getNested(r, "businessExpenses")),
    dailySpends: toDailyLineItems(getNested(r, "dailySpends")),

    creditItems: toAccountAttachedLineItems(getNested(r, "creditItems")),
    debitItems: toAccountAttachedLineItems(getNested(r, "debitItems")),

    notes: toNoteItems(getNested(r, "notes")),

    allTags: extractAllTags(r),

    totalEarnings: toNumber(getNested(r, "totalEarnings"), 0),
    totalSpends: toNumber(getNested(r, "totalSpends"), 0),
    totalCashCollected: toNumber(getNested(r, "totalCashCollected"), 0),

    created: createdMillis ? new Date(createdMillis).toISOString() : "",
    updated: updatedMillis ? new Date(updatedMillis).toISOString() : "",
    lastNotedAt: lastNotedAtMillis
      ? new Date(lastNotedAtMillis).toISOString()
      : "",
    lastReadingAt: lastReadingAtMillis
      ? new Date(lastReadingAtMillis).toISOString()
      : "",

    createdBy,
    updatedBy: toUser(getNested(r, "updatedBy")),
    auditTrail: toAuditTrail(getNested(r, "auditTrail")),
  };
};

function isPlainObject(v: unknown): v is UnknownRecord {
  return (
    !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
  );
}

// Deep merge objects; arrays are replaced (field arrays should be replaced as a whole).
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch ?? base) as unknown as T;
  }

  const out: UnknownRecord = { ...(base as unknown as UnknownRecord) };
  const patchObj = patch as UnknownRecord;

  for (const key of Object.keys(patchObj)) {
    const pv = patchObj[key];
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

  return out as unknown as T;
}

export function extractAllTags(data: unknown): string[] {
  const d = getObj(data);
  const tags: string[] = [];

  const earnings = getObj(getNested(d, "earnings"));
  const otherIncomes = getNested(earnings, "otherIncomes");
  if (Array.isArray(otherIncomes)) {
    for (const income of otherIncomes) {
      const inc = getObj(income);
      const t = getNested(inc, "tags");
      if (Array.isArray(t)) tags.push(...t.map((x) => toStringSafe(x)));
    }
  }

  const businessExpenses = getNested(d, "businessExpenses");
  if (Array.isArray(businessExpenses)) {
    for (const expense of businessExpenses) {
      const ex = getObj(expense);
      const t = getNested(ex, "tags");
      if (Array.isArray(t)) tags.push(...t.map((x) => toStringSafe(x)));
    }
  }

  const dailySpends = getNested(d, "dailySpends");
  if (Array.isArray(dailySpends)) {
    for (const spend of dailySpends) {
      const sp = getObj(spend);
      const t = getNested(sp, "tags");
      if (Array.isArray(t)) tags.push(...t.map((x) => toStringSafe(x)));
    }
  }

  return Array.from(new Set(tags));
}

export function calculateTotals(data: unknown): {
  earnings: number;
  spends: number;
} {
  const d = getObj(data);
  const earningsObj = getObj(getNested(d, "earnings"));

  let earnings = toNumber(getNested(earningsObj, "netIncome"), 0);
  let spends = 0;

  const otherIncomes = getNested(earningsObj, "otherIncomes");
  if (Array.isArray(otherIncomes)) {
    for (const income of otherIncomes) {
      const inc = getObj(income);
      earnings += toNumber(getNested(inc, "amount"), 0);
    }
  }

  const businessExpenses = getNested(d, "businessExpenses");
  if (Array.isArray(businessExpenses)) {
    for (const expense of businessExpenses) {
      const ex = getObj(expense);
      spends += toNumber(getNested(ex, "amount"), 0);
    }
  }

  const dailySpends = getNested(d, "dailySpends");
  if (Array.isArray(dailySpends)) {
    for (const spend of dailySpends) {
      const sp = getObj(spend);
      spends += toNumber(getNested(sp, "amount"), 0);
    }
  }

  return { earnings, spends };
}
