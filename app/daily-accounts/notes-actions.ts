"use server";

import { fireStore } from "@/firebase/server";
import { UserData } from "@/types/user";
import { NoteItem } from "@/types/daily-notes";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";
import { AuditEvent } from "@/types/daily-account";
import { FieldValue } from "@/firebase/server";

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

    const now = Timestamp.now();

    const requiredFields = {
      id: docId,
      status:
        (accountSnap.data()?.status as "draft" | "saved" | "edited") ?? "draft",
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
      createdBy: accountSnap.data()?.createdBy ?? user,
      updatedBy: user,
      created: accountSnap.data()?.created ?? now,
      updated: now,
      lastNotedAt: now,
    };

    const auditTimestamp = new Date().toISOString();
    const notesSavedEvent: AuditEvent = {
      type: "notes_saved",
      action: "Notes Saved",
      entity: "notes",
      user,
      timestamp: auditTimestamp,
    };

    const accountDraftEvent: AuditEvent = {
      type: "account_created",
      action: "Draft Saved",
      entity: "account",
      user,
      timestamp: auditTimestamp,
    };

    await accountRef.set(
      {
        ...requiredFields,
        auditTrail: FieldValue.arrayUnion(
          ...(accountSnap.exists
            ? [notesSavedEvent]
            : [accountDraftEvent, notesSavedEvent])
        ),
      },
      { merge: true }
    );

    done({ success: true, docsRead: 0, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidatePath(`/daily-accounts`);
    updateTag("daily-account-list");
    updateTag("daily-account-latest");
    updateTag(`daily-account:${docId}`);

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

    const accountRef = fireStore.collection("daily-accounts").doc(docId);
    const notesUpdatedEvent: AuditEvent = {
      type: "notes_updated",
      action: "Notes Updated",
      entity: "notes",
      user,
      timestamp: new Date().toISOString(),
    };

    await accountRef.set(
      {
        updated: Timestamp.now(),
        updatedBy: user,
        lastNotedAt: Timestamp.now(),
        auditTrail: FieldValue.arrayUnion(notesUpdatedEvent),
      },
      { merge: true }
    );

    done({ success: true, docsRead: 0, docsWritten: 1, details: { docId } });

    revalidatePath(`/daily-accounts/${docId}`);
    revalidatePath(`/daily-accounts`);
    updateTag("daily-account-list");
    updateTag("daily-account-latest");
    updateTag(`daily-account:${docId}`);

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
    revalidatePath(`/daily-accounts`);
    updateTag("daily-account-list");
    updateTag("daily-account-latest");
    updateTag(`daily-account:${docId}`);

    return { success: true };
  } catch (e: unknown) {
    console.error("Error deleting note:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete note",
    };
  }
};
