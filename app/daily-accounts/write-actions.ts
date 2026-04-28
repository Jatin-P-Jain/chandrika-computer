"use server";

import { fireStore } from "@/firebase/server";
import {
  calculateTotals,
  deepMerge,
  DirtyFields,
  extractAllTags,
  getDirtyValues,
  normalizeDailyAccount,
} from "@/lib/server-utils";
import { UserData } from "@/types/user";
import { toDocId } from "@/lib/utils";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath, revalidateTag } from "next/cache";
import { DailyAccountInput } from "@/lib/daily-accounts/types";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";
import { validateDailyAccountInput } from "@/lib/daily-accounts/validation";
import { DailyAccount } from "@/types/daily-account";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";

export const createDailyAccountItem = async (
  data: DailyAccountInput,
  user: UserData | null,
  authtoken: string,
  accountExistsErrorMessage: string,
  docId?: string
) => {
  const access = await ensureAdminAccess(user, authtoken);
  if (!access.ok) {
    return { error: true, message: access.message };
  }

  const validation = validateDailyAccountInput(data);
  if (!validation.ok) {
    return { error: true, message: validation.message };
  }

  const documentId = docId ?? toDocId();
  const docRef = fireStore.collection("daily-accounts").doc(documentId);

  try {
    const done = startFirestoreMetric({
      source: "server",
      operation: "createDailyAccountItem",
      collection: "daily-accounts",
    });

    await fireStore.runTransaction(async (txn) => {
      const existing = await txn.get(docRef);
      const existingData = existing.data() as
        | {
            created?: unknown;
            createdBy?: { uid?: string | null } | null;
          }
        | undefined;
      const hasRealAccountOwner = Boolean(existingData?.createdBy?.uid);

      if (existing.exists && hasRealAccountOwner) {
        throw new Error(`${accountExistsErrorMessage}`);
      }

      const allTags = extractAllTags(validation.data);
      const totals = calculateTotals(validation.data);

      // Extract notes before saving (they go to subcollection)
      const { notes, ...accountData } = validation.data as any;

      txn.set(docRef, {
        ...accountData,
        id: documentId,
        createdBy: user,
        created: existingData?.created ?? Timestamp.now(),
        updatedBy: user,
        updated: Timestamp.now(),
        allTags,
        totalEarnings: totals.earnings,
        totalSpends: totals.spends,
        lastCalculated: Timestamp.now(),
        // notes array is NOT stored here - they go to subcollection
      });
    });

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { documentId },
    });

    revalidateTag("daily-account-list", "max");
    revalidateTag("daily-account-latest", "max");
    revalidateTag(`daily-account:${documentId}`, "max");
    revalidateTag("daily-account-filters", "max");

    return { docId: documentId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

export const updateDailyAccountItem = async (
  docId: string,
  data: DailyAccountInput,
  user: UserData | null,
  dirtyFields: DirtyFields,
  authtoken: string,
  notFoundErrorMessage = "Daily account not found"
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const patch = getDirtyValues(dirtyFields, data);

    if (!patch || Object.keys(patch).length === 0) {
      return { docId, noChanges: true };
    }

    const docRef = fireStore.collection("daily-accounts").doc(docId);
    const done = startFirestoreMetric({
      source: "server",
      operation: "updateDailyAccountItem",
      collection: "daily-accounts",
    });

    await fireStore.runTransaction(async (txn) => {
      const existingSnap = await txn.get(docRef);
      if (!existingSnap.exists) {
        throw new Error(notFoundErrorMessage);
      }

      const existingNormalized = normalizeDailyAccount(existingSnap.data());
      const { ...existingBase } = existingNormalized || {};
      const merged = deepMerge<DailyAccount>(existingBase, patch);

      const validation = validateDailyAccountInput(merged as DailyAccountInput);
      if (!validation.ok) {
        throw new Error(validation.message);
      }

      const allTags = extractAllTags(validation.data);
      const totals = calculateTotals(validation.data);

      // Extract notes before saving (they go to subcollection, not to document)
      const { notes, ...accountData } = validation.data as any;

      txn.update(docRef, {
        ...accountData,
        id: docId,
        updated: Timestamp.now(),
        updatedBy: user,
        allTags,
        totalEarnings: totals.earnings,
        totalSpends: totals.spends,
        // notes array is NOT stored here - they remain in subcollection
      });
    });

    done({ success: true, docsRead: 1, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidateTag("daily-account-list", "max");
    revalidateTag("daily-account-latest", "max");
    revalidateTag(`daily-account:${docId}`, "max");
    revalidateTag("daily-account-filters", "max");

    return { docId };
  } catch (e: unknown) {
    console.log("e", e instanceof Error ? e.message : e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
