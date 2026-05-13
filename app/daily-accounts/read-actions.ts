"use server";

import { fireStore } from "@/firebase/server";
import { normalizeDailyAccount } from "@/lib/server-utils";
import { FilterTag, FilterUser } from "@/types/filters";
import { unstable_cache } from "next/cache";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";
import { NoteItem, NoteItemStatus } from "@/types/daily-notes";
import { toMillis } from "@/lib/server-utils";

/**
 * Load notes from subcollection for a given daily account
 */
async function loadNotesForAccount(docId: string): Promise<NoteItem[]> {
  try {
    const notesSnap = await fireStore
      .collection("daily-accounts")
      .doc(docId)
      .collection("notes")
      .orderBy("createdAt", "asc")
      .get();

    return notesSnap.docs.map((doc) => {
      const data = doc.data();
      const status: NoteItemStatus =
        data.status === "open" ||
        data.status === "done" ||
        data.status === "dismissed"
          ? data.status
          : "open";

      const createdMillis = toMillis(data.createdAt);
      const updatedMillis = toMillis(data.updatedAt);

      return {
        id: String(data.id || ""),
        text: String(data.text || ""),
        status,
        createdAt: createdMillis ? new Date(createdMillis) : new Date(0),
        updatedAt: updatedMillis ? new Date(updatedMillis) : new Date(0),
      } as NoteItem;
    });
  } catch (e) {
    console.warn("Failed to load notes for account:", e);
    return [];
  }
}

const getDailyAccountByIdCached = (docId: string) =>
  unstable_cache(
    async () => {
      const done = startFirestoreMetric({
        source: "server",
        operation: "getDailyAccountItemById",
        collection: "daily-accounts",
      });

      const docSnap = await fireStore
        .collection("daily-accounts")
        .doc(docId)
        .get();

      if (!docSnap.exists) {
        done({
          success: true,
          docsRead: 0,
          details: { docId },
        });
        return { data: null, error: "Not found" as const };
      }

      // Load notes from subcollection
      const notes = await loadNotesForAccount(docId);

      const normalized = normalizeDailyAccount(docSnap.data());
      const result = {
        ...normalized,
        notes, // Include notes from subcollection (always an array, empty if none)
      };

      done({
        success: true,
        docsRead: 1 + notes.length, // Account + all notes
        details: { docId },
      });

      return { data: result, error: null };
    },
    ["daily-account-by-id", docId],
    {
      tags: [
        "daily-account-list",
        "daily-account-latest",
        `daily-account:${docId}`,
      ],
      revalidate: 30,
    }
  )();

const getLatestDailyAccountCached = unstable_cache(
  async () => {
    const done = startFirestoreMetric({
      source: "server",
      operation: "getLatestDailyAccountItem",
      collection: "daily-accounts",
    });

    const snap = await fireStore
      .collection("daily-accounts")
      .orderBy("id", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      done({ success: true, docsRead: 0 });
      return { data: null, error: "Not found" as const };
    }

    const docSnap = snap.docs[0];
    const notes = await loadNotesForAccount(docSnap.id);

    const normalized = normalizeDailyAccount(docSnap.data());
    const result = {
      ...normalized,
      notes, // Include notes from subcollection
    };

    done({
      success: true,
      docsRead: 1 + notes.length, // Account + all notes
    });

    return { data: result, error: null };
  },
  ["daily-account-latest"],
  {
    tags: ["daily-account-list", "daily-account-latest"],
    revalidate: 30,
  }
);

export async function getDailyAccountItem(docId?: string) {
  try {
    if (docId) {
      return await getDailyAccountByIdCached(docId);
    }

    return await getLatestDailyAccountCached();
  } catch (e: unknown) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

const getFilterOptionsCached = unstable_cache(
  async (): Promise<{
    creators: FilterUser[];
    updaters: FilterUser[];
    tags: FilterTag[];
  }> => {
    const done = startFirestoreMetric({
      source: "server",
      operation: "getFilterOptions",
      collection:
        "daily_account_creators,daily_account_updaters,daily_account_tags",
    });

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

    done({
      success: true,
      docsRead: creatorsSnap.size + updatersSnap.size + tagsSnap.size,
    });

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
  },
  ["daily-account-filter-options"],
  {
    tags: ["daily-account-filters"],
    revalidate: 300,
  }
);

export async function getFilterOptions(): Promise<{
  creators: FilterUser[];
  updaters: FilterUser[];
  tags: FilterTag[];
}> {
  try {
    return await getFilterOptionsCached();
  } catch (error) {
    console.error("Filter fetch error:", error);
    return { creators: [], updaters: [], tags: [] };
  }
}
