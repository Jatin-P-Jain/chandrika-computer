"use client";
import { useState } from "react";
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

export function useMobileOtp({
  onSuccess,
  appVerifier,
  currentUser,
}: {
  onSuccess?: (() => void) | undefined;
  appVerifier: RecaptchaVerifier | null;
  currentUser: User | null;
}) {
  const auth = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpReset, setOtpReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult>();

  const resetOtp = () => {
    setOtpSent(false);
    setOtpReset(true); // if needed
  };

  const sendOtp = async (mobile: string, isResent: boolean = false) => {
    try {
      if (!appVerifier) {
        toast.error("Recaptcha not ready. Please try again in a moment.");
        return;
      }
      setSendingOtp(true);
      const confirmation = await auth?.handleSendOTP(mobile, appVerifier);
      setMobileNumber(mobile);
      setOtpSent(true);
      setTimeout(() => {
        setConfirmationResult(confirmation);
      }, 0);
      if (!isResent) {
        toast.success("OTP sent successfully");
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
      if (!confirmationResult) throw new Error("No confirmation result");
      setIsVerifying(true);

      // 👈 ALWAYS link to current Google user (your 2FA flow)
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otp
      );

      if (!currentUser) {
        throw new Error("No active Google session. Please login first.");
      }

      // 👈 LINK PHONE CREDENTIAL TO GOOGLE USER
      try {
        await linkWithCredential(currentUser, credential);

        // Refresh token after successful linking
        const token = await currentUser.getIdToken(true);
        await setToken(token, currentUser.refreshToken);
        await setUserClaims(token, mobileNumber);

        console.log("✅ Phone linked to Google account:", currentUser.uid);
      } catch (linkError: unknown) {
        // Handle linking errors gracefully
        if (linkError instanceof Error) {
          const errorCode = (linkError as any).code;

          if (errorCode === "auth/provider-already-linked") {
            console.log("✅ Phone already linked to this Google account");
            // Still refresh token even if already linked
            const token = await currentUser.getIdToken(true);
            await setToken(token, currentUser.refreshToken);
          } else if (errorCode === "auth/credential-already-in-use") {
            console.error("Phone linked to different account");
            handleFirebaseAuthError(linkError);
            return;
          } else {
            handleFirebaseAuthError(linkError);
            return;
          }
        }
      }

      // 👈 SUCCESS - clear state and trigger next step
      onSuccess?.();
      setOtpSent(false);
      setOtpReset(true);
    } catch (error) {
      handleFirebaseAuthError(error);
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
