"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2Icon, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useEffect, useRef, useState } from "react";
import OTPInput from "./otp-input";
import { User } from "firebase/auth";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";

interface PhoneAuthState {
  phoneNumber: string;
  otp: string;
  error: string;
  confirmationResult: any;
}

export function PhoneVerification({
  authStateStatus,
  onVerified,
  currentUser,
}: {
  authStateStatus:
    | "no-user"
    | "first-time-setup"
    | "phone-verification-required"
    | "ready";
  onVerified: () => void;
  currentUser: User | null;
}) {
  // 👈 ONLY show for phone verification states
  if (
    !authStateStatus ||
    (authStateStatus !== "first-time-setup" &&
      authStateStatus !== "phone-verification-required")
  ) {
    return null;
  }

  const showPhoneInput = authStateStatus === "first-time-setup";
  const showOtpInput = authStateStatus === "phone-verification-required";

  const tMobileNumber = useTranslations("MobileNumber");
  const [phoneAuthState, setPhoneAuthState] = useState<PhoneAuthState>({
    phoneNumber: "",
    otp: "",
    error: "",
    confirmationResult: null,
  });

  // Reset on unmount (fresh state for every login)
  useEffect(() => {
    return () => {
      setPhoneAuthState({
        phoneNumber: "",
        otp: "",
        error: "",
        confirmationResult: null,
      });
    };
  }, []);

  const recaptchaVerifier = useRecaptcha();
  const { isVerifying, otpSent, sendingOtp, sendOtp, verifyOtp, resetOtp } =
    useMobileOtp({
      onSuccess: onVerified,
      appVerifier: recaptchaVerifier,
      currentUser: currentUser!,
    });

  const handleSendOTP = async () => {
    await sendOtp(phoneAuthState.phoneNumber);
  };

  const handleVerifyOTP = async () => {
    await verifyOtp(phoneAuthState.otp);
  };

  useEffect(() => {
    if (
      authStateStatus === "phone-verification-required" &&
      currentUser?.phoneNumber
    ) {
      console.log("setting phone number");

      setPhoneAuthState((s) => ({
        ...s,
        phoneNumber: currentUser.phoneNumber!,
      }));
    }
  }, [authStateStatus, currentUser?.phoneNumber]);

  const autoSentRef = useRef(false);

  useEffect(() => {
    const phone = currentUser?.phoneNumber
      ? currentUser.phoneNumber.replace(/\s+/g, "").slice(3)
      : null;
    const canAutoSend =
      authStateStatus === "phone-verification-required" &&
      !!recaptchaVerifier &&
      !!currentUser?.phoneNumber;

    if (!canAutoSend) {
      console.log("returning from auto-send");
      return;
    }
    if (autoSentRef.current) return;

    autoSentRef.current = true;
    sendOtp(phone!).catch(() => {
      autoSentRef.current = false; // allow retry on failure
    });
  }, [authStateStatus, recaptchaVerifier, currentUser?.phoneNumber, sendOtp]);

  return (
    <section className="flex items-center justify-center">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-center text-center gap-1">
          <div className="">
            <MobileFriendlyIcon className="size-10! text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary">
            {tMobileNumber("Verification")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {showPhoneInput
              ? tMobileNumber("FirstTimeVerificationDesc")
              : tMobileNumber("VerificationDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showPhoneInput && (
            <div className="flex gap-4">
              <div className="grid grid-cols-[1fr_4fr] w-full gap-1 justify-center items-center">
                <span className="text-muted-foreground">
                  {tMobileNumber("MobileNumber")} :
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneAuthState.phoneNumber}
                  onChange={(e) =>
                    setPhoneAuthState({
                      ...phoneAuthState,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>

              {phoneAuthState.error && (
                <p className="text-sm text-destructive">
                  {phoneAuthState.error}
                </p>
              )}
              <Button onClick={handleSendOTP} className="w-1/4">
                <div className="flex items-center gap-2">
                  {sendingOtp
                    ? tMobileNumber("SendingOTP")
                    : tMobileNumber("SendOTP")}
                  {sendingOtp ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Send className="ml-2 size-4!" />
                  )}
                </div>
              </Button>
            </div>
          )}

          {(otpSent || showOtpInput) && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground gap-2 flex items-center justify-start w-full">
                  {tMobileNumber("OTPSentTo")}
                  <span className="text-base font-semibold">
                    +91 -{" "}
                    {phoneAuthState.phoneNumber.startsWith("+91")
                      ? phoneAuthState.phoneNumber.slice(3)
                      : currentUser?.phoneNumber?.slice(3)}
                  </span>
                </p>
                <Button
                  disabled
                  variant="link"
                  onClick={() =>
                    setPhoneAuthState({ ...phoneAuthState, phoneNumber: "" })
                  }
                >
                  {tMobileNumber("ChangeNumber")}
                </Button>
              </div>
              <div className="grid grid-cols-[1fr_3fr_2fr] justify-center items-center gap-4">
                <div className="grid w-full gap-2 text-muted-foreground">
                  <span>{tMobileNumber("EnterOTP")}: </span>
                </div>
                <div className="flex flex-col items-center justify-start">
                  <OTPInput
                    length={6}
                    value={phoneAuthState.otp}
                    onChange={(value) =>
                      setPhoneAuthState({ ...phoneAuthState, otp: value })
                    }
                  />
                  {phoneAuthState.error && (
                    <p className="text-sm text-destructive">
                      {phoneAuthState.error}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  className="w-full"
                  disabled={phoneAuthState.otp.length !== 6 || isVerifying}
                >
                  <div className="flex items-center gap-2">
                    {isVerifying
                      ? tMobileNumber("Verifying")
                      : tMobileNumber("VerifyOTP")}
                    {isVerifying ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Check className="ml-2 size-4!" />
                    )}
                  </div>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
