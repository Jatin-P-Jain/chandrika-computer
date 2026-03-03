"use client";

import Link from "next/link";
import {
  ClipboardListIcon,
  Info,
  Layers,
  Loader2,
  LockKeyholeIcon,
  Newspaper,
  XIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/context/useAuth";
import clsx from "clsx";
import { PhoneVerification } from "../phone-verification";
import { useState } from "react";
import { toast } from "sonner";

export function HomePage({ sessionExpired }: { sessionExpired?: string }) {
  const locale = useLocale();
  const tHomePage = useTranslations("HomePage");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampRegister = useTranslations("StampRegister");
  const tPhotocopyRegister = useTranslations("PhotocopyRegister");
  const tToast = useTranslations("Toast");

  const auth = useAuth();
  const { authState, completePhoneVerification } = auth;
  const isUserLoading = authState.status === "loading";
  const isPhoneVerification =
    authState.status === "first-time-setup" ||
    authState.status === "phone-verification-required";
  const currentUser = isPhoneVerification ? authState.currentUser : null;

  const [sessionExpiredPopupShown, setSessionExpiredPopupShown] = useState(
    sessionExpired === "1",
  );

  return (
    <section className="flex w-full flex-col mx-auto rounded-xl bg-muted shadow-sm gap-4 no-scrollbar p-4 md:p-6 relative">
      {sessionExpired && sessionExpiredPopupShown && (
        <div className="w-full relative flex justify-center items-center md:w-1/2 mx-auto p-3 text-sm text-yellow-700 bg-yellow-200 border border-yellow-200 rounded-md gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-center flex gap-2 justify-center items-center font-medium">
              <Info className="inline size-4" />
              <span className="text-lg">
                {tHomePage("SessionExpiredMessage")}
              </span>
            </span>
            <span className="">{tHomePage("SessionExpiredMessageDesc")}</span>
          </div>
          <XIcon
            className="inline size-6 absolute -right-1 -top-1 cursor-pointer p-1 bg-white text-yellow-900 rounded-full border-yellow-300 border"
            onClick={() => {
              setSessionExpiredPopupShown(false);
            }}
          />
        </div>
      )}
      {isPhoneVerification && authState.status && (
        <PhoneVerification
          authStateStatus={
            authState.status as
              | "first-time-setup"
              | "phone-verification-required"
          }
          onVerified={completePhoneVerification}
          currentUser={currentUser!}
        />
      )}

      {authState.status !== "ready" && (
        <div
          className={clsx(
            "flex justify-start items-center text-muted-foreground gap-2 text-base px-2",
            locale === "hi" && "text-lg!",
          )}
        >
          <div className="rounded-full p-2 w-fit bg-primary/10 text-primary">
            <LockKeyholeIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-foreground ">
              {tHomePage("SecureServices")}
            </span>
            <p
              className={clsx(
                "text-sm text-justify",
                locale === "hi" && "text-sm! md:text-base!",
              )}
            >
              {tHomePage("SecureServicesDesc")}
            </p>
          </div>
        </div>
      )}

      {isUserLoading && (
        <div className="flex justify-center items-center w-full h-full absolute z-10 bg-muted-foreground/30 top-0 left-0 rounded-md">
          <div className="flex flex-col gap-2 justify-center items-center bg-white dark:bg-black/90 p-2 rounded-md">
            <Loader2 className="animate-spin size-8 text-primary" />
            <span className="text-primary font-bold">Please Wait...</span>
          </div>
        </div>
      )}

      {/* Service cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/daily-accounts"
          className="group block"
          onNavigate={(e) => {
            if (authState.status !== "ready") {
              e.preventDefault(); // blocks Next navigation [web:309]
              toast.info(tToast("SecuredService"), {
                description: tToast("PleaseLoginToAccessServiceDesc"),
              });
            }
          }}
        >
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md relative">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-indigo-100 text-indigo-900/90 ">
                {/* replace with your own icon */}
                <span className="">
                  <ClipboardListIcon className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2 items-start">
                <CardTitle className="leading-6">
                  {tDailyAccount("Title")}
                </CardTitle>
                <CardDescription className="">
                  {tDailyAccount("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
            {authState.status !== "ready" ? (
              isUserLoading ? (
                <div className="absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md">
                  <Loader2 className="animate-spin size-5" />
                </div>
              ) : (
                <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md" />
              )
            ) : null}
          </Card>
        </Link>

        <Link
          href="/stamp-register"
          className="group block"
          onNavigate={(e) => {
            if (authState.status !== "ready") {
              e.preventDefault(); // blocks Next navigation [web:309]
              toast.info(tToast("SecuredService"), {
                description: tToast("PleaseLoginToAccessServiceDesc"),
              });
            }
          }}
        >
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md relative">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                {/* replace with your own icon */}
                <span className="font-semibold">
                  <Layers className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2">
                <CardTitle className={clsx("leading-6")}>
                  {tStampRegister("Title")}
                </CardTitle>
                <CardDescription className="">
                  {tStampRegister("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
            {authState.status !== "ready" ? (
              isUserLoading ? (
                <div className="absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md">
                  <Loader2 className="animate-spin size-5" />
                </div>
              ) : (
                <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md" />
              )
            ) : null}
          </Card>
        </Link>
        <Link
          href="/photocopy-register"
          className="group block"
          onNavigate={(e) => {
            if (authState.status !== "ready") {
              e.preventDefault(); // blocks Next navigation [web:309]
              toast.info(tToast("SecuredService"), {
                description: tToast("PleaseLoginToAccessServiceDesc"),
              });
            }
          }}
        >
          <Card className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md relative">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300">
                {/* replace with your own icon */}
                <span className="font-semibold">
                  <Newspaper className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2">
                <CardTitle className={clsx("leading-6")}>
                  {tPhotocopyRegister("Title")}
                </CardTitle>
                <CardDescription className="">
                  {tPhotocopyRegister("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
            {authState.status !== "ready" ? (
              isUserLoading ? (
                <div className="absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md">
                  <Loader2 className="animate-spin size-5" />
                </div>
              ) : (
                <LockKeyholeIcon className="size-7 absolute top-4 right-4 text-primary bg-primary/10 p-1 rounded-md" />
              )
            ) : null}
          </Card>
        </Link>
      </div>
      <div id="recaptcha-container" className="hidden"></div>
    </section>
  );
}
