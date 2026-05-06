import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const updateAccountCreatorIndex = onDocumentWritten(
  "daily-accounts/{docId}",
  async (event) => {
    const { before, after } = event.data;

    // 🔥 CREATE: newData exists, oldData doesn't → +1
    if (after.exists && !before.exists) {
      const newData = after.data();
      const createdBy = newData.createdBy;
      const id = createdBy?.uid || createdBy?.email;

      if (!id) return;

      await db
        .collection("daily_account_creators")
        .doc(id)
        .set(
          {
            uid: createdBy.uid || id,
            displayName: createdBy.displayName || id,
            email: createdBy.email || null,
            photoUrl: createdBy.photoUrl || null,
            count: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    }

    // 🔥 DELETE: newData doesn't exist, oldData does → -1
    if (!after.exists && before.exists) {
      const oldData = before.data();
      const createdBy = oldData.createdBy;
      const id = createdBy?.uid || createdBy?.email;

      if (!id) return;

      await db
        .collection("daily_account_creators")
        .doc(id)
        .update({
          count: FieldValue.increment(-1),
        })
        .catch(() => {});
    }

    // 🔥 UPDATES: newData && oldData → DO NOTHING ✅
  },
);

export const updateAccountUpdaterIndex = onDocumentWritten(
  "daily-accounts/{docId}",
  async (event) => {
    const { before, after } = event.data;
    const newData = after.exists ? after.data() : null;
    const oldData = before.exists ? before.data() : null;

    const newUpdater = newData?.updatedBy;
    const oldUpdater = oldData?.updatedBy;
    const newId = newUpdater?.uid || newUpdater?.email;
    const oldId = oldUpdater?.uid || oldUpdater?.email;

    // 🔥 For updates, keep counts accurate when updatedBy changes.
    // Same updater => no-op. old->new => decrement old, increment new.
    if (before.exists && after.exists) {
      if (oldId === newId) return;

      const batch = db.batch();

      if (oldId) {
        batch.set(
          db.collection("daily_account_updaters").doc(oldId),
          {
            count: FieldValue.increment(-1),
            lastUpdated: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (newId) {
        batch.set(
          db.collection("daily_account_updaters").doc(newId),
          {
            uid: newUpdater.uid || newId,
            displayName: newUpdater.displayName || newId,
            email: newUpdater.email || null,
            photoUrl: newUpdater.photoUrl || null,
            count: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      await batch.commit().catch(() => {});
      return;
    }

    // 🔥 On delete, decrement the last known updater.
    if (!after.exists && before.exists && oldId) {
      await db
        .collection("daily_account_updaters")
        .doc(oldId)
        .update({
          count: FieldValue.increment(-1),
        })
        .catch(() => {});
    }
  },
);

function extractAccountIds(data) {
  const ids = new Set();
  if (Array.isArray(data?.creditItems)) {
    data.creditItems.forEach((item) => {
      if (item.accountId) ids.add(item.accountId);
    });
  }
  if (Array.isArray(data?.debitItems)) {
    data.debitItems.forEach((item) => {
      if (item.accountId) ids.add(item.accountId);
    });
  }
  return [...ids];
}

export const updateAccountMentionsIndex = onDocumentWritten(
  "daily-accounts/{docId}",
  async (event) => {
    const { before, after } = event.data;
    const docId = event.params.docId;

    const newData = after.exists ? after.data() : null;
    const oldData = before.exists ? before.data() : null;

    const newIds = extractAccountIds(newData);
    const oldIds = extractAccountIds(oldData);

    const added = newIds.filter((id) => !oldIds.includes(id));
    const removed = oldIds.filter((id) => !newIds.includes(id));

    const batch = db.batch();

    added.forEach((accountId) => {
      batch.set(
        db.collection("accounts").doc(accountId),
        {
          mentions: FieldValue.arrayUnion(docId),
          mentionsCount: FieldValue.increment(1),
        },
        { merge: true },
      );
    });

    removed.forEach((accountId) => {
      batch.set(
        db.collection("accounts").doc(accountId),
        {
          mentions: FieldValue.arrayRemove(docId),
          mentionsCount: FieldValue.increment(-1),
        },
        { merge: true },
      );
    });

    await batch.commit().catch(() => {});
  },
);

function extractAllTags(data) {
  const tags = [];

  // Earnings → otherIncomes tags
  const earnings = data?.earnings;
  if (earnings?.otherIncomes?.length) {
    earnings.otherIncomes.forEach((income) => {
      if (Array.isArray(income.tags)) {
        tags.push(...income.tags);
      }
    });
  }

  // Business Expenses tags
  if (Array.isArray(data?.businessExpenses)) {
    data.businessExpenses.forEach((expense) => {
      if (Array.isArray(expense.tags)) {
        tags.push(...expense.tags);
      }
    });
  }

  // Daily Spends tags
  if (Array.isArray(data?.dailySpends)) {
    data.dailySpends.forEach((spend) => {
      if (Array.isArray(spend.tags)) {
        tags.push(...spend.tags);
      }
    });
  }

  return tags;
}

export const updateAccountTagsIndex = onDocumentWritten(
  "daily-accounts/{docId}",
  async (event) => {
    const { before, after } = event.data;
    const newData = after.exists ? after.data() : null;
    const oldData = before.exists ? before.data() : null;

    const newTags = extractAllTags(newData);
    const oldTags = extractAllTags(oldData);

    const batch = db.batch();

    // Add new tags
    newTags.forEach((tag) => {
      if (!oldTags.includes(tag)) {
        batch.set(
          db.collection("daily_account_tags").doc(tag),
          {
            label: tag,
            count: FieldValue.increment(1),
            lastUpdated: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    });

    // Remove old tags
    oldTags.forEach((tag) => {
      if (!newTags.includes(tag)) {
        batch.update(db.collection("daily_account_tags").doc(tag), {
          count: FieldValue.increment(-1),
        });
      }
    });

    await batch.commit().catch(() => {});
  },
);
