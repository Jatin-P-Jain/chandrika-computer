// app/daily-account/readings-actions.ts
"use server";

import { fireStore } from "@/firebase/server";
import type {
  Denomination,
  PhotocopyReadingDoc,
  StampReadingDoc,
  StampPartDoc,
} from "@/types/readings";

const DENOMS: Denomination[] = [50, 100, 500, 1000];

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
  const yesterday = addDaysYmd(todayDateYmd, deltaDays); // default deltaDays=0 means get yesterday's readings, deltaDays=-7 means get 7 days ago readings

  const photoRef = fireStore.collection("photocopyReadings").doc(yesterday);
  const stampRef = fireStore.collection("stampReadings").doc(yesterday);

  const [photoSnap, stampSnap] = await Promise.all([
    photoRef.get(),
    stampRef.get(),
  ]);

  const photocopy = photoSnap.exists
    ? (photoSnap.data() as PhotocopyReadingDoc)
    : null;
  const stamp = stampSnap.exists ? (stampSnap.data() as StampReadingDoc) : null;

  return {
    success: true as const,
    yesterdayDateYmd: yesterday,
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

export async function saveStampReading(opts: {
  todayDateYmd: string;
  partsTodayReadings: Record<Denomination, number>;
  prevPartsReadings: Record<Denomination, number>; // from yesterday
}) {
  const parts: Record<Denomination, StampPartDoc> = {
    50: { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
    100: { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
    500: { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
    1000: { todayReading: 0, prevReading: 0, difference: 0, amount: 0 },
  };

  for (const d of DENOMS) {
    const prevReading = nn(opts.prevPartsReadings[d] ?? 0);
    const todayReading = nn(opts.partsTodayReadings[d] ?? 0);
    const difference = clamp0(todayReading - prevReading);
    const amount = clamp0(difference * d);

    parts[d] = { todayReading, prevReading, difference, amount };
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

  return { success: true as const, data: payload };
}
