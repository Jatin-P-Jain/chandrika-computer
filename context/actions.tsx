"use server";

import { auth } from "@/firebase/server";
import { User } from "firebase/auth";
import { cookies } from "next/headers";

export const removeToken = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("firebaseAuthToken");
  cookieStore.delete("firebaseAuthRefreshToken");
};

export const setToken = async (token: string, refreshToken: string) => {
  try {
    const verifiedToken = await auth.verifyIdToken(token);
    if (!verifiedToken) return;

    const cookieStore = await cookies();
    cookieStore.set("firebaseAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set("firebaseAuthRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  } catch (e) {
    console.error("Error setting token/claims:", e);
  }
};

// 👈 ADMIN EMAILS for auto-role assignment
const ADMIN_EMAILS = [
  "jatinbittu13@gmail.com",
  // Add your admin emails here
];
export const setUserClaims = async (token: string, phoneNumber: string) => {
  try {
    const verifiedToken = await auth.verifyIdToken(token);
    if (!verifiedToken) return;

    const userRecord = await auth.getUser(verifiedToken.uid);
    const existingClaims = userRecord.customClaims ?? {};
    const newClaims: Record<string, boolean> = { ...existingClaims };

    // Admin logic
    if (userRecord.email && ADMIN_EMAILS.includes(userRecord.email)) {
      newClaims.admin = true;
    }

    newClaims.phoneVerified = true;
    newClaims.firstLoginCompleted = true;

    // Set custom claims (server-side required)
    await auth.setCustomUserClaims(userRecord.uid, {
      ...newClaims,
      phoneNumber: phoneNumber,
    });

    console.log("✅ Custom claims set:", newClaims);
  } catch (error) {
    console.error("Failed to set custom claims:", error);
  }
};
