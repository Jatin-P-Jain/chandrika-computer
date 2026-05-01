"use server";

import { fireStore } from "@/firebase/server";
import { toMillis } from "@/lib/server-utils";

export type AccountDoc = {
  id: string;
  name: string;
  createdAt: Date; // stored in Firestore as Timestamp
  mentions?: string[]; // daily-account IDs where this account was tagged
  mentionsCount?: number; // total count of daily-accounts referencing this account
};

const ACCOUNTS_COL = "accounts";

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

/** "Abc XYZ 123" → "abc-xyz-123" */
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

export async function listAccounts(): Promise<{ data: AccountDoc[] }> {
  const snap = await fireStore
    .collection(ACCOUNTS_COL)
    .orderBy("name", "asc")
    .get();

  const data: AccountDoc[] = snap.docs.map((doc) => {
    const d = doc.data() as AccountDoc;
    return {
      id: doc.id,
      name: String(d.name ?? ""),
      createdAt:
        d.createdAt instanceof Date
          ? d.createdAt
          : new Date(toMillis(d.createdAt) ?? Date.now()),
    };
  });

  return { data };
}

export async function createAccount(
  name: string,
): Promise<{ data: AccountDoc }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Account name is required");
  const normalizedName = toTitleCase(trimmed);

  const now = new Date();

  // Basic duplicate protection (exact match).
  // Note: Firestore doesn't do case-insensitive equals without extra fields,
  // so we keep it minimal to avoid breaking existing flows.
  const existing = await fireStore
    .collection(ACCOUNTS_COL)
    .where("name", "==", normalizedName)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    const d = doc.data() as AccountDoc;
    return {
      data: {
        id: doc.id,
        name: String(d.name ?? normalizedName),
        createdAt:
          d.createdAt instanceof Date
            ? d.createdAt
            : new Date(toMillis(d.createdAt) ?? Date.now()),
      },
    };
  }

  // Create new account with normalized slug ID
  const normalizedId = normalizeAccountId(normalizedName);
  const ref = fireStore.collection(ACCOUNTS_COL).doc(normalizedId);
  await ref.set({
    name: normalizedName,
    createdAt: now,
  });

  return { data: { id: normalizedId, name: normalizedName, createdAt: now } };
}
