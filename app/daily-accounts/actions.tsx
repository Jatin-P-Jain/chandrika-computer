"use server";

import { auth, fireStore } from "@/firebase/server";
import { revalidatePath } from "next/cache";
import {
  calculateTotals,
  deepMerge,
  DirtyFields,
  extractAllTags,
  getDirtyValues,
  normalizeDailyAccount,
} from "@/lib/server-utils";
import { dailySchema } from "@/schema/daily-page.schema";
import { DailyAccount } from "@/types/daily-account";
import { UserData } from "@/types/user";
import { toDocId } from "@/lib/utils";
import { cache } from "react";
import { FilterTag, FilterUser } from "@/types/filters";
import { Timestamp } from "firebase-admin/firestore";

export const createDailyAccountItem = async (
  data: Omit<
    DailyAccount,
    | "id"
    | "created"
    | "updated"
    | "createdBy"
    | "updatedBy"
    | "allTags"
    | "accountsCache"
    | "totalEarnings"
    | "totalSpends"
  >,
  user: UserData | null,
  authtoken: string,
  accountExistsErrorMessage: string,
  docId?: string,
) => {
  if (!user) {
    return { error: true, message: "Unauthorized" };
  }

  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return { error: true, message: "Unauthorized" };
  }

  const validation = dailySchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const documentId = docId ?? toDocId();
  const docRef = fireStore.collection("daily-accounts").doc(documentId);

  try {
    await fireStore.runTransaction(async (txn) => {
      const existing = await txn.get(docRef);
      if (existing.exists) {
        throw new Error(`${accountExistsErrorMessage}`);
      }

      // 🔥 COMPUTE totals and tags BEFORE saving
      const allTags = extractAllTags(validation.data);
      const totals = calculateTotals(validation.data);

      txn.set(docRef, {
        ...validation.data,
        id: documentId,
        createdBy: user,
        created: Timestamp.now(),
        updated: Timestamp.now(),
        allTags,
        totalEarnings: totals.earnings,
        totalSpends: totals.spends,
        lastCalculated: Timestamp.now(),
      });
    });

    return { docId: documentId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

export async function getDailyAccountItem(docId?: string) {
  try {
    if (docId) {
      const docSnap = await fireStore
        .collection("daily-accounts")
        .doc(docId)
        .get();

      if (!docSnap.exists) return { data: null, error: "Not found" };
      return { data: normalizeDailyAccount(docSnap.data()), error: null };
    }

    const snap = await fireStore
      .collection("daily-accounts")
      .orderBy("created", "desc")
      .limit(1)
      .get();

    if (snap.empty) return { data: null, error: "Not found" };
    return { data: normalizeDailyAccount(snap.docs[0].data()), error: null };
  } catch (e: unknown) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export const updateDailyAccountItem = async (
  docId: string,
  data: Omit<
    DailyAccount,
    | "id"
    | "created"
    | "updated"
    | "createdBy"
    | "updatedBy"
    | "allTags"
    | "accountsCache"
    | "totalEarnings"
    | "totalSpends"
  >,
  user: UserData | null,
  dirtyFields: DirtyFields,
  authtoken: string,
  notFoundErrorMessage = "Daily account not found",
) => {
  try {
    if (!user) {
      return { error: true, message: "Unauthorized" };
    }

    const verifiedToken = await auth.verifyIdToken(authtoken);
    if (!verifiedToken.admin) {
      return { error: true, message: "Unauthorized" };
    }

    const patch = getDirtyValues(dirtyFields, data);

    if (!patch || Object.keys(patch).length === 0) {
      return { docId, noChanges: true };
    }

    const docRef = fireStore.collection("daily-accounts").doc(docId);

    await fireStore.runTransaction(async (txn) => {
      const existingSnap = await txn.get(docRef);
      if (!existingSnap.exists) {
        throw new Error(notFoundErrorMessage);
      }

      const existingNormalized = normalizeDailyAccount(existingSnap.data());
      const { ...existingBase } = existingNormalized || {};

      // 🔥 DEEP MERGE first
      const merged = deepMerge<DailyAccount>(existingBase, patch);

      // Validate merged doc
      const validation = dailySchema.safeParse(merged);
      if (!validation.success) {
        throw new Error(
          validation.error.issues[0]?.message || "An error occurred",
        );
      }

      // 🔥 COMPUTE totals/tags from validated MERGED data
      const allTags = extractAllTags(validation.data);
      const totals = calculateTotals(validation.data);

      // 🔥 Write FULL document with computed fields
      txn.update(docRef, {
        ...validation.data,
        id: docId,
        updated: Timestamp.now(),
        updatedBy: user,
        allTags,
        totalEarnings: totals.earnings,
        totalSpends: totals.spends,
      });
    });

    revalidatePath(`/daily-accounts/${docId}`);
    return { docId };
  } catch (e: unknown) {
    console.log("e", e instanceof Error ? e.message : e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

export const getFilterOptions = cache(
  async (): Promise<{
    creators: FilterUser[];
    updaters: FilterUser[];
    tags: FilterTag[];
  }> => {
    try {
      const [creatorsSnap, updatersSnap, tagsSnap] = await Promise.all([
        fireStore
          .collection("daily_account_creators")
          .orderBy("count", "desc")
          .limit(50)
          .get(),

        fireStore
          .collection("daily_account_updaters")
          .orderBy("count", "desc")
          .limit(50)
          .get(),

        fireStore
          .collection("daily_account_tags")
          .orderBy("count", "desc")
          .limit(100)
          .get(),
      ]);

      const creators = creatorsSnap.docs.map((doc) => ({
        label: doc.data().displayName,
        photoUrl: doc.data().photoUrl || null,
        email: doc.data().email || null,
        value: doc.id,
        count: doc.data().count || 0,
      }));

      const updaters = updatersSnap.docs.map((doc) => ({
        label: doc.data().displayName,
        photoUrl: doc.data().photoUrl || null,
        email: doc.data().email || null,
        value: doc.id,
        count: doc.data().count || 0,
      }));

      const tags = tagsSnap.docs.map((doc) => ({
        label: doc.data().label,
        value: doc.id,
        count: doc.data().count || 0,
      }));

      return { creators, updaters, tags };
    } catch (error) {
      console.error("Filter fetch error:", error);
      return { creators: [], updaters: [], tags: [] };
    }
  },
);
