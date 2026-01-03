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
  Check,
  Loader2,
  Loader2Icon,
  Redo2Icon,
  Send,
  SendHorizonalIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMobileOtp } from "@/hooks/useMobileOtp";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useEffect, useRef, useState } from "react";
import OTPInput from "./otp-input";
import { User } from "firebase/auth";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";

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

  const tToast = useTranslations("Toast");

  const showPhoneInput = authStateStatus === "first-time-setup";
  const phoneVerification = authStateStatus === "phone-verification-required";

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
    setOtpEpoch((x) => x + 1);
  };

  const handleVerifyOTP = async () => {
    await verifyOtp(phoneAuthState.otp);
  };
  const [timer, setTimer] = useState(30); // countdown
  const [canResend, setCanResend] = useState(false);
  const [hasResentOnce, setHasResentOnce] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "done">(
    "idle"
  );
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 min = 300s
  const [otpEpoch, setOtpEpoch] = useState(0);

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

  useEffect(() => {
    if (!otpSent) return;
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
  }, [otpSent]);

  const handleResend = async () => {
    if (hasResentOnce || sendingOtp) return;
    try {
      setResendStatus("sending");
      await sendOtp(phoneAuthState.phoneNumber, true);
      setResendStatus("done");
      setHasResentOnce(true);
      toast.success(tToast("OtpResentSuccessfully"));
      setExpiryTimer(300); // Reset expiry timer to 5 minutes
      setTimer(30);
      setCanResend(false);
    } catch (err) {
      console.error("Error resending OTP:", err);
      toast.error(tToast("FailedToResendOtp"));
      setResendStatus("idle");
    }
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

          {phoneVerification && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <p className="text-muted-foreground gap-2 flex items-center justify-start w-full">
                  {otpSent
                    ? tMobileNumber("OTPSentTo", {
                        phone: "",
                      })
                    : tMobileNumber("OTPWillSendTo", { phone: "" })}
                  <span className=" font-semibold">
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

              {otpSent ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-[2fr_3fr_2fr] justify-center items-center gap-4">
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
                    {expiryTimer === 0 ? (
                      <p className="text-red-700 text-sm flex gap-2 items-center justify-end">
                        {tMobileNumber("OTPExpired")}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs flex gap-2 items-center justify-end">
                        {tMobileNumber("OTPExpiresIn", {
                          time: formatTime(expiryTimer),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full items-center justify-center gap-4">
                    <div className="text-muted-foreground text-sm flex w-1/2">
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
                      className="w-1/2"
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
