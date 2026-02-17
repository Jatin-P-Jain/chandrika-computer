// app/daily-accounts/notes-actions.ts
"use server";

import { fireStore } from "@/firebase/server";
import { toMillis } from "@/lib/server-utils";
import type {
  DailyNoteDoc,
  NoteItem,
  NoteItemStatus,
} from "@/types/daily-notes";

function notesDocRef(docId: string) {
  return fireStore.collection("notes").doc(docId);
}

function randomId() {
  // good enough for UI ids; you can swap to crypto.randomUUID() if desired
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getDailyNote(
  docId: string,
): Promise<{ data: DailyNoteDoc }> {
  const ref = notesDocRef(docId);
  const snap = await ref.get();

  if (!snap.exists) {
    const now = new Date();
    return {
      data: { docId, items: [], createdAt: now, updatedAt: now },
    };
  }

  const data = snap.data() as DailyNoteDoc;

  const items: NoteItem[] = (data.items ?? []).map((it) => {
    console.log({ it });

    return {
      id: it.id,
      text: it.text,
      status: it.status,
      createdAt:
        it.createdAt instanceof Date
          ? it.createdAt
          : new Date(toMillis(it.createdAt) ?? Date.now()),
      updatedAt:
        it.updatedAt instanceof Date
          ? it.updatedAt
          : new Date(toMillis(it.updatedAt) ?? Date.now()),
    };
  });
  console.log({ items });

  return {
    data: {
      docId,
      items,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    },
  };
}

export async function addNoteItem(docId: string, text: string) {
  const ref = notesDocRef(docId);
  const now = new Date();

  const newItem: NoteItem = {
    id: randomId(),
    text: text.trim(),
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  await fireStore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      const payload: DailyNoteDoc = {
        docId,
        items: [newItem],
        createdAt: now,
        updatedAt: now,
      };
      tx.set(ref, payload);
      return;
    }

    const data = snap.data() as DailyNoteDoc;
    const items: NoteItem[] = Array.isArray(data.items) ? data.items : [];
    tx.update(ref, {
      items: [...items, newItem],
      updatedAt: now,
    });
  });

  return { data: newItem };
}

export async function setNoteItemStatus(
  docId: string,
  itemId: string,
  status: NoteItemStatus,
) {
  const ref = notesDocRef(docId);
  const now = new Date();

  await fireStore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      // no doc yet -> nothing to update
      return;
    }

    const data = snap.data() as DailyNoteDoc;
    const items: NoteItem[] = Array.isArray(data.items) ? data.items : [];

    const next = items.map((it) => {
      if (it.id !== itemId) return it;
      return { ...it, status, updatedAt: now };
    });

    tx.update(ref, { items: next, updatedAt: now });
  });

  return { data: { itemId, status, updatedAt: now } };
}

export async function dismissNoteItem(docId: string, itemId: string) {
  return setNoteItemStatus(docId, itemId, "dismissed");
}
