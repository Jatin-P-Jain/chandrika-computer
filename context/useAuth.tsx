"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  loginWithEmailAndPass,
  loginWithGoogle,
  logoutUser,
  sendOTP,
  verifyOTP,
} from "@/lib/auth/firebase-auth";
import { auth, firestore } from "@/firebase/client";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
  ParsedToken,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";
import { getDeviceMetadata } from "@/lib/utils";
import { getMessaging, getToken } from "firebase/messaging";
import { UserData } from "@/types/user";
import { saveFcmToken } from "@/lib/firebase/saveFcmToken";
import { removeToken } from "./actions";
import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";

type AuthContextType = {
  loading: boolean;
  clientUser: UserData | null;
  setClientUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  refreshClientUser: () => Promise<void>;
  clientUserLoading: boolean;
  isLoggingOut: boolean;
  currentUser: User | null;
  customClaims: ParsedToken | null;
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
  const [clientUser, setClientUser] = useState<UserData | null>(null);
  const [clientUserLoading, setClientUserLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);
  const [inactivityLimit, setInactivityLimit] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshClientUser = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(firestore, "users", currentUser.uid));
      if (snap.exists()) {
        setClientUser(mapDbUserToClientUser(snap.data()));
      }
    } catch (e) {
      console.error("refreshClientUser failed", e);
    } finally {
      setClientUserLoading(false);
    }
  };

  // Refresh & save FCM token only when user is logged in
  const refreshAndSaveFcmToken = async () => {
    if (!currentUser) {
      console.log("No authenticated user; skipping FCM token save");
      return;
    }
    try {
      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
      const token = await getToken(messaging, { vapidKey });
      if (!token) {
        console.log("No FCM token available");
        return;
      }
      const metadata = getDeviceMetadata();
      await saveFcmToken(currentUser.uid, token, metadata);
      console.log("✅ FCM token refreshed & saved:", token);
    } catch (error) {
      console.error("Failed to refresh and save FCM token", error);
    }
  };

  // Trigger token refresh/save on login state changes
  useEffect(() => {
    refreshAndSaveFcmToken();
  }, [currentUser]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Clear your server cookies (not FCM tokens)
        await removeToken();
        setClientUser(null);
        setClientUserLoading(false);
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      setLoading(false);

      // Persist user in Firestore and fetch claims
      const result = await user.getIdTokenResult(true);
      const safeUser: UserData = {
        uid: user.uid,
        email: user.email ?? null,
        phone: user.phoneNumber?.slice(3) ?? null,
        displayName: user.displayName ?? null,
        role: result.claims.admin ? "admin" : null,
        photoUrl: user.photoURL,
        firmName: "",
        firebaseAuth: result.claims.firebase
          ? {
              identities: result.claims.firebase.identities ?? {},
              sign_in_provider: result.claims.firebase.sign_in_provider ?? "",
            }
          : undefined,
      };
      await createUserIfNotExists(safeUser);
      setCustomClaims(result.claims);

      // Set inactivity limit based on role
      const limit = result.claims.admin
        ? parseInt(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0")
        : parseInt(process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0");
      setInactivityLimit(limit);

      // Fetch client user data
      try {
        const snap = await getDoc(doc(firestore, "users", safeUser.uid));
        if (snap.exists()) {
          setClientUser(mapDbUserToClientUser(snap.data()));
        }
      } catch (e) {
        console.error("refreshClientUser failed", e);
        await logoutUser();
        await removeToken();
        setCurrentUser(null);
        setClientUser(null);
      } finally {
        setClientUserLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useMonitorInactivity(currentUser, inactivityLimit);

  return (
    <AuthContext.Provider
      value={{
        loading,
        clientUser,
        setClientUser,
        clientUserLoading,
        refreshClientUser,
        isLoggingOut,
        currentUser,
        customClaims,
        logout: async () => {
          setIsLoggingOut(true);
          try {
            await logoutUser();
            // Keep FCM tokens intact
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
