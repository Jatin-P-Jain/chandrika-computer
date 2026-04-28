"use server";

import { fireStore } from "@/firebase/server";
import { UserData } from "@/types/user";
import { NoteItem } from "@/types/daily-notes";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath, revalidateTag } from "next/cache";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";

/**
 * Add a new note to a daily account (subcollection).
 * Notes are saved independently in daily-accounts/{docId}/notes/{noteId}
 * Does not create skeleton - notes can be created before daily account exists
 */
export const addNoteItem = async (
  docId: string,
  noteItem: NoteItem,
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "addNoteItem",
      collection: "daily-accounts",
    });

    const noteRef = fireStore
      .collection("daily-accounts")
      .doc(docId)
      .collection("notes")
      .doc(noteItem.id);

    await noteRef.set({
      id: noteItem.id,
      text: noteItem.text,
      status: noteItem.status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: user?.uid,
    });

    // 🔥 Create or update daily-account with ALL required fields
    const accountRef = fireStore.collection("daily-accounts").doc(docId);
    const accountSnap = await accountRef.get();

    const requiredFields = {
      id: docId,
      fixed: { sd: 0, sc: 0, fs: 0, flexnCard: 0, otherFixedExpenses: [] },
      earnings: { netIncome: 0, otherIncomes: [] },
      businessExpenses: [],
      dailySpends: [],
      creditItems: [],
      debitItems: [],
      notes: [],
      allTags: [],
      totalEarnings: 0,
      totalSpends: 0,
      totalCashCollected: 0,
      createdBy: accountSnap.data()?.createdBy ?? null,
      updatedBy: user,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      lastNotedAt: Timestamp.now(),
    };

    if (accountSnap.exists) {
      // Update with merge: preserve existing data and add/update required fields
      const existingData = accountSnap.data();
      await accountRef.set(
        {
          ...existingData,
          ...requiredFields,
          created: existingData?.created || requiredFields.created,
        },
        { merge: true }
      );
    } else {
      // Create new document with all required fields
      await accountRef.set(requiredFields, { merge: true });
    }

    done({ success: true, docsRead: 0, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidatePath(`/daily-accounts`); // 🔥 Revalidate listing page when notes are added
    revalidateTag(`daily-account:${docId}`, "max");

    return { success: true, noteId: noteItem.id };
  } catch (e: unknown) {
    console.error("Error adding note:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add note",
    };
  }
};

/**
 * Update the status of a note (open -> done -> dismissed)
 */
export const updateNoteStatus = async (
  docId: string,
  noteId: string,
  newStatus: "open" | "done" | "dismissed",
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "updateNoteStatus",
      collection: "daily-accounts",
    });

    const noteRef = fireStore
      .collection("daily-accounts")
      .doc(docId)
      .collection("notes")
      .doc(noteId);

    await noteRef.update({
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    done({ success: true, docsRead: 0, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidatePath(`/daily-accounts`); // 🔥 Revalidate listing page when note status changes
    revalidateTag(`daily-account:${docId}`, "max");

    return { success: true };
  } catch (e: unknown) {
    console.error("Error updating note status:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update note",
    };
  }
};

/**
 * Dismiss a note (move to dismissed section)
 */
export const dismissNote = async (
  docId: string,
  noteId: string,
  user: UserData | null,
  authtoken: string
) => {
  return updateNoteStatus(docId, noteId, "dismissed", user, authtoken);
};

/**
 * Restore a dismissed note (move back to open)
 */
export const undoDismissNote = async (
  docId: string,
  noteId: string,
  user: UserData | null,
  authtoken: string
) => {
  return updateNoteStatus(docId, noteId, "open", user, authtoken);
};

/**
 * Delete a note completely
 */
export const deleteNote = async (
  docId: string,
  noteId: string,
  user: UserData | null,
  authtoken: string
) => {
  try {
    const access = await ensureAdminAccess(user, authtoken);
    if (!access.ok) {
      return { error: true, message: access.message };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "deleteNote",
      collection: "daily-accounts",
    });

    const noteRef = fireStore
      .collection("daily-accounts")
      .doc(docId)
      .collection("notes")
      .doc(noteId);

    await noteRef.delete();

    done({ success: true, docsRead: 0, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidatePath(`/daily-accounts`); // 🔥 Revalidate listing page when note is deleted
    revalidateTag(`daily-account:${docId}`, "max");

    return { success: true };
  } catch (e: unknown) {
    console.error("Error deleting note:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete note",
    };
  }
};
