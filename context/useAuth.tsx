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
  authState: AuthStatus;
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
    appVerifier: RecaptchaVerifier
  ) => Promise<ConfirmationResult>;
  verifyOTP: (
    otp: string,
    confirmationResult: ConfirmationResult
  ) => Promise<User | undefined>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthStatus>({ status: "loading" });
  const [inactivityLimit, setInactivityLimit] = useState<number>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const completePhoneVerification = async () => {
    try {
      const { currentUser } =
        authState.status === "phone-verification-required" ||
        authState.status === "first-time-setup"
          ? authState
          : { currentUser: null };

      if (!currentUser) throw new Error("No current user for verification");

      // 👈 FIRST-TIME: Update Firestore with phone & role
      if (authState.status === "first-time-setup") {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const claims = idTokenResult.claims as any;
        const phoneNumber = currentUser.phoneNumber
          ? currentUser.phoneNumber.slice(3)
          : null;
        const role = claims.admin ? "admin" : null;
        const userDocRef = doc(firestore, "users", currentUser.uid);

        await setDoc(
          userDocRef,
          {
            phoneNumber, // 👈 Save verified phone
            role: role || "user", // 👈 Set role (default: user)
            phoneVerified: true,
            phoneVerifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        console.log(
          `✅ First-time setup complete: phone=${phoneNumber}, role=${role}`
        );
      }

      // Fetch updated client user from Firestore
      const snap = await getDoc(doc(firestore, "users", currentUser.uid));
      if (snap.exists()) {
        const clientUser = mapDbUserToClientUser(snap.data());

        setAuthState({
          status: "ready",
          clientUser,
          currentUser,
        });

        // Refresh FCM token
        await refreshAndSaveFcmToken();
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

  // 👈 NEW: Set custom claims for first-time users

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setAuthState({ status: "no-user" });
        await removeToken();
        return;
      }

      try {
        // Check custom claims to determine user type
        const idTokenResult = await user.getIdTokenResult(true);
        const claims = idTokenResult.claims as any;

        if (!claims.phoneVerified) {
          // 👈 FIRST-TIME USER - needs phone input
          setAuthState({
            status: "first-time-setup",
            currentUser: user,
          });
        } else {
          // 👈 RETURNING USER - direct OTP verification
          setAuthState({
            status: "phone-verification-required",
            currentUser: user,
          });
        }

        // Background setup
        const safeUser: UserData = {
          uid: user.uid,
          email: user.email ?? null,
          phoneNumber: user.phoneNumber?.slice(3) ?? null,
          displayName: user.displayName ?? null,
          role: claims.admin ? "admin" : null,
          photoUrl: user.photoURL,
        };

        await createUserIfNotExists(safeUser);

        const limit = claims.admin
          ? parseInt(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0")
          : parseInt(process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0");
        setInactivityLimit(limit);
      } catch (e) {
        console.error("Auth state check failed", e);
        // Fallback to first-time setup
        setAuthState({ status: "first-time-setup", currentUser: user });
      }
    });

    return unsubscribe;
  }, []);

  useMonitorInactivity(
    authState.status === "ready" ? authState.currentUser : null,
    inactivityLimit
  );

  return (
    <AuthContext.Provider
      value={{
        authState,
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
