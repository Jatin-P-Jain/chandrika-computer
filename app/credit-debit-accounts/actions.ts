"use server";

import { fireStore } from "@/firebase/server";
import { normalizeCreditDebitAccount } from "@/lib/server-utils";
import { UserData } from "@/types/user";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import {
  CreditDebitAccount,
  CreditDebitAccountInput,
  ReferencedDailyAccount,
} from "@/types/credit-debit-account";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";

type CreateAccountMeta = Partial<
  Pick<CreditDebitAccount, "description" | "type" | "createdBy" | "updatedBy">
>;

const ACCOUNTS_COL = "credit-debit-accounts";

function toTitleCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeAccountId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${Date.now()}`;
}

export async function listAccounts(): Promise<{ data: CreditDebitAccount[] }> {
  const snap = await fireStore.collection(ACCOUNTS_COL).orderBy("name", "asc").get();

  const data: CreditDebitAccount[] = snap.docs.map((doc) =>
    normalizeCreditDebitAccount({ id: doc.id, ...doc.data() })
  );

  return { data };
}

export async function createAccount(
  name: string,
  meta?: CreateAccountMeta
): Promise<{ data: CreditDebitAccount }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Account name is required");
  const normalizedName = toTitleCase(trimmed);

  const now = new Date();

  const existing = await fireStore
    .collection(ACCOUNTS_COL)
    .where("name", "==", normalizedName)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    const existingAccount = normalizeCreditDebitAccount({
      id: doc.id,
      ...doc.data(),
    });

    if (meta) {
      const nextAccount: Partial<CreditDebitAccount> = {
        name: normalizedName,
        description: meta.description ?? existingAccount.description ?? "",
        type: meta.type ?? existingAccount.type,
        createdBy: meta.createdBy ?? existingAccount.createdBy,
        updatedBy: meta.updatedBy ?? existingAccount.updatedBy,
        updated: now.toISOString(),
      };

      await fireStore.collection(ACCOUNTS_COL).doc(doc.id).set(
        nextAccount,
        { merge: true }
      );

      return {
        data: {
          ...existingAccount,
          ...nextAccount,
        },
      };
    }

    return {
      data: existingAccount,
    };
  }

  const normalizedId = normalizeAccountId(normalizedName);
  const account: CreditDebitAccount = {
    id: normalizedId,
    name: normalizedName,
    description: meta?.description ?? "",
    type: meta?.type ?? "credit",
    mentionsCount: 0,
    totalCredits: 0,
    totalDebits: 0,
    createdBy: meta?.createdBy ?? null,
    updatedBy: meta?.updatedBy ?? null,
    created: now.toISOString(),
    updated: now.toISOString(),
  };

  const ref = fireStore.collection(ACCOUNTS_COL).doc(normalizedId);
  await ref.set(account);

  return { data: account };
}

export async function listAccountMentions(
  accountId: string
): Promise<{ data: ReferencedDailyAccount[] }> {
  const snap = await fireStore
    .collection(ACCOUNTS_COL)
    .doc(accountId)
    .collection("mentions")
    .orderBy("dailyAccountId", "desc")
    .get();

  const data = snap.docs.map((doc) => {
    const raw = doc.data() as {
      dailyAccountId?: unknown;
      accountTypes?: unknown;
    };

    return {
      dailyAccountId:
        typeof raw.dailyAccountId === "string" ? raw.dailyAccountId : doc.id,
      accountTypes: Array.isArray(raw.accountTypes)
        ? raw.accountTypes.filter(
            (value): value is "credit" | "debit" =>
              value === "credit" || value === "debit"
          )
        : [],
    } satisfies ReferencedDailyAccount;
  });

  return { data };
}

/**
 * Calculate total credits and debits for a credit/debit account
 * by querying all daily accounts and summing amounts where this account is referenced
 */
async function calculateCreditDebitTotals(
  accountId: string
): Promise<{ totalCredits: number; totalDebits: number }> {
  let totalCredits = 0;
  let totalDebits = 0;

  try {
    // Get all daily accounts
    const snap = await fireStore.collection("daily-accounts").get();

    for (const doc of snap.docs) {
      const data = doc.data();

      // Sum credits where this account is referenced in creditItems
      const creditItems = Array.isArray(data.creditItems) ? data.creditItems : [];
      for (const item of creditItems) {
        if (item?.accountId === accountId) {
          totalCredits += typeof item.amount === "number" ? item.amount : 0;
        }
      }

      // Sum debits where this account is referenced in debitItems
      const debitItems = Array.isArray(data.debitItems) ? data.debitItems : [];
      for (const item of debitItems) {
        if (item?.accountId === accountId) {
          totalDebits += typeof item.amount === "number" ? item.amount : 0;
        }
      }
    }
  } catch (e) {
    console.error("Error calculating credit/debit totals:", e);
  }

  return { totalCredits, totalDebits };
}

export const updateCreditDebitAccount = async (
  docId: string,
  data: Partial<CreditDebitAccountInput>,
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const docRef = fireStore.collection(ACCOUNTS_COL).doc(docId);

    const done = startFirestoreMetric({
      source: "server",
      operation: "updateCreditDebitAccount",
      collection: ACCOUNTS_COL,
    });

    await fireStore.runTransaction(async (txn) => {
      const snap = await txn.get(docRef);
      if (!snap.exists) {
        throw new Error("Account not found");
      }

      // Recalculate totals based on referenced daily accounts
      const totals = await calculateCreditDebitTotals(docId);

      txn.update(docRef, {
        ...data,
        updatedBy: user,
        updated: Timestamp.now(),
        totalCredits: totals.totalCredits,
        totalDebits: totals.totalDebits,
      });
    });

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { docId },
    });

    revalidatePath(`/credit-debit-accounts`);
    updateTag("credit-debit-account-list");
    updateTag(`credit-debit-account:${docId}`);

    return { docId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

export const deleteCreditDebitAccount = async (
  docId: string,
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const docRef = fireStore.collection(ACCOUNTS_COL).doc(docId);

    const done = startFirestoreMetric({
      source: "server",
      operation: "deleteCreditDebitAccount",
      collection: ACCOUNTS_COL,
    });

    await fireStore.runTransaction(async (txn) => {
      const snap = await txn.get(docRef);
      if (!snap.exists) {
        throw new Error("Account not found");
      }

      txn.delete(docRef);
    });

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { docId },
    });

    revalidatePath(`/credit-debit-accounts`);
    updateTag("credit-debit-account-list");

    return { docId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};

/**
 * Sync totals for a credit/debit account based on all daily accounts that reference it
 */
export const syncCreditDebitAccountTotals = async (
  docId: string,
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const docRef = fireStore.collection(ACCOUNTS_COL).doc(docId);

    const done = startFirestoreMetric({
      source: "server",
      operation: "syncCreditDebitAccountTotals",
      collection: ACCOUNTS_COL,
    });

    const totals = await calculateCreditDebitTotals(docId);

    await docRef.update({
      totalCredits: totals.totalCredits,
      totalDebits: totals.totalDebits,
      updatedBy: user,
      updated: Timestamp.now(),
    });

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { docId },
    });

    updateTag("credit-debit-account-list");
    updateTag(`credit-debit-account:${docId}`);

    return { docId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
