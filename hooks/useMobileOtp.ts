"use client";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  ConfirmationResult,
  linkWithCredential,
  PhoneAuthProvider,
  reauthenticateWithCredential,
  RecaptchaVerifier,
  User,
} from "firebase/auth";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";
import { handleFirebaseAuthError } from "@/lib/firebase/firebaseErrorHandler";
import { setToken, setUserClaims } from "@/context/actions";
import { useTranslations } from "next-intl";

export function useMobileOtp({
  onSuccess,
  appVerifier,
  currentUser,
}: {
  onSuccess?: (() => void | Promise<void>) | undefined;
  appVerifier: RecaptchaVerifier | null;
  currentUser: User | null;
}) {
  const tToast = useTranslations("Toast");
  const auth = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpReset, setOtpReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null
  );

  const resetOtp = () => {
    setOtpSent(false);
    setOtpReset(true); // if needed
  };

  const sendOtp = async (mobile: string, isResent: boolean = false) => {
    const mobileFormatted = mobile.startsWith("+") ? mobile.slice(3) : mobile;

    try {
      if (!appVerifier) {
        toast.error("Recaptcha not ready. Please try again in a moment.");
        return;
      }
      setSendingOtp(true);
      const confirmation = await auth?.handleSendOTP(
        mobileFormatted,
        appVerifier
      );
      setConfirmation(confirmation || null);
      setMobileNumber(mobile);
      setOtpSent(true);
      // if (
      //   auth.authState.status === "first-time-setup" &&
      //   auth.authState.currentUser
      // ) {
      //   auth.startPhoneVerificationFlow();
      // }
      if (!isResent) {
        toast.success(tToast("OTPSent"), {
          description: tToast("OTPSentDesc"),
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    console.log("[OTP] verifyOtp called", {
      hasConfirmation: !!confirmation,
      hasCurrentUser: !!currentUser,
      uid: currentUser?.uid,
      providerData: currentUser?.providerData?.map((p) => p.providerId),
      mobileNumber,
    });

    try {
      setIsVerifying(true);
      if (!confirmation) throw new Error("No confirmation result");

      const credential = PhoneAuthProvider.credential(
        confirmation.verificationId,
        otp
      );
      console.log(
        "[OTP] Credential created, verificationId:",
        confirmation.verificationId
      );

      if (!currentUser) {
        throw new Error("No active Google session. Please login first.");
      }

      try {
        console.log("[OTP] Refreshing ID token...");
        await currentUser.getIdToken(true);
        console.log("[OTP] Token refreshed OK");

        // For returning users (phone already linked), reauthenticateWithCredential
        // actually validates the OTP. linkWithCredential skips OTP validation and
        // throws auth/provider-already-linked immediately — making wrong OTPs
        // appear as success.
        //
        // Strategy:
        //   1. Try reauthenticate first — validates OTP for already-linked phones.
        //   2. If phone is NOT linked yet (auth/no-such-provider), fall back to link.
        //   3. Any other error (e.g. auth/invalid-verification-code) = wrong OTP → surface error.

        const isPhoneLinked = currentUser.providerData.some(
          (p) => p.providerId === "phone"
        );
        console.log("[OTP] isPhoneLinked:", isPhoneLinked);

        try {
          console.log("[OTP] Attempting reauthenticateWithCredential...");
          await reauthenticateWithCredential(currentUser, credential);
          console.log("[OTP] reauthenticateWithCredential SUCCESS");
          await currentUser.reload();
          console.log(
            "[OTP] User reloaded after reauth. phoneNumber:",
            currentUser.phoneNumber
          );
        } catch (reauthError: unknown) {
          if (
            reauthError instanceof FirebaseError &&
            reauthError.code === "auth/no-such-provider"
          ) {
            console.log(
              "[OTP] auth/no-such-provider → phone not linked yet, falling back to linkWithCredential"
            );
            await linkWithCredential(currentUser, credential);
            console.log("[OTP] linkWithCredential SUCCESS");
            await currentUser.reload();
            console.log(
              "[OTP] User reloaded after link. phoneNumber:",
              currentUser.phoneNumber
            );
          } else {
            // Wrong OTP, expired OTP, or any other real error — surface it.
            console.error(
              "[OTP] reauthenticateWithCredential FAILED:",
              reauthError
            );
            throw reauthError;
          }
        }

        console.log("[OTP] Refreshing token for session...");
        const token = await currentUser.getIdToken(true);
        console.log("[OTP] Calling setToken...");
        await setToken(token, currentUser.refreshToken);
        console.log("[OTP] Calling setUserClaims with mobile:", mobileNumber);
        await setUserClaims(token, mobileNumber);
        sessionStorage.setItem(`phone_verified:${currentUser.uid}`, "1");
        console.log(
          "[OTP] ✅ sessionStorage set. Phone verified for:",
          currentUser.uid
        );
      } catch (linkError: unknown) {
        if (linkError instanceof FirebaseError) {
          const errorCode = linkError.code;
          console.error(
            "[OTP] Inner catch — Firebase error code:",
            errorCode,
            linkError.message
          );
          if (errorCode === "auth/credential-already-in-use") {
            console.error("[OTP] Phone linked to a different account");
            handleFirebaseAuthError(linkError, tToast);
            return;
          } else if (errorCode === "auth/user-token-expired") {
            toast.error(tToast("SessionExpired"));
            console.error("[OTP] User token expired during verification");
            await auth.logout();
            return;
          } else {
            handleFirebaseAuthError(linkError, tToast);
            return;
          }
        }
        console.error("[OTP] Inner catch — Non-Firebase error:", linkError);
        throw linkError;
      }

      console.log("[OTP] Calling onSuccess callback...");
      await onSuccess?.();
      console.log("[OTP] onSuccess done. Showing toast.");
      toast.success(tToast("MobileVerified"), {
        description: tToast("MobileVerifiedDesc"),
      });
      setOtpSent(false);
      setOtpReset(true);
    } catch (error) {
      console.error("[OTP] Outer catch:", error);
      handleFirebaseAuthError(error, tToast);
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    mobileNumber,
    otpReset,
    otpSent,
    sendingOtp,
    isVerifying,
    sendOtp,
    verifyOtp,
    resetOtp,
  };
}
