"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  loginWithEmailAndPass,
  loginWithGoogle,
  logoutUser,
  sendOTP,
  verifyOTP,
} from "@/lib/auth/firebase-auth";
import { auth, firestore } from "@/firebase/client"; // 👈 Add adminAuth
import { ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";
import { getDeviceMetadata } from "@/lib/utils";
import { getMessaging, getToken } from "firebase/messaging";
import { UserData } from "@/types/user";
import { saveFcmToken } from "@/lib/firebase/saveFcmToken";
import { removeToken } from "./actions";
import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";

type AuthStatus =
  | { status: "loading" }
  | { status: "no-user" }
  | { status: "first-time-setup"; currentUser: User } // 👈 NEW: Needs phone input
  | { status: "phone-verification-required"; currentUser: User } // 👈 Returning user
  | {
      status: "ready";
      clientUser: UserData;
      currentUser: User;
    };

type AuthContextType = {
  user: UserData | null;
  authState: AuthStatus;
  getUserToken: () => Promise<string>;
  completePhoneVerification: () => Promise<void>;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User | undefined>;
  loginWithEmailAndPassword: (data: {
    email: string;
    password: string;
  }) => Promise<User | undefined>;
  handleSendOTP: (
    mobile: string,
    appVerifier: RecaptchaVerifier,
  ) => Promise<ConfirmationResult | null>;
  verifyOTP: (
    otp: string,
    confirmationResult: ConfirmationResult,
  ) => Promise<User | undefined>;
  startPhoneVerificationFlow: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthStatus>({ status: "loading" });
  const [inactivityLimit, setInactivityLimit] = useState<number>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getUserToken = async () => {
    const { currentUser } =
      authState.status === "ready" ? authState : { currentUser: null };

    if (!currentUser) throw new Error("No current user for verification");

    return currentUser.getIdToken();
  };

  const startPhoneVerificationFlow = () => {
    setAuthState((prev) => {
      if (prev.status === "first-time-setup") {
        return {
          status: "phone-verification-required",
          currentUser: prev.currentUser,
        };
      }
      return prev;
    });
  };

  const completePhoneVerification = async () => {
    try {
      const { currentUser } =
        authState.status === "phone-verification-required" ||
        authState.status === "first-time-setup"
          ? authState
          : { currentUser: null };

      if (!currentUser) throw new Error("No current user for verification");

      // 👇 Reload to get the latest phone number
      await currentUser.reload();

      // Fetch current Firestore doc
      const snap = await getDoc(doc(firestore, "users", currentUser.uid));

      if (!snap.exists()) {
        throw new Error("User document not found");
      }

      const dbUser = snap.data();
      const phoneVerified = dbUser.phoneVerified === true;

      // 👇 Update Firestore ONLY if phone wasn't verified before
      if (!phoneVerified) {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const claims = idTokenResult.claims as any;
        const phoneNumber = currentUser.phoneNumber
          ? currentUser.phoneNumber.slice(3)
          : null;
        const role = claims.admin ? "admin" : "user";
        const userDocRef = doc(firestore, "users", currentUser.uid);

        await setDoc(
          userDocRef,
          {
            phoneNumber,
            role,
            phoneVerified: true,
            phoneVerifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );

        console.log(
          `✅ First-time setup complete: phone=${phoneNumber}, role=${role}`,
        );
      }

      // 👇 Set session storage flag for returning users
      const phoneVerifiedKey = `phone_verified:${currentUser.uid}`;
      sessionStorage.setItem(phoneVerifiedKey, "1");

      // Fetch updated client user from Firestore
      const updatedSnap = await getDoc(
        doc(firestore, "users", currentUser.uid),
      );
      if (updatedSnap.exists()) {
        const clientUser = mapDbUserToClientUser(updatedSnap.data());
        setAuthState({
          status: "ready",
          clientUser,
          currentUser,
        });

        // Refresh FCM token
        await refreshAndSaveFcmToken();

        window.location.href = "/"; // Redirect to home
      } else {
        throw new Error("User document not found after update");
      }
    } catch (e) {
      console.error("completePhoneVerification failed", e);
      await logoutUser();
    }
  };

  const refreshAndSaveFcmToken = async () => {
    if (authState.status !== "ready") return;
    const { currentUser } = authState;

    try {
      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
      const token = await getToken(messaging, { vapidKey });
      if (!token) return;

      const metadata = getDeviceMetadata();
      await saveFcmToken(currentUser.uid, token, metadata);
      console.log("✅ FCM token refreshed & saved:", token);
    } catch (error) {
      console.error("Failed to refresh and save FCM token", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setAuthState({ status: "no-user" });
        await removeToken();
        return;
      }

      try {
        // Claims only for role/admin, and don't force refresh on load
        const idTokenResult = await user.getIdTokenResult(); // [web:125]
        const claims = idTokenResult.claims as any;

        // Ensure user doc exists
        const safeUser: UserData = {
          uid: user.uid,
          email: user.email ?? null,
          phoneNumber: user.phoneNumber?.slice(3) ?? null,
          displayName: user.displayName ?? null,
          role: claims.admin ? "admin" : null,
          photoUrl: user.photoURL,
        };
        const userCreated = await createUserIfNotExists(safeUser);
        console.log("User Created", userCreated);

        // Read Firestore profile for phoneVerified + client user
        const snap = await getDoc(doc(firestore, "users", user.uid));

        if (!snap.exists()) {
          // if doc not found, treat as first-time (or create doc then first-time)
          setAuthState({ status: "first-time-setup", currentUser: user });
          return;
        }

        const dbUser = snap.data();
        const phoneVerified = dbUser.phoneVerified === true;

        if (!phoneVerified) {
          setAuthState({ status: "first-time-setup", currentUser: user });
        } else {
          const phoneVerifiedKey = `phone_verified:${user.uid}`;
          const otpOk = sessionStorage.getItem(phoneVerifiedKey) === "1"; // [web:226]

          if (!otpOk) {
            setAuthState({
              status: "phone-verification-required",
              currentUser: user,
            });
            return;
          }
          const clientUser = mapDbUserToClientUser(dbUser);
          setAuthState({ status: "ready", clientUser, currentUser: user });
          // optionally refresh token in background after verification only
          // await user.getIdToken(true); // only if you truly need claims now [web:125]
        }

        const limit = parseInt(
          process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0",
        );

        setInactivityLimit(limit);
      } catch (e) {
        console.error("Auth state check failed", e);
        setAuthState({ status: "first-time-setup", currentUser: user });
      }
    });

    return unsubscribe;
  }, []);

  useMonitorInactivity(
    authState.status === "ready" ? authState.currentUser : null,
    inactivityLimit,
  );

  return (
    <AuthContext.Provider
      value={{
        user: authState.status === "ready" ? authState.clientUser : null,
        authState,
        getUserToken,
        completePhoneVerification,
        isLoggingOut,
        logout: async () => {
          setIsLoggingOut(true);
          try {
            await logoutUser();
            window.location.href = "/";
          } catch (err) {
            console.error("Logout failed", err);
            setIsLoggingOut(false);
          }
        },
        loginWithGoogle,
        loginWithEmailAndPassword: ({ email, password }) =>
          loginWithEmailAndPass(email, password),
        handleSendOTP: (mobile, appVerifier) => sendOTP(mobile, appVerifier),
        verifyOTP: (otp, confirmationResult) =>
          verifyOTP(otp, confirmationResult),
        startPhoneVerificationFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
