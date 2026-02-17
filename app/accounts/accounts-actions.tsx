"use server";

import { fireStore } from "@/firebase/server";
import { toMillis } from "@/lib/server-utils";


export type AccountDoc = {
  id: string;
  name: string;
  createdAt: Date; // stored in Firestore as Timestamp
};

const ACCOUNTS_COL = "accounts";

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

  const now = new Date();

  // Basic duplicate protection (exact match).
  // Note: Firestore doesn't do case-insensitive equals without extra fields,
  // so we keep it minimal to avoid breaking existing flows.
  const existing = await fireStore
    .collection(ACCOUNTS_COL)
    .where("name", "==", trimmed)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    const d = doc.data() as AccountDoc;
    return {
      data: {
        id: doc.id,
        name: String(d.name ?? trimmed),
        createdAt:
          d.createdAt instanceof Date
            ? d.createdAt
            : new Date(toMillis(d.createdAt) ?? Date.now()),
      },
    };
  }

  // Create new account
  const ref = await fireStore.collection(ACCOUNTS_COL).add({
    name: trimmed,
    createdAt: now,
  });

  return { data: { id: ref.id, name: trimmed, createdAt: now } };
}
