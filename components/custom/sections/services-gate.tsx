"use client";

import Link from "next/link";
import {
  ClipboardListIcon,
  Info,
  Layers,
  LockKeyholeIcon,
  XIcon,
} from "lucide-react";
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
import { AccountDetails } from "../account-details";
import { buildUser } from "@/lib/utils";
import { useState } from "react";
import { AccountDetailsSkeleton } from "@/components/skeletons/account-details-skeleton";
import LoginLogoutSkeleton from "@/components/skeletons/login-logout-skeleton";

export function ServicesGate({ sessionExpired }: { sessionExpired?: string }) {
  const locale = useLocale();
  const tHomePage = useTranslations("HomePage");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampStockLedger = useTranslations("StampStock");

  const auth = useAuth();
  const { authState, logout, completePhoneVerification } = auth;
  const isPhoneVerification =
    authState.status === "first-time-setup" ||
    authState.status === "phone-verification-required";
  const currentUser = isPhoneVerification ? authState.currentUser : null;
  const clientUser = authState.status === "ready" ? authState.clientUser : null;

  const [sessionExpiredPopupShown, setSessionExpiredPopupShown] = useState(
    sessionExpired === "1"
  );
  return (
    <section className="flex w-full flex-col mx-auto rounded-xl bg-muted p-4 md:p-6 shadow-sm gap-4">
      {sessionExpired && sessionExpiredPopupShown && (
        <div className="relative flex justify-center items-center w-1/2 mx-auto p-3 text-sm text-yellow-900 bg-yellow-200 border border-yellow-300 rounded-md gap-2">
          <Info className="inline size-4" />
          {tHomePage("SessionExpiredMessage")}
          <XIcon
            className="inline size-6 absolute -right-1 -top-1 cursor-pointer p-1 bg-white text-yellow-900 rounded-full border-yellow-300 border"
            onClick={() => {
              setSessionExpiredPopupShown(false);
            }}
          />
        </div>
      )}
      <div className="flex justify-between items-start w-full pb-4">
        {authState.status === "loading" ? (
          <AccountDetailsSkeleton />
        ) : (
          <AccountDetails
            user={buildUser(clientUser, currentUser)}
            userStatus={authState.status}
          />
        )}
        {authState.status === "loading" ? (
          <LoginLogoutSkeleton />
        ) : authState.status === "no-user" ? (
          <GoogleLoginButton variant={"outline"} />
        ) : (
          <LogoutButton onLogout={logout} />
        )}
      </div>
      <PhoneVerification
        authStateStatus={
          authState.status as "first-time-setup" | "phone-verification-required"
        }
        onVerified={completePhoneVerification}
        currentUser={currentUser!}
      />
      {authState.status !== "ready" && (
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
            <span className="text-foreground">
              {tHomePage("SecureServices")}
            </span>
            <p className={clsx("text-xs", locale === "hi" && "text-sm!")}>
              {tHomePage("SecureServicesDesc")}
            </p>
          </div>
        </div>
      )}
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
            {authState.status !== "ready" && (
              <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md" />
            )}
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
            {authState.status !== "ready" && (
              <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md" />
            )}
          </Card>
        </Link>
      </div>
      <div id="recaptcha-container" className=""></div>
    </section>
  );
}
