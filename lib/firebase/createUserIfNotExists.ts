// lib/firebase/createUserIfNotExists.ts
"use server";

import { fireStore } from "@/firebase/server";
import { UserData } from "@/types/user";

export const createUserIfNotExists = async (user: UserData) => {
  if (!user || !user.uid) return;
  try {
    const userRef = fireStore.collection("users").doc(user.uid);
    console.log("user ref", userRef);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      const newUserData = {
        ...user,
        createdAt: new Date().toISOString(),
      };

      const userCreated = await userRef.set(newUserData);
      console.log("User Created in Server Action -- ", userCreated);
      return userCreated;
    }
  } catch (error) {
    console.error("Error in createUserIfNotExists:", error);
  }
};
