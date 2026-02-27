// app/daily-account/readings-actions.ts
"use server";

import { fireStore, getTotalPages } from "@/firebase/server";
import type {
  Denomination,
  PhotocopyReadingDoc,
  StampReadingDoc,
  StampPartDoc,
} from "@/types/readings";

type GetStampReadingsOptions = {
  pagination?: {
    pageSize?: number;
    page?: number;
  };
};

const DENOMS: Denomination[] = [50, 100, 500, 1000];

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

  const photoRef = fireStore.collection("photocopyReadings").doc(yesterday);
  const stampRef = fireStore.collection("stampReadings").doc(yesterday);

  const [photoSnap, stampSnap] = await Promise.all([
    photoRef.get(),
    stampRef.get(),
  ]);

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

  if (photocopy === null || stamp === null) {
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

export async function savePhotocopyReading(opts: {
  todayDateYmd: string;
  todayReading: number;
  prevReading: number; // from yesterday
}) {
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

  return { success: true as const, data: payload };
}

export const getStampReadings = async (options?: GetStampReadingsOptions) => {
  const page = options?.pagination?.page || 1;
  const pageSize = options?.pagination?.pageSize || 10;

  // const { status, brandId } = options?.filters || {};

  const stampReadingQuery = fireStore
    .collection("stampReadings")
    .orderBy("date", "desc");

  let stampReadingSnapshot;
  let stampReadingTotalPages;
  let totalItems;

  if (pageSize) {
    const stampReadingTotal = await getTotalPages(stampReadingQuery, pageSize);
    stampReadingTotalPages = stampReadingTotal?.totalPages;
    totalItems = stampReadingTotal?.totalItems;

    stampReadingSnapshot = await stampReadingQuery
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();
  } else {
    stampReadingSnapshot = await stampReadingQuery.get();
  }
  const brands = stampReadingSnapshot.docs.map((doc) => {
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
  return {
    data: brands,
    totalPages: stampReadingTotalPages,
    totalItems: totalItems,
  };
};
export async function saveStampReading(opts: {
  todayDateYmd: string;
  partsTodayReadings: Record<Denomination, number>;
  prevPartsReadings: Record<Denomination, number>; // from yesterday
}) {
  const parts: Record<`${Denomination}`, StampPartDoc> = {
    "50": { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
    "100": { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
    "500": { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
    "1000": { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
  };

  for (const d of DENOMS) {
    const prevReading = nn(opts.prevPartsReadings[d] ?? 0);
    const todayReading = nn(opts.partsTodayReadings[d] ?? 0);
    const difference = clamp0(todayReading - prevReading);
    const amount = clamp0(difference * d);

    parts[`${d}`] = { todayReading, prevReading, difference, amount };
  }

  const totalAmount = DENOMS.reduce((acc, d) => acc + parts[`${d}`].amount, 0);

  const ref = fireStore.collection("stampReadings").doc(opts.todayDateYmd);

  const payload: StampReadingDoc = {
    date: opts.todayDateYmd,
    parts,
    totalAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await ref.set(payload, { merge: true }); // upsert merge [web:49]

  return { success: true as const, data: payload };
}
