"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  loginWithEmailAndPass,
  loginWithGoogle as loginWithGoogleAuth,
  logoutUser,
  sendOTP,
  verifyOTP,
  GOOGLE_EMAIL_DENIED_ERROR_CODE,
  GoogleEmailNotAllowedError,
  isGoogleEmailAllowlisted,
} from "@/lib/auth/firebase-auth";
import { auth, firestore } from "@/firebase/client"; // 👈 Add adminAuth
import { ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";
import { UserData } from "@/types/user";
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
  accessDenied: boolean;
  clearAccessDenied: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthStatus>({ status: "loading" });
  const [inactivityLimit, setInactivityLimit] = useState<number>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const isDeniedError = (error: unknown) => {
    if (error instanceof GoogleEmailNotAllowedError) return true;
    if (typeof error === "object" && error !== null && "code" in error) {
      return error.code === GOOGLE_EMAIL_DENIED_ERROR_CODE;
    }
    return false;
  };

  const getUserToken = async () => {
    const { currentUser } =
      authState.status === "ready" ? authState : { currentUser: null };

    if (!currentUser) throw new Error("No current user for verification");

    return currentUser.getIdToken(true);
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
    console.log(
      "[Auth] completePhoneVerification called. Current authState.status:",
      authState.status,
    );
    try {
      const { currentUser } =
        authState.status === "phone-verification-required" ||
        authState.status === "first-time-setup"
          ? authState
          : { currentUser: null };

      if (!currentUser) {
        console.error(
          "[Auth] completePhoneVerification: no currentUser in state",
          authState.status,
        );
        throw new Error("No current user for verification");
      }
      console.log("[Auth] currentUser uid:", currentUser.uid);

      await currentUser.reload();
      console.log(
        "[Auth] User reloaded. phoneNumber:",
        currentUser.phoneNumber,
      );

      const idTokenResult = await currentUser.getIdTokenResult(true);
      const claims = idTokenResult.claims;
      const phoneNumber = currentUser.phoneNumber
        ? currentUser.phoneNumber.slice(3)
        : null;
      const role = claims.admin ? "admin" : "user";
      console.log("[Auth] claims:", { role, phoneNumber, admin: claims.admin });

      const userDocRef = doc(firestore, "users", currentUser.uid);
      console.log("[Auth] Writing Firestore doc (upsert)...");
      await setDoc(
        userDocRef,
        {
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          photoURL: currentUser.photoURL ?? null,
          phoneNumber,
          role,
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      console.log("[Auth] Firestore upsert OK");

      const phoneVerifiedKey = `phone_verified:${currentUser.uid}`;
      sessionStorage.setItem(phoneVerifiedKey, "1");
      console.log("[Auth] sessionStorage set:", phoneVerifiedKey);

      console.log("[Auth] Fetching updated user doc...");
      const updatedSnap = await getDoc(
        doc(firestore, "users", currentUser.uid),
      );
      if (updatedSnap.exists()) {
        console.log("[Auth] Updated doc exists. Setting authState → ready");
        const clientUser = mapDbUserToClientUser(updatedSnap.data());
        setAuthState({
          status: "ready",
          clientUser,
          currentUser,
        });
        console.log(
          "[Auth] ✅ authState set to ready for uid:",
          currentUser.uid,
        );

        void (async () => {
          const { refreshAndSaveFcmToken } =
            await import("@/lib/firebase/refreshAndSaveFcmToken");
          await refreshAndSaveFcmToken(currentUser.uid);
        })();
      } else {
        console.error(
          "[Auth] Updated doc does NOT exist after upsert — this should not happen",
        );
        throw new Error("User document not found after phone verification");
      }
    } catch (e) {
      console.error("[Auth] completePhoneVerification FAILED:", e);
      await logoutUser();
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log(
        "[Auth] onAuthStateChanged fired. user:",
        user
          ? { uid: user.uid, email: user.email, phoneNumber: user.phoneNumber }
          : null,
      );

      if (!user) {
        console.log("[Auth] No user → status: no-user");
        setAuthState({ status: "no-user" });
        await removeToken();
        return;
      }

      const allowed = isGoogleEmailAllowlisted(user.email);
      console.log(
        "[Auth] isGoogleEmailAllowlisted:",
        allowed,
        "for email:",
        user.email,
      );
      if (!allowed) {
        console.warn(
          "[Auth] Email not allowlisted → logging out, setting accessDenied",
        );
        setAccessDenied(true);
        setAuthState({ status: "no-user" });
        await logoutUser();
        return;
      }

      setAccessDenied(false);

      try {
        const idTokenResult = await user.getIdTokenResult();
        const claims = idTokenResult.claims;
        console.log("[Auth] ID token claims:", {
          admin: claims.admin,
          phoneNumber: claims.phone_number,
        });

        const safeUser: UserData = {
          uid: user.uid,
          email: user.email ?? null,
          phoneNumber: user.phoneNumber?.slice(3) ?? null,
          displayName: user.displayName ?? null,
          role: claims.admin ? "admin" : "user",
          photoUrl: user.photoURL,
        };
        await createUserIfNotExists(safeUser);
        console.log("[Auth] createUserIfNotExists done");

        console.log("[Auth] createUserIfNotExists done");

        // Read Firestore profile for phoneVerified + client user
        const snap = await getDoc(doc(firestore, "users", user.uid));
        console.log("[Auth] Firestore doc exists:", snap.exists());

        if (!snap.exists()) {
          console.log("[Auth] Doc not found → status: first-time-setup");
          setAuthState({ status: "first-time-setup", currentUser: user });
          return;
        }

        const dbUser = snap.data();
        const phoneVerified = dbUser.phoneVerified === true;
        console.log(
          "[Auth] dbUser.phoneVerified:",
          dbUser.phoneVerified,
          "→ phoneVerified:",
          phoneVerified,
        );

        if (!phoneVerified) {
          console.log("[Auth] phoneVerified=false → status: first-time-setup");
          setAuthState({ status: "first-time-setup", currentUser: user });
        } else {
          const phoneVerifiedKey = `phone_verified:${user.uid}`;
          const otpOk = sessionStorage.getItem(phoneVerifiedKey) === "1";
          console.log(
            "[Auth] sessionStorage key:",
            phoneVerifiedKey,
            "→ otpOk:",
            otpOk,
          );

          if (!otpOk) {
            console.log(
              "[Auth] No sessionStorage flag → status: phone-verification-required",
            );
            setAuthState({
              status: "phone-verification-required",
              currentUser: user,
            });
            return;
          }
          console.log("[Auth] All checks passed → status: ready");
          const clientUser = mapDbUserToClientUser(dbUser);
          setAuthState({ status: "ready", clientUser, currentUser: user });
        }

        const limit = parseInt(
          process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0",
        );

        setInactivityLimit(limit);
      } catch (e) {
        if (isDeniedError(e)) {
          console.warn("[Auth] isDeniedError → logging out, accessDenied");
          setAccessDenied(true);
          setAuthState({ status: "no-user" });
          await logoutUser();
          return;
        }
        console.error("[Auth] onAuthStateChanged handler threw:", e);
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
            setAccessDenied(false);
            await logoutUser();
            window.location.href = "/";
          } catch (err) {
            console.error("Logout failed", err);
            setIsLoggingOut(false);
          }
        },
        loginWithGoogle: async () => {
          setAccessDenied(false);
          try {
            return await loginWithGoogleAuth();
          } catch (error) {
            if (isDeniedError(error)) {
              setAccessDenied(true);
            }
            throw error;
          }
        },
        loginWithEmailAndPassword: ({ email, password }) =>
          loginWithEmailAndPass(email, password),
        handleSendOTP: (mobile, appVerifier) => sendOTP(mobile, appVerifier),
        verifyOTP: (otp, confirmationResult) =>
          verifyOTP(otp, confirmationResult),
        startPhoneVerificationFlow,
        accessDenied,
        clearAccessDenied: () => setAccessDenied(false),
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
