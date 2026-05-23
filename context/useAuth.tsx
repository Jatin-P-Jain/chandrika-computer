"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  loginWithEmailAndPass,
  loginWithGoogle as loginWithGoogleAuth,
  loginWithGoogleIdToken,
  logoutUser,
  sendOTP,
  verifyOTP,
  GOOGLE_EMAIL_DENIED_ERROR_CODE,
  GoogleEmailNotAllowedError,
  isGoogleEmailAllowlisted,
} from "@/lib/auth/firebase-auth";
import { auth, firestore } from "@/firebase/client"; // 👈 Add adminAuth
import { ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";
import { UserData } from "@/types/user";
import { removeToken } from "./actions";
import {
  getOrCreateDeviceId,
  isDeviceTrustedLocally,
  markDeviceTrustedLocally,
} from "@/lib/auth/trusted-device";

const OTP_CYCLE_PREFIX = "otp_cycle_verified";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function otpCycleKey(uid: string) {
  return `${OTP_CYCLE_PREFIX}:${uid}`;
}

function isOtpVerifiedForCycle(uid: string) {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(otpCycleKey(uid)) === "1";
}

function markOtpVerifiedForCycle(uid: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(otpCycleKey(uid), "1");
}

function clearOtpVerifiedForCycle(uid: string) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(otpCycleKey(uid));
}

function clearAllOtpCycleFlags() {
  if (!canUseStorage()) return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(`${OTP_CYCLE_PREFIX}:`)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
}

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
  loginWithGoogleOneTap: (idToken: string) => Promise<User | undefined>;
  loginWithEmailAndPassword: (data: {
    email: string;
    password: string;
  }) => Promise<User | undefined>;
  handleSendOTP: (
    mobile: string,
    appVerifier: RecaptchaVerifier,
  ) => Promise<ConfirmationResult>;
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const inactivityLimit =
    Number(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0") || undefined;

  const isDeniedError = (error: unknown) => {
    if (error instanceof GoogleEmailNotAllowedError) return true;
    if (typeof error === "object" && error !== null && "code" in error) {
      return error.code === GOOGLE_EMAIL_DENIED_ERROR_CODE;
    }
    return false;
  };

  const isMobileDevice = () => {
    if (typeof navigator === "undefined") return false;

    if ("userAgentData" in navigator) {
      const uaData = navigator.userAgentData as { mobile?: boolean };
      if (typeof uaData.mobile === "boolean") return uaData.mobile;
    }

    const ua = navigator.userAgent.toLowerCase();
    return /android|iphone|ipad|ipod|mobile|iemobile|opera mini/.test(ua);
  };

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

      const phoneNumber = currentUser.phoneNumber
        ? currentUser.phoneNumber.slice(3)
        : null;
      const role = "admin";

      const userDocRef = doc(firestore, "users", currentUser.uid);
      console.log("[Auth] Writing Firestore doc (upsert)...");
      await setDoc(
        userDocRef,
        {
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          photoUrl: currentUser.photoURL ?? null,
          phoneNumber,
          role,
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      console.log("[Auth] Firestore upsert OK");

      const deviceId = getOrCreateDeviceId();
      if (deviceId) {
        const nowIso = new Date().toISOString();
        const trustedDeviceEntry = {
          phoneVerifiedAt: nowIso,
          lastVerifiedAt: nowIso,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : null,
        };

        await updateDoc(userDocRef, {
          [`trustedDevices.${deviceId}`]: trustedDeviceEntry,
          updatedAt: nowIso,
        });
        markDeviceTrustedLocally(currentUser.uid, deviceId);
      }

      console.log("[Auth] Fetching updated user doc...");
      const updatedSnap = await getDoc(
        doc(firestore, "users", currentUser.uid),
      );
      if (updatedSnap.exists()) {
        console.log("[Auth] Updated doc exists. Setting authState → ready");
        const clientUser = mapDbUserToClientUser(updatedSnap.data());
        markOtpVerifiedForCycle(currentUser.uid);
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
        clearAllOtpCycleFlags();
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
        const userDocRef = doc(firestore, "users", user.uid);
        const snap = await getDoc(userDocRef);

        let dbUser = snap.exists() ? snap.data() : null;
        if (!dbUser) {
          const nowIso = new Date().toISOString();
          dbUser = {
            uid: user.uid,
            email: user.email ?? null,
            phoneNumber: user.phoneNumber?.slice(3) ?? null,
            displayName: user.displayName ?? null,
            role: "admin",
            photoUrl: user.photoURL ?? null,
            phoneVerified: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          await setDoc(userDocRef, dbUser, { merge: true });
        }

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
          const mobileDevice = isMobileDevice();

          if (mobileDevice) {
            const deviceId = getOrCreateDeviceId();
            const trustedDevices =
              typeof dbUser.trustedDevices === "object" && dbUser.trustedDevices
                ? (dbUser.trustedDevices as Record<string, unknown>)
                : {};
            const trustedOnServer = Boolean(
              deviceId && trustedDevices[deviceId],
            );
            const trustedLocally = Boolean(
              deviceId && isDeviceTrustedLocally(user.uid, deviceId),
            );

            console.log("[Auth] mobile trusted-device check:", {
              uid: user.uid,
              deviceId,
              trustedOnServer,
              trustedLocally,
            });

            if (trustedOnServer && trustedLocally) {
              console.log("[Auth] trusted mobile device → status: ready");
              const clientUser = mapDbUserToClientUser(dbUser);
              setAuthState({ status: "ready", clientUser, currentUser: user });
              return;
            }

            console.log(
              "[Auth] untrusted mobile device → status: phone-verification-required",
            );
            setAuthState({
              status: "phone-verification-required",
              currentUser: user,
            });
            return;
          }

          const otpVerifiedForCycle = isOtpVerifiedForCycle(user.uid);

          console.log("[Auth] desktop OTP cycle check:", {
            uid: user.uid,
            otpVerifiedForCycle,
          });

          if (otpVerifiedForCycle) {
            console.log(
              "[Auth] desktop OTP already verified in this login cycle → status: ready",
            );
            const clientUser = mapDbUserToClientUser(dbUser);
            setAuthState({ status: "ready", clientUser, currentUser: user });
            return;
          }

          console.log(
            "[Auth] desktop OTP required for this login cycle → status: phone-verification-required",
          );
          setAuthState({
            status: "phone-verification-required",
            currentUser: user,
          });
        }
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
            const currentUid =
              authState.status === "ready" ||
              authState.status === "first-time-setup" ||
              authState.status === "phone-verification-required"
                ? authState.currentUser.uid
                : null;

            if (currentUid) {
              clearOtpVerifiedForCycle(currentUid);
            }
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
        loginWithGoogleOneTap: async (idToken: string) => {
          setAccessDenied(false);
          try {
            return await loginWithGoogleIdToken(idToken);
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
