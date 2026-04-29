// app/daily-account/readings-actions.ts
"use server";

import { fireStore } from "@/firebase/server";
import type {
  Denomination,
  PhotocopyReadingDoc,
  StampReadingDoc,
  StampPartDoc,
  StampReadingRow,
  PhotocopyReadingRow,
} from "@/types/readings";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath, revalidateTag } from "next/cache";
import { AuditEvent } from "@/types/daily-account";
import { UserData } from "@/types/user";
import { FieldValue } from "@/firebase/server";

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
  user?: UserData | null;
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
      }
    | undefined;

  const nextSd = nn(opts.sdAmount ?? existing?.fixed?.sd ?? 0);
  const nextFs = nn(opts.fsAmount ?? existing?.fixed?.fs ?? 0);
  const nextSc = nn(nextSd * 0.3);
  const now = Timestamp.now();

  const requiredFields = {
    id: opts.docId,
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
    createdBy: existing?.createdBy ?? null,
    updatedBy: existing?.updatedBy ?? existing?.createdBy ?? null,
    created: existing?.created ?? now,
    updated: now,
    lastReadingAt: now,
  };

  // Create audit event for reading save/update
  const auditEvent: AuditEvent = {
    type: accountSnap.exists ? "reading_updated" : "reading_saved",
    action: accountSnap.exists ? "Updated" : "Saved",
    entity: "reading",
    user: opts.user || null,
    timestamp: new Date().toISOString(),
  };

  await accountRef.set(
    {
      ...requiredFields,
      auditTrail: FieldValue.arrayUnion(auditEvent),
    },
    { merge: true },
  );

  revalidatePath(`/daily-accounts/${opts.docId}`);
  revalidatePath(`/daily-accounts`);
  revalidateTag("daily-account-list", "max");
  revalidateTag("daily-account-latest", "max");
  revalidateTag(`daily-account:${opts.docId}`, "max");
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
      difference: rawReading.difference,
      rate: rawReading.rate,
      amount: rawReading.amount,
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
}) {
  const done = startFirestoreMetric({
    source: "server",
    operation: "savePhotocopyReading",
    collection: "photocopyReadings",
  });

  const rate = 1.5;

  const difference = clamp0(opts.todayReading - opts.prevReading);
  const amount = clamp0(difference * rate);

  const ref = fireStore.collection("photocopyReadings").doc(opts.todayDateYmd);

  const payload: PhotocopyReadingDoc = {
    date: opts.todayDateYmd,
    todayReading: nn(opts.todayReading),
    prevReading: nn(opts.prevReading),
    difference,
    rate,
    amount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // set(..., {merge:true}) = upsert (create if missing, otherwise merge) [web:49]
  await ref.set(payload, { merge: true });

  await syncDailyAccountFromReadings({
    docId: opts.todayDateYmd,
    fsAmount: amount,
    user: undefined,
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
  partsStockAdded?: Record<Denomination, number>; // stock added today
}) {
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
    const difference = clamp0(todayReading - prevReading - stockAdded);
    const amount = clamp0(difference * d);

    parts[d] = { todayReading, prevReading, stockAdded, difference, amount };
  }

  const totalAmount = DENOMS.reduce((acc, d) => acc + parts[d].amount, 0);

  const ref = fireStore.collection("stampReadings").doc(opts.todayDateYmd);

  const payload: StampReadingDoc = {
    date: opts.todayDateYmd,
    parts,
    totalAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await ref.set(payload, { merge: true }); // upsert merge [web:49]

  await syncDailyAccountFromReadings({
    docId: opts.todayDateYmd,
    sdAmount: totalAmount,
    user: undefined,
  });

  done({
    success: true,
    docsWritten: 1,
    details: { todayDateYmd: opts.todayDateYmd },
  });

  return { success: true as const, data: payload };
}
