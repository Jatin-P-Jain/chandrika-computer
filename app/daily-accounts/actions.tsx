"use server";

import { auth, fireStore } from "@/firebase/server";
import { dailySchema } from "@/schema/dailay-page.schema";
import { DailyAccount } from "@/types/daily-account";
import type { Timestamp } from "firebase/firestore";

export const createDailyAccountItem = async (
  data: Omit<DailyAccount, "createdAt" | "updatedAt">,
  authtoken: string,
  accountExistsErrorMessage: string
) => {
  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  const validation = dailySchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const docId = new Date().toLocaleDateString("en-US").split("/").join("-");

  const docRef = fireStore.collection("daily-accounts").doc(docId);
  try {
    await fireStore.runTransaction(async (txn) => {
      const existing = await txn.get(docRef);
      if (existing.exists) {
        throw new Error(`${accountExistsErrorMessage}`);
      }
      txn.set(docRef, {
        ...data,
        id: docId,
        created: new Date(),
        updated: new Date(),
      });
    });
    return { docId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

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

const normalizeDailyAccount = (raw: any): DailyAccount => {
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
    createdAt: toMillis(raw?.created)
      ? new Date(toMillis(raw?.created)!)!.toLocaleString()
      : "",
    updatedAt: toMillis(raw?.updated)
      ? new Date(toMillis(raw?.updated)!)!.toLocaleString()
      : "",
  };
};

export async function getDailyAccountItem(docId?: string) {
  try {
    // 1) If docId provided, read that exact document (best option for doc IDs).
    if (docId) {
      const docSnap = await fireStore
        .collection("daily-accounts")
        .doc(docId)
        .get();
      if (!docSnap.exists) return { data: null, error: "Not found" };

      return { data: normalizeDailyAccount(docSnap.data()), error: null };
    }

    // 2) Otherwise, get the latest document by "created"
    const snap = await fireStore
      .collection("daily-accounts")
      .orderBy("created", "desc")
      .limit(1)
      .get();

    if (snap.empty) return { data: null, error: "Not found" };

    return { data: normalizeDailyAccount(snap.docs[0].data()), error: null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}
