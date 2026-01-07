"use server";

import { auth, fireStore } from "@/firebase/server";
import { dailySchema } from "@/schema/dailay-page.schema";
import { DailyAccount } from "@/types/daily-account";

export const createDailyAccountItem = async (
  data: DailyAccount,
  authtoken: string,
  accountExistsErrorMessage: string
) => {
  const verifiedToken = await auth.verifyIdToken(authtoken);
  if (!verifiedToken.admin) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  const validation = dailySchema.safeParse(data);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message || "An error occurred",
    };
  }

  const docId = new Date().toLocaleDateString("en-US").split("/").join("-");

  const docRef = fireStore.collection("daily-accounts").doc(docId);
  try {
    await fireStore.runTransaction(async (txn) => {
      const existing = await txn.get(docRef);
      if (existing.exists) {
        throw new Error(`${accountExistsErrorMessage}`);
      }
      txn.set(docRef, {
        ...data,
        id: docId,
        created: new Date(),
        updated: new Date(),
      });
    });
    return { docId };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "An unknown error occurred",
    };
  }
};
