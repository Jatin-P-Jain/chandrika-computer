"use client";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  ConfirmationResult,
  linkWithCredential,
  PhoneAuthProvider,
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
    try {
      setIsVerifying(true);
      if (!confirmation) throw new Error("No confirmation result");

      // 👇 Create credential directly - DON'T call auth.verifyOTP()
      const credential = PhoneAuthProvider.credential(
        confirmation.verificationId,
        otp
      );

      if (!currentUser) {
        throw new Error("No active Google session. Please login first.");
      }

      try {
        // Refresh token to ensure session is valid
        await currentUser.getIdToken(true);

        // Link directly - this verifies OTP and links in one step
        await linkWithCredential(currentUser, credential);

        // Reload user to get updated phoneNumber
        await currentUser.reload();

        // Refresh token after successful linking
        const token = await currentUser.getIdToken(true);
        await setToken(token, currentUser.refreshToken);
        await setUserClaims(token, mobileNumber);
        console.log("✅ Phone linked to Google account:", currentUser.uid);
        console.log("✅ Updated phone number:", currentUser.phoneNumber);
      } catch (linkError: unknown) {
        if (linkError instanceof FirebaseError) {
          const errorCode = linkError.code;

          if (errorCode === "auth/provider-already-linked") {
            console.log("✅ Phone already linked to this Google account");
            await currentUser.reload();
            const token = await currentUser.getIdToken(true);
            await setToken(token, currentUser.refreshToken);
          } else if (errorCode === "auth/credential-already-in-use") {
            console.error("Phone linked to different account");
            handleFirebaseAuthError(linkError, tToast);
            return;
          } else if (errorCode === "auth/user-token-expired") {
            toast.error(tToast("SessionExpired"));
            console.error("User token expired during linking");
            await auth.logout();
            return;
          } else {
            handleFirebaseAuthError(linkError, tToast);
            return;
          }
        }
      }

      await onSuccess?.();
      toast.success(tToast("MobileVerified"), {
        description: tToast("MobileVerifiedDesc"),
      });
      setOtpSent(false);
      setOtpReset(true);
    } catch (error) {
      handleFirebaseAuthError(error, tToast);
      console.log(error);
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
