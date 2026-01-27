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
import {
  Loader2,
  Loader2Icon,
  Redo2Icon,
  Send,
  SendHorizonalIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useEffect, useRef, useState } from "react";
import OTPInput from "./otp-input";
import { User } from "firebase/auth";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import clsx from "clsx";

interface PhoneAuthState {
  phoneNumber: string;
  otp: string;
  error: string;
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

  const locale = useLocale();
  const tToast = useTranslations("Toast");
  const tMobileNumber = useTranslations("MobileNumber");

  // const showPhoneInput = authStateStatus === "first-time-setup";
  // const phoneVerification = authStateStatus === "phone-verification-required";

 

  // 👇 Use ref to persist phone number across state switches
  const phoneNumberRef = useRef<string>("");

  const [phoneAuthState, setPhoneAuthState] = useState<PhoneAuthState>({
    phoneNumber: "",
    otp: "",
    error: "",
  });

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [hasResentOnce, setHasResentOnce] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "done">(
    "idle",
  );
  const [expiryTimer, setExpiryTimer] = useState(300);
  const [otpEpoch, setOtpEpoch] = useState(0);

  const recaptchaVerifier = useRecaptcha();
  const { isVerifying, otpSent, sendingOtp, sendOtp, verifyOtp, resetOtp } =
    useMobileOtp({
      onSuccess: onVerified,
      appVerifier: recaptchaVerifier,
      currentUser: currentUser!,
    });

   const showPhoneInput = authStateStatus === "first-time-setup" && !otpSent;
  const phoneVerification =
    authStateStatus === "phone-verification-required" ||
    (authStateStatus === "first-time-setup" && otpSent);

  // 👇 Sync phoneNumber to ref whenever it changes (for persistence)
  useEffect(() => {
    if (phoneAuthState.phoneNumber) {
      phoneNumberRef.current = phoneAuthState.phoneNumber;
    }
  }, [phoneAuthState.phoneNumber]);

  // 👇 Restore phone number when switching to phone-verification-required
  useEffect(() => {
    if (authStateStatus === "phone-verification-required") {
      setPhoneAuthState((prev) => ({
        ...prev,
        phoneNumber:
          prev.phoneNumber || // Keep current value
          phoneNumberRef.current || // Restore from ref
          currentUser?.phoneNumber || // Fallback to currentUser
          "",
      }));
    }
  }, [authStateStatus, currentUser?.phoneNumber]);

  // 👇 Initialize phone number for returning users
  useEffect(() => {
    if (
      phoneVerification &&
      currentUser?.phoneNumber &&
      !phoneAuthState.phoneNumber
    ) {
      setPhoneAuthState((s) => ({
        ...s,
        phoneNumber: currentUser.phoneNumber!,
      }));
      phoneNumberRef.current = currentUser.phoneNumber!;
    }
  }, [phoneVerification, currentUser?.phoneNumber]);

  // 👇 Expiry timer
  useEffect(() => {
    if (!otpSent) return;
    const interval = setInterval(() => {
      setExpiryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, otpEpoch]);

  // 👇 Resend timer
  useEffect(() => {
    if (!otpSent) return;
    setTimer(30);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, otpEpoch]);

  const handleSendOTP = async () => {
    if (!phoneAuthState.phoneNumber) {
      toast.error(tToast("PleaseEnterPhoneNumber"));
      return;
    }
    await sendOtp(phoneAuthState.phoneNumber);
    setOtpEpoch((x) => x + 1);
  };

  const handleVerifyOTP = async () => {
    await verifyOtp(phoneAuthState.otp);
  };

  const handleResend = async () => {
    if (hasResentOnce || sendingOtp) return;
    try {
      setResendStatus("sending");
      await sendOtp(phoneAuthState.phoneNumber, true);
      setResendStatus("done");
      setHasResentOnce(true);
      toast.success(tToast("OtpResentSuccessfully"));
      setExpiryTimer(300);
      setOtpEpoch((x) => x + 1);
      // Clear OTP input on resend
      setPhoneAuthState((s) => ({ ...s, otp: "" }));
    } catch (err) {
      console.error("Error resending OTP:", err);
      toast.error(tToast("FailedToResendOtp"));
      setResendStatus("idle");
    }
  };

  return (
    <section className="flex items-center justify-center">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-center text-center gap-1">
          <div>
            <MobileFriendlyIcon className="size-8! md:size-10! text-primary" />
          </div>
          <CardTitle className="text-lg md:text-2xl text-primary">
            {tMobileNumber("Verification")}
          </CardTitle>
          <CardDescription className="text-xs md:text-base text-muted-foreground">
            {showPhoneInput
              ? tMobileNumber("FirstTimeVerificationDesc")
              : tMobileNumber("VerificationDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showPhoneInput && (
            <div className="flex md:flex-row flex-col gap-2 md:gap-4">
              <div className="grid md:grid-cols-[2fr_4fr] w-full gap-1 md:justify-center items-center">
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
                  className="w-full text-lg!"
                />
              </div>

              {phoneAuthState.error && (
                <p className="text-sm text-destructive">
                  {phoneAuthState.error}
                </p>
              )}
              <Button
                onClick={handleSendOTP}
                className="md:w-1/4"
                disabled={sendingOtp || !phoneAuthState.phoneNumber}
              >
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

          {phoneVerification && (
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="flex md:flex-row flex-col justify-between">
                <p
                  className={clsx(
                    "text-sm text-muted-foreground gap-1 md:gap-2 flex flex-col md:flex-row items-start justify-start md:items-center w-full",
                    locale === "hi" && "text-base!",
                  )}
                >
                  {otpSent
                    ? tMobileNumber("OTPSentTo", { phone: "" })
                    : tMobileNumber("OTPWillSendTo", { phone: "" })}
                  <span
                    className={clsx(
                      "text-base font-semibold",
                      locale === "hi" && "text-xl",
                    )}
                  >
                    +91 -{" "}
                    {phoneAuthState.phoneNumber.startsWith("+91")
                      ? phoneAuthState.phoneNumber.slice(3)
                      : phoneAuthState.phoneNumber.startsWith("+")
                        ? phoneAuthState.phoneNumber.slice(3)
                        : phoneAuthState.phoneNumber ||
                          currentUser?.phoneNumber?.slice(3)}
                  </span>
                </p>
              </div>

              {otpSent ? (
                <div className="flex flex-col gap-4">
                  <div className="grid md:grid-cols-[2fr_3fr_2fr] justify-center items-center gap-2 md:gap-4">
                    <div className="grid w-full md:gap-2 text-muted-foreground">
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
                    {expiryTimer === 0 ? (
                      <p className="text-red-700 text-sm flex gap-2 items-center md:justify-end">
                        {tMobileNumber("OTPExpired")}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs flex gap-2 items-center md:justify-end">
                        {tMobileNumber("OTPExpiresIn", {
                          time: formatTime(expiryTimer),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col md:flex-row w-full items-center justify-center gap-4">
                    <div className="text-muted-foreground text-sm flex md:w-1/2">
                      {canResend || hasResentOnce ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-primary w-full"
                          onClick={handleResend}
                          disabled={
                            resendStatus === "done" ||
                            resendStatus === "sending"
                          }
                        >
                          {resendStatus === "sending" ? (
                            <>
                              {tMobileNumber("ResendingOTP")}
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              {tMobileNumber("ResendOTP")}
                              <Redo2Icon className="size-4" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-primary/80 text-xs">
                          {tMobileNumber("ResendOTPIn", { timer: timer })}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleVerifyOTP}
                      className="w-full md:w-1/2"
                      disabled={phoneAuthState.otp.length !== 6 || isVerifying}
                    >
                      <div className="flex items-center gap-2">
                        {isVerifying
                          ? tMobileNumber("Verifying")
                          : tMobileNumber("VerifyOTP")}
                        {isVerifying ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <SendHorizonalIcon className="ml-2 size-4!" />
                        )}
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleSendOTP} className="w-full">
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
