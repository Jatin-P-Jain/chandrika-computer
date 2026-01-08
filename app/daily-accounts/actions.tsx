"use server";

import { auth, fireStore } from "@/firebase/server";
import { revalidatePath } from "next/cache";
import {
  deepMerge,
  DirtyFields,
  getDirtyValues,
  normalizeDailyAccount,
} from "@/lib/server-utils";
import { dailySchema } from "@/schema/dailay-page.schema";
import { DailyAccount } from "@/types/daily-account";
import { UserData } from "@/types/user";
import { toDocId } from "@/lib/utils";

export const createDailyAccountItem = async (
  data: Omit<
    DailyAccount,
    "id" | "created" | "updated" | "createdBy" | "updatedBy"
  >,
  user: UserData | null,
  authtoken: string,
  accountExistsErrorMessage: string
) => {
  if (!user) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }
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

  const docId = toDocId();

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
        createdBy: user,
        updatedBy: user,
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

export const updateDailyAccountItem = async (
  docId: string,
  data: Omit<
    DailyAccount,
    "id" | "created" | "updated" | "createdBy" | "updatedBy"
  >,
  user: UserData | null,
  dirtyFields: DirtyFields,
  authtoken: string,
  notFoundErrorMessage = "Daily account not found"
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

      // Normalize timestamps etc. (your helper)
      const existingNormalized = normalizeDailyAccount(existingSnap.data());

      // Remove meta fields so we validate the same shape as `dailySchema` expects (your create validates without created/updated).
      const { created, updated, id, ...existingBase } = (existingNormalized ||
        {}) as any;

      // IMPORTANT: deep merge, because shallow spread would drop nested required fields. [web:165][web:168]
      const merged = deepMerge<DailyAccount>(existingBase, patch);

      // Validate final merged object against the *full* schema (not partial).
      const validation = dailySchema.safeParse(merged);
      if (!validation.success) {
        throw new Error(
          validation.error.issues[0]?.message || "An error occurred"
        );
      }

      // Write back full merged payload + meta.
      txn.update(docRef, {
        ...validation.data,
        id: docId,
        updated: new Date(),
        updatedBy: user,
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
