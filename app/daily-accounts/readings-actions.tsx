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

function invalidateDailyAccountCaches(docId: string) {
  revalidatePath(`/daily-accounts/${docId}`);
  revalidatePath(`/daily-accounts`);
  updateTag("daily-account-list");
  updateTag("daily-account-latest");
  updateTag(`daily-account:${docId}`);
}

function createEmptyStampParts(): Record<Denomination, StampPartDoc> {
  return {
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
}

async function requireAdminAccess(user: UserData, authtoken: string) {
  const access = await ensureAdminAccess(user, authtoken);
  if (!access.ok) {
    throw new Error(access.message);
  }
}

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

  invalidateDailyAccountCaches(opts.docId);
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

  const [photoFallbackSnap, stampFallbackSnap] = await Promise.all([
    photoSnap.exists
      ? Promise.resolve(null)
      : fireStore
          .collection("photocopyReadings")
          .where("date", "==", yesterday)
          .limit(1)
          .get(),
    stampSnap.exists
      ? Promise.resolve(null)
      : fireStore
          .collection("stampReadings")
          .where("date", "==", yesterday)
          .limit(1)
          .get(),
  ]);

  const resolvedPhotoSnap =
    photoSnap.exists || !photoFallbackSnap || photoFallbackSnap.empty
      ? photoSnap
      : photoFallbackSnap.docs[0];

  const resolvedStampSnap =
    stampSnap.exists || !stampFallbackSnap || stampFallbackSnap.empty
      ? stampSnap
      : stampFallbackSnap.docs[0];

  done({
    success: true,
    docsRead:
      (resolvedPhotoSnap.exists ? 1 : 0) + (resolvedStampSnap.exists ? 1 : 0),
    details: { todayDateYmd, deltaDays },
  });

  const photocopyRaw = resolvedPhotoSnap.exists
    ? (resolvedPhotoSnap.data() as PhotocopyReadingDoc)
    : null;
  const stampRaw = resolvedStampSnap.exists
    ? (resolvedStampSnap.data() as StampReadingDoc)
    : null;

  const photocopy = photocopyRaw
    ? {
        ...photocopyRaw,
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
  useRoundedAmount?: boolean;
  roundedAmount?: number | null;
  user: UserData;
  authtoken: string;
  auditTimestamp: string;
  auditKind: "saved" | "updated";
}) {
  try {
    await requireAdminAccess(opts.user, opts.authtoken);

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

    const ref = fireStore
      .collection("photocopyReadings")
      .doc(opts.todayDateYmd);

    const payload: PhotocopyReadingDoc = {
      date: opts.todayDateYmd,
      todayReading: nn(opts.todayReading),
      prevReading: nn(opts.prevReading),
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
  } catch (error) {
    console.error("savePhotocopyReading failed", error);
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save photocopy reading",
    };
  }
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
  user: UserData;
  authtoken: string;
  auditTimestamp: string;
  auditKind: "saved" | "updated";
}) {
  try {
    await requireAdminAccess(opts.user, opts.authtoken);

    const done = startFirestoreMetric({
      source: "server",
      operation: "saveStampReading",
      collection: "stampReadings",
    });

    const parts = createEmptyStampParts();

    for (const d of DENOMS) {
      const prevReading = nn(opts.prevPartsReadings[d] ?? 0);
      const todayReading = nn(opts.partsTodayReadings[d] ?? 0);
      const stockAdded = nn(opts.partsStockAdded?.[d] ?? 0);
      // New rule: stock added today increases today's opening baseline.
      const todayOpeningBaseline = clamp0(prevReading + stockAdded);
      const difference = clamp0(todayOpeningBaseline - todayReading);
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
  } catch (error) {
    console.error("saveStampReading failed", error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Unable to save stamp reading",
    };
  }
}
