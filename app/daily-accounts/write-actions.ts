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
import { revalidatePath, updateTag } from "next/cache";
import { DailyAccountInput } from "@/lib/daily-accounts/types";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";
import { validateDailyAccountInput } from "@/lib/daily-accounts/validation";
import { DailyAccount, AuditEvent } from "@/types/daily-account";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";
import { FieldValue } from "@/firebase/server";

function getEmptyDailyAccountInput(): DailyAccountInput {
  return {
    fixed: { sd: 0, sc: 0, fs: 0, flexnCard: 0, otherFixedExpenses: [] },
    earnings: { netIncome: 0, otherIncomes: [] },
    businessExpenses: [],
    dailySpends: [],
    creditItems: [],
    debitItems: [],
    totalCashCollected: 0,
  };
}

function toDailyAccountInput(account?: DailyAccount | null): DailyAccountInput {
  if (!account) return getEmptyDailyAccountInput();

  return {
    fixed: account.fixed,
    earnings: account.earnings,
    businessExpenses: account.businessExpenses,
    dailySpends: account.dailySpends,
    creditItems: account.creditItems,
    debitItems: account.debitItems,
    totalCashCollected: account.totalCashCollected,
  };
}

export const saveDailyAccountDraft = async (
  docId: string,
  patch: Partial<DailyAccountInput>,
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const docRef = fireStore.collection("daily-accounts").doc(docId);
    const done = startFirestoreMetric({
      source: "server",
      operation: "saveDailyAccountDraft",
      collection: "daily-accounts",
    });

    await fireStore.runTransaction(async (txn) => {
      const existingSnap = await txn.get(docRef);
      const existingNormalized = existingSnap.exists
        ? normalizeDailyAccount(existingSnap.data())
        : undefined;
      const merged = deepMerge<DailyAccountInput>(
        toDailyAccountInput(existingNormalized),
        patch
      );
      const allTags = extractAllTags(merged);
      const totals = calculateTotals(merged);
      const currentStatus = existingNormalized?.status;
      const nextStatus =
        currentStatus === "saved" || currentStatus === "edited"
          ? "edited"
          : "draft";

      const draftAuditEvent: AuditEvent = {
        type: "account_created",
        action: "Draft Saved",
        entity: "account",
        user,
        timestamp: new Date().toISOString(),
      };

      txn.set(
        docRef,
        {
          ...merged,
          id: docId,
          status: nextStatus,
          created: existingSnap.get("created") ?? Timestamp.now(),
          createdBy: existingSnap.get("createdBy") ?? null,
          updated: Timestamp.now(),
          updatedBy: user,
          allTags,
          totalEarnings: totals.earnings,
          totalSpends: totals.spends,
          ...(existingSnap.exists
            ? {}
            : { auditTrail: FieldValue.arrayUnion(draftAuditEvent) }),
        },
        { merge: true }
      );
    });

    done({ success: true, docsRead: 1, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidatePath(`/daily-accounts`);
    updateTag("daily-account-list");
    updateTag("daily-account-latest");
    updateTag(`daily-account:${docId}`);
    updateTag("daily-account-filters");

    return { docId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

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
            status?: "draft" | "saved" | "edited";
            createdBy?: { uid?: string | null } | null;
            auditTrail?: unknown[];
          }
        | undefined;

      // Only block if a fully-saved/edited account already exists.
      // A draft (created by readings/notes saves) can be completed/finalized.
      const existingStatus = existingData?.status;
      const isAlreadyFinalized =
        existingStatus === "saved" || existingStatus === "edited";

      if (existing.exists && isAlreadyFinalized) {
        throw new Error(`${accountExistsErrorMessage}`);
      }

      const allTags = extractAllTags(validation.data);
      const totals = calculateTotals(validation.data);

      const accountData = validation.data;

      const auditEvent: AuditEvent = {
        type: "account_created",
        action: "Daily Account Saved",
        entity: "account",
        user,
        timestamp: new Date().toISOString(),
      };

      const existingAuditTrail = Array.isArray(existingData?.auditTrail)
        ? existingData.auditTrail
        : [];

      // Initialize auditTrail array
      const baseData = {
        ...accountData,
        id: documentId,
        status: "saved" as const,
        // Preserve createdBy from an existing draft (set by readings/notes saves).
        // Fall back to the current user if no prior doc exists.
        createdBy: existingData?.createdBy ?? user,
        created: existingData?.created ?? Timestamp.now(),
        updatedBy: user,
        updated: Timestamp.now(),
        allTags,
        totalEarnings: totals.earnings,
        totalSpends: totals.spends,
        lastCalculated: Timestamp.now(),
        auditTrail: [...existingAuditTrail, auditEvent],
        // notes array is NOT stored here - they go to subcollection
      };

      txn.set(docRef, baseData);
    });

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { documentId },
    });

    revalidatePath(`/daily-accounts/${documentId}`);
    revalidatePath(`/daily-accounts`);
    updateTag("daily-account-list");
    updateTag("daily-account-latest");
    updateTag(`daily-account:${documentId}`);
    updateTag("daily-account-filters");

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

      const accountData = validation.data;

      const auditEvent: AuditEvent = {
        type: "account_updated",
        action: "Daily Account Updated",
        entity: "account",
        user,
        timestamp: new Date().toISOString(),
      };

      txn.update(docRef, {
        ...accountData,
        id: docId,
        status: "edited",
        updated: Timestamp.now(),
        updatedBy: user,
        allTags,
        totalEarnings: totals.earnings,
        totalSpends: totals.spends,
        auditTrail: FieldValue.arrayUnion(auditEvent),
        // notes array is NOT stored here - they remain in subcollection
      });
    });

    done({ success: true, docsRead: 1, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    updateTag("daily-account-list");
    updateTag("daily-account-latest");
    updateTag(`daily-account:${docId}`);
    updateTag("daily-account-filters");

    return { docId };
  } catch (e: unknown) {
    console.log("e", e instanceof Error ? e.message : e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
