// app/daily-account/readings-actions.ts
"use server";

import { fireStore } from "@/firebase/server";
import type {
  Denomination,
  ManualPreviousReadingsDoc,
  PhotocopyReadingDoc,
  StampReadingDoc,
  StampPartDoc,
  StampReadingRow,
  PhotocopyReadingRow,
} from "@/types/readings";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { AuditEvent } from "@/types/daily-account";
import { UserData } from "@/types/user";
import { FieldValue } from "@/firebase/server";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";

type GetReadingsOptions = {
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

const DENOMS: Denomination[] = [50, 100, 500, 1000];

async function syncDailyAccountFromReadings(opts: {
  docId: string;
  fsAmount?: number;
  sdAmount?: number;
  user: UserData;
  auditTimestamp: string;
  auditKind: "saved" | "updated";
}) {
  const accountRef = fireStore.collection("daily-accounts").doc(opts.docId);
  const accountSnap = await accountRef.get();

  const existing = accountSnap.data() as
    | {
        fixed?: {
          sd?: number;
          fs?: number;
          sc?: number;
          flexnCard?: number;
          otherFixedExpenses?: unknown[];
        };
        earnings?: { netIncome?: number; otherIncomes?: unknown[] };
        businessExpenses?: unknown[];
        dailySpends?: unknown[];
        creditItems?: unknown[];
        debitItems?: unknown[];
        allTags?: unknown[];
        totalEarnings?: number;
        totalSpends?: number;
        totalCashCollected?: number;
        created?: unknown;
        createdBy?: unknown;
        updatedBy?: unknown;
        status?: "draft" | "saved" | "edited";
      }
    | undefined;

  const nextSd = nn(opts.sdAmount ?? existing?.fixed?.sd ?? 0);
  const nextFs = nn(opts.fsAmount ?? existing?.fixed?.fs ?? 0);
  const nextSc = nn(nextSd * 0.3);
  const now = Timestamp.now();

  const requiredFields = {
    id: opts.docId,
    status: existing?.status ?? "draft",
    fixed: {
      sd: nextSd,
      fs: nextFs,
      sc: nextSc,
      flexnCard: nn(existing?.fixed?.flexnCard ?? 0),
      otherFixedExpenses: existing?.fixed?.otherFixedExpenses ?? [],
    },
    earnings: {
      netIncome: nn(existing?.earnings?.netIncome ?? 0),
      otherIncomes: existing?.earnings?.otherIncomes ?? [],
    },
    businessExpenses: existing?.businessExpenses ?? [],
    dailySpends: existing?.dailySpends ?? [],
    creditItems: existing?.creditItems ?? [],
    debitItems: existing?.debitItems ?? [],
    notes: [],
    allTags: Array.isArray(existing?.allTags) ? existing?.allTags : [],
    totalEarnings: nn(existing?.totalEarnings ?? 0),
    totalSpends: nn(existing?.totalSpends ?? 0),
    totalCashCollected: nn(existing?.totalCashCollected ?? 0),
    createdBy: existing?.createdBy ?? opts.user,
    updatedBy: opts.user,
    created: existing?.created ?? now,
    updated: now,
    lastReadingAt: now,
  };

  const readingAuditEvent: AuditEvent = {
    type: opts.auditKind === "saved" ? "reading_saved" : "reading_updated",
    action: opts.auditKind === "saved" ? "Readings Saved" : "Readings Updated",
    entity: "reading",
    user: opts.user,
    timestamp: opts.auditTimestamp,
  };

  const accountDraftEvent: AuditEvent = {
    type: "account_created",
    action: "Draft Saved",
    entity: "account",
    user: opts.user,
    timestamp: opts.auditTimestamp,
  };

  const auditEvents = accountSnap.exists
    ? [readingAuditEvent]
    : [accountDraftEvent, readingAuditEvent];

  await accountRef.set(
    {
      ...requiredFields,
      auditTrail: FieldValue.arrayUnion(...auditEvents),
    },
    { merge: true },
  );

  revalidatePath(`/daily-accounts/${opts.docId}`);
  revalidatePath(`/daily-accounts`);
  updateTag("daily-account-list");
  updateTag("daily-account-latest");
  updateTag(`daily-account:${opts.docId}`);
}

type TimestampLike = { toMillis: () => number };

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "object" && ts !== null) {
    const maybe = ts as TimestampLike;
    if (typeof maybe.toMillis === "function") return maybe.toMillis();
  }
  return null;
}

function toDate(ts: unknown): Date | null {
  const ms = toMillis(ts);
  return ms ? new Date(ms) : null;
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toYmd(dt);
}

function nn(n: number) {
  return Number.isFinite(n) ? n : 0;
}
function clamp0(n: number) {
  return Math.max(0, nn(n));
}

export async function getManualPreviousReadings(opts: {
  todayDateYmd: string;
  user: UserData;
  authtoken: string;
}) {
  const access = await ensureAdminAccess(opts.user, opts.authtoken);
  if (!access.ok) {
    throw new Error(access.message);
  }

  const done = startFirestoreMetric({
    source: "server",
    operation: "getManualPreviousReadings",
    collection: "manualPreviousReadings",
  });

  const docRef = fireStore
    .collection("manualPreviousReadings")
    .doc(opts.todayDateYmd);
  const snap = await docRef.get();

  done({
    success: true,
    docsRead: snap.exists ? 1 : 0,
    details: { todayDateYmd: opts.todayDateYmd },
  });

  if (!snap.exists) {
    return { success: true as const, data: null };
  }

  const raw = snap.data();
  if (!raw) {
    return { success: true as const, data: null };
  }

  const parsed: ManualPreviousReadingsDoc = {
    date: String(raw.date ?? opts.todayDateYmd),
    photoPrev: nn(raw.photoPrev ?? 0),
    stampPrev: {
      50: nn(raw.stampPrev?.[50] ?? 0),
      100: nn(raw.stampPrev?.[100] ?? 0),
      500: nn(raw.stampPrev?.[500] ?? 0),
      1000: nn(raw.stampPrev?.[1000] ?? 0),
    },
    isManual: Boolean(raw.isManual),
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };

  return { success: true as const, data: parsed };
}

export async function saveManualPreviousReadings(opts: {
  todayDateYmd: string;
  photoPrev: number;
  stampPrev: Record<Denomination, number>;
  user: UserData;
  authtoken: string;
}) {
  const access = await ensureAdminAccess(opts.user, opts.authtoken);
  if (!access.ok) {
    throw new Error(access.message);
  }

  const done = startFirestoreMetric({
    source: "server",
    operation: "saveManualPreviousReadings",
    collection: "manualPreviousReadings",
  });

  const docRef = fireStore
    .collection("manualPreviousReadings")
    .doc(opts.todayDateYmd);

  const payload: ManualPreviousReadingsDoc = {
    date: opts.todayDateYmd,
    photoPrev: nn(opts.photoPrev),
    stampPrev: {
      50: nn(opts.stampPrev[50] ?? 0),
      100: nn(opts.stampPrev[100] ?? 0),
      500: nn(opts.stampPrev[500] ?? 0),
      1000: nn(opts.stampPrev[1000] ?? 0),
    },
    isManual: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(payload, { merge: true });

  done({
    success: true,
    docsWritten: 1,
    details: { todayDateYmd: opts.todayDateYmd },
  });

  return { success: true as const, data: payload };
}

export async function clearManualPreviousReadings(opts: {
  todayDateYmd: string;
  user: UserData;
  authtoken: string;
}) {
  const access = await ensureAdminAccess(opts.user, opts.authtoken);
  if (!access.ok) {
    throw new Error(access.message);
  }

  const done = startFirestoreMetric({
    source: "server",
    operation: "clearManualPreviousReadings",
    collection: "manualPreviousReadings",
  });

  await fireStore
    .collection("manualPreviousReadings")
    .doc(opts.todayDateYmd)
    .delete();

  done({
    success: true,
    docsWritten: 1,
    details: { todayDateYmd: opts.todayDateYmd },
  });

  return { success: true as const };
}

export async function getReadings(todayDateYmd: string, deltaDays = 0) {
  const yesterday = addDaysYmd(todayDateYmd, deltaDays);
  const done = startFirestoreMetric({
    source: "server",
    operation: "getReadings",
    collection: "photocopyReadings,stampReadings",
  });

  const photoRef = fireStore.collection("photocopyReadings").doc(yesterday);
  const stampRef = fireStore.collection("stampReadings").doc(yesterday);

  const [photoSnap, stampSnap] = await Promise.all([
    photoRef.get(),
    stampRef.get(),
  ]);

  done({
    success: true,
    docsRead: (photoSnap.exists ? 1 : 0) + (stampSnap.exists ? 1 : 0),
    details: { todayDateYmd, deltaDays },
  });

  const photocopyRaw = photoSnap.exists
    ? (photoSnap.data() as PhotocopyReadingDoc)
    : null;
  const stampRaw = stampSnap.exists
    ? (stampSnap.data() as StampReadingDoc)
    : null;

  const photocopy = photocopyRaw
    ? {
        ...photocopyRaw,
        prevReadingWasManual: Boolean(photocopyRaw.prevReadingWasManual),
        actualAmount: nn(photocopyRaw.actualAmount ?? photocopyRaw.amount),
        roundedAmount:
          photocopyRaw.roundedAmount ??
          (photocopyRaw.isRounded ? nn(photocopyRaw.amount) : null),
        isRounded: Boolean(
          photocopyRaw.isRounded ?? photocopyRaw.roundedAmount != null,
        ),
        createdAt: toDate(photocopyRaw.createdAt),
        updatedAt: toDate(photocopyRaw.updatedAt),
      }
    : null;

  const stamp = stampRaw
    ? {
        ...stampRaw,
        createdAt: toDate(stampRaw.createdAt),
        updatedAt: toDate(stampRaw.updatedAt),
      }
    : null;

  // Allow partial success: success if either exists
  if (photocopy === null && stamp === null) {
    return {
      success: false,
      photocopy,
      stamp,
    };
  }
  return {
    success: true,
    photocopy,
    stamp,
  };
}
export const getPhotocopyReadings = async (
  options?: GetReadingsOptions & { pageToken?: string },
) => {
  const done = startFirestoreMetric({
    source: "server",
    operation: "getPhotocopyReadings",
    collection: "photocopyReadings",
  });

  const pageSize = options?.pagination?.pageSize || 10;
  const pageToken = options?.pageToken;

  let query = fireStore.collection("photocopyReadings").orderBy("date", "desc");
  if (pageToken) {
    const lastDoc = await fireStore
      .collection("photocopyReadings")
      .doc(pageToken)
      .get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }
  const snapshot = await query.limit(pageSize).get();
  done({
    success: true,
    docsRead: snapshot.size,
    details: { pageSize, pageToken: pageToken || null },
  });

  const photocopyReadings = snapshot.docs.map((doc) => {
    const rawReading = doc.data();
    const reading: PhotocopyReadingDoc = {
      date: rawReading.date,
      todayReading: rawReading.todayReading,
      prevReading: rawReading.prevReading,
      prevReadingWasManual: Boolean(rawReading.prevReadingWasManual),
      stockAdded: nn(rawReading.stockAdded ?? 0),
      difference: rawReading.difference,
      rate: rawReading.rate,
      amount: rawReading.amount,
      actualAmount: nn(rawReading.actualAmount ?? rawReading.amount),
      roundedAmount:
        rawReading.roundedAmount ??
        (rawReading.isRounded ? nn(rawReading.amount) : null),
      isRounded: Boolean(
        rawReading.isRounded ?? rawReading.roundedAmount != null,
      ),
      createdAt: toDate(rawReading.createdAt),
      updatedAt: toDate(rawReading.updatedAt),
    };
    return reading;
  });
  const nextPageToken =
    snapshot.docs.length === pageSize
      ? snapshot.docs[snapshot.docs.length - 1].id
      : undefined;
  return {
    data: photocopyReadings as PhotocopyReadingRow[],
    nextPageToken,
  };
};
export async function savePhotocopyReading(opts: {
  todayDateYmd: string;
  todayReading: number;
  prevReading: number; // from yesterday
  prevReadingWasManual?: boolean;
  useRoundedAmount?: boolean;
  roundedAmount?: number | null;
  user: UserData;
  authtoken: string;
  auditTimestamp: string;
  auditKind: "saved" | "updated";
}) {
  const access = await ensureAdminAccess(opts.user, opts.authtoken);
  if (!access.ok) {
    throw new Error(access.message);
  }

  const done = startFirestoreMetric({
    source: "server",
    operation: "savePhotocopyReading",
    collection: "photocopyReadings",
  });

  const rate = 2;

  const difference = clamp0(opts.todayReading - opts.prevReading);
  const actualAmount = clamp0(difference * rate);
  const roundedAmount = opts.useRoundedAmount
    ? clamp0(opts.roundedAmount ?? actualAmount)
    : null;
  const amount = roundedAmount ?? actualAmount;

  const ref = fireStore.collection("photocopyReadings").doc(opts.todayDateYmd);

  const payload: PhotocopyReadingDoc = {
    date: opts.todayDateYmd,
    todayReading: nn(opts.todayReading),
    prevReading: nn(opts.prevReading),
    prevReadingWasManual: Boolean(opts.prevReadingWasManual),
    difference,
    rate,
    amount,
    actualAmount,
    // Do not persist rounded value separately; amount is the source of truth.
    roundedAmount: null,
    isRounded: roundedAmount !== null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Ensure any legacy roundedAmount value is removed from stored document.
  await ref.set(
    {
      ...payload,
      roundedAmount: FieldValue.delete(),
    },
    { merge: true },
  );

  await syncDailyAccountFromReadings({
    docId: opts.todayDateYmd,
    fsAmount: amount,
    user: opts.user,
    auditTimestamp: opts.auditTimestamp,
    auditKind: opts.auditKind,
  });

  done({
    success: true,
    docsWritten: 1,
    details: { todayDateYmd: opts.todayDateYmd },
  });

  return { success: true as const, data: payload };
}

export const getStampReadings = async (
  options?: GetReadingsOptions & { pageToken?: string },
) => {
  const done = startFirestoreMetric({
    source: "server",
    operation: "getStampReadings",
    collection: "stampReadings",
  });

  const pageSize = options?.pagination?.pageSize || 10;
  const pageToken = options?.pageToken;

  let query = fireStore.collection("stampReadings").orderBy("date", "desc");
  if (pageToken) {
    const lastDoc = await fireStore
      .collection("stampReadings")
      .doc(pageToken)
      .get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }
  const snapshot = await query.limit(pageSize).get();
  done({
    success: true,
    docsRead: snapshot.size,
    details: { pageSize, pageToken: pageToken || null },
  });

  const stampReadings = snapshot.docs.map((doc) => {
    const rawReading = doc.data();
    const reading: StampReadingDoc = {
      date: rawReading.date,
      parts: rawReading.parts,
      prevReadingWasManual: Boolean(rawReading.prevReadingWasManual),
      totalAmount: rawReading.totalAmount,
      createdAt: toDate(rawReading.createdAt),
      updatedAt: toDate(rawReading.updatedAt),
    };
    return reading;
  });
  const nextPageToken =
    snapshot.docs.length === pageSize
      ? snapshot.docs[snapshot.docs.length - 1].id
      : undefined;
  return {
    data: stampReadings as StampReadingRow[],
    nextPageToken,
  };
};
export async function saveStampReading(opts: {
  todayDateYmd: string;
  partsTodayReadings: Record<Denomination, number>;
  prevPartsReadings: Record<Denomination, number>; // from yesterday
  prevReadingWasManual?: boolean;
  partsStockAdded?: Record<Denomination, number>; // stock added today
  user: UserData;
  authtoken: string;
  auditTimestamp: string;
  auditKind: "saved" | "updated";
}) {
  const access = await ensureAdminAccess(opts.user, opts.authtoken);
  if (!access.ok) {
    throw new Error(access.message);
  }

  const done = startFirestoreMetric({
    source: "server",
    operation: "saveStampReading",
    collection: "stampReadings",
  });

  const parts: Record<Denomination, StampPartDoc> = {
    50: {
      todayReading: 0,
      prevReading: 0,
      stockAdded: 0,
      difference: 0,
      amount: 0,
    },
    100: {
      todayReading: 0,
      prevReading: 0,
      stockAdded: 0,
      difference: 0,
      amount: 0,
    },
    500: {
      todayReading: 0,
      prevReading: 0,
      stockAdded: 0,
      difference: 0,
      amount: 0,
    },
    1000: {
      todayReading: 0,
      prevReading: 0,
      stockAdded: 0,
      difference: 0,
      amount: 0,
    },
  };

  for (const d of DENOMS) {
    const prevReading = nn(opts.prevPartsReadings[d] ?? 0);
    const todayReading = nn(opts.partsTodayReadings[d] ?? 0);
    const stockAdded = nn(opts.partsStockAdded?.[d] ?? 0);
    const todaySoldBaseline = clamp0(todayReading - stockAdded);
    // Keep server-side stamp sold logic consistent with review UI:
    // if today's effective reading is 0, sold must remain 0.
    const difference =
      todaySoldBaseline > 0 ? clamp0(prevReading - todaySoldBaseline) : 0;
    const amount = clamp0(difference * d);

    parts[d] = { todayReading, prevReading, stockAdded, difference, amount };
  }

  const totalAmount = DENOMS.reduce((acc, d) => acc + parts[d].amount, 0);

  const ref = fireStore.collection("stampReadings").doc(opts.todayDateYmd);

  const payload: StampReadingDoc = {
    date: opts.todayDateYmd,
    parts,
    prevReadingWasManual: Boolean(opts.prevReadingWasManual),
    totalAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await ref.set(payload, { merge: true }); // upsert merge [web:49]

  await syncDailyAccountFromReadings({
    docId: opts.todayDateYmd,
    sdAmount: totalAmount,
    user: opts.user,
    auditTimestamp: opts.auditTimestamp,
    auditKind: opts.auditKind,
  });

  done({
    success: true,
    docsWritten: 1,
    details: { todayDateYmd: opts.todayDateYmd },
  });

  return { success: true as const, data: payload };
}
