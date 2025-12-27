// lib/firebase/createUserIfNotExists.ts
"use server";

import { fireStore } from "@/firebase/server";
import { UserData } from "@/types/user";

export const createUserIfNotExists = async (user: UserData) => {
  if (!user || !user.uid) return;

  const userRef = fireStore.collection("users").doc(user.uid);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    const newUserData = {
      ...user,
      profileComplete: false,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(newUserData);
  }
};
