"use client";

import Link from "next/link";
import { ClipboardListIcon, Layers, LockKeyholeIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import GoogleLoginButton from "../google-login-button";
import { useAuth } from "@/context/useAuth";
import clsx from "clsx";
import { LogoutButton } from "../action-items/logout-button";
import { PhoneVerification } from "../phone-verification";
import { useState } from "react";

export function ServicesGate() {
  const locale = useLocale();
  const tHomePage = useTranslations("HomePage");
  const tCommon = useTranslations("Common");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampStockLedger = useTranslations("StampStock");

  const auth = useAuth();
  const { authState, logout, completePhoneVerification } = auth;
  const { currentUser } =
    authState.status === "phone-verification-required" ||
    authState.status === "first-time-setup"
      ? authState
      : { currentUser: null };

  const userName =
    authState.status === "phone-verification-required" ||
    authState.status === "first-time-setup"
      ? authState.currentUser.displayName
      : authState.status === "ready"
      ? authState.clientUser.displayName
      : "Guest";

  // ALWAYS require phone verification AFTER Google login
  // Even if phoneNumber exists, treat as fresh login needing OTP
  const [requiresPhoneVerification, setRequiresPhoneVerification] =
    useState(true);

  // Show loading spinner while checking auth
  if (authState.status === "loading") {
    return (
      <div className="flex w-full flex-col mx-auto rounded-xl bg-muted p-6 shadow-sm items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <section className="flex w-full flex-col mx-auto rounded-xl bg-muted p-4 md:p-6 shadow-sm gap-4">
      <div className="flex justify-between items-center w-full pb-4">
        <h1 className="w-full text-md">
          {tCommon("Hello")},{" "}
          <span className="font-semibold text-xl">{userName}!</span>
        </h1>
        {authState.status !== "no-user" ? (
          <LogoutButton onLogout={logout} />
        ) : (
          <GoogleLoginButton variant={"outline"} />
        )}
      </div>
      <PhoneVerification
        authStateStatus={authState.status}
        onVerified={completePhoneVerification}
        currentUser={currentUser}
      />

      <div
        className={clsx(
          "flex justify-start items-center text-muted-foreground gap-2 text-sm",
          locale === "hi" && "text-base!"
        )}
      >
        <div className="rounded-full p-2 w-fit bg-primary/10 text-primary">
          <LockKeyholeIcon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground">{tHomePage("SecureServices")}</span>
          <p className={clsx("text-xs", locale === "hi" && "text-sm!")}>
            {tHomePage("SecureServicesDesc")}
          </p>
        </div>
      </div>

      {/* Service cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/daily-account" className="group block">
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md relative">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-fit p-4 size-16 items-center justify-center rounded-md bg-indigo-100 text-indigo-900/90 ">
                {/* replace with your own icon */}
                <span className="">
                  <ClipboardListIcon className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <CardTitle className="">{tDailyAccount("Title")}</CardTitle>
                <CardDescription className="text-sm">
                  {tDailyAccount("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
            <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-red-800 bg-primary/10 p-1 rounded-md" />
          </Card>
        </Link>

        <Link href="/stamp-stock-ledger" className="group block">
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md relative">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-fit p-4 size-16 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                {/* replace with your own icon */}
                <span className="font-semibold">
                  <Layers className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <CardTitle className="">{tStampStockLedger("Title")}</CardTitle>
                <CardDescription className="text-sm">
                  {tStampStockLedger("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
            <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-red-800 bg-primary/10 p-1 rounded-md" />
          </Card>
        </Link>
      </div>
      <div id="recaptcha-container" className=""></div>
    </section>
  );
}
