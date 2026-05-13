"use client";

import { useSafeRouter } from "@/hooks/useSafeRouter";
import {
  ClipboardListIcon,
  CircleAlert,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";

export function HomePage({ sessionExpired }: { sessionExpired?: string }) {
  const { push, replace } = useSafeRouter();
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const tHomePage = useTranslations("HomePage");
  const tDailyAccount = useTranslations("DailyAccount");
  const tStampRegister = useTranslations("StampRegister");
  const tPhotocopyRegister = useTranslations("PhotocopyRegister");
  const tToast = useTranslations("Toast");
  const { textPageHeadCls, textBodyCls } = useLocaleTypography();

  const auth = useAuth();
  const {
    authState,
    completePhoneVerification,
    accessDenied,
    clearAccessDenied,
  } = auth;
  const isUserLoading = authState.status === "loading";
  const isPhoneVerification =
    authState.status === "first-time-setup" ||
    authState.status === "phone-verification-required";
  const currentUser = isPhoneVerification ? authState.currentUser : null;

  const [sessionExpiredPopupShown, setSessionExpiredPopupShown] = useState(
    sessionExpired === "1",
  );
  const [pendingRoute, setPendingRoute] = useState<
    "/daily-accounts" | "/stamp-register" | "/photocopy-register" | null
  >(null);

  const navigateTo = (
    path: "/daily-accounts" | "/stamp-register" | "/photocopy-register",
  ) => {
    if (pendingRoute) return;
    if (authState.status !== "ready") {
      toast.info(tToast("SecuredService"), {
        description: tToast("PleaseLoginToAccessServiceDesc"),
      });
      return;
    }
    setPendingRoute(path);
    push(path);
  };

  useEffect(() => {
    if (sessionExpired !== "1") return;
    if (authState.status !== "ready") return;

    replace("/", {
      scroll: false,
      skipLock: true,
      allowDuringNav: true,
    });
  }, [authState.status, replace, sessionExpired]);

  return (
    <section className="flex w-full flex-col mx-auto rounded-xl bg-muted shadow-sm gap-4 no-scrollbar p-3 md:p-6 relative">
      {sessionExpired && sessionExpiredPopupShown && (
        <div className="w-full relative flex justify-center items-center md:w-1/2 mx-auto p-3 text-sm text-yellow-700 bg-yellow-200 border border-yellow-200 rounded-md gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-center flex gap-2 justify-center items-center font-medium">
              <Info className="inline size-4" />
              <span className="text-sm font-medium md:text-base">
                {tHomePage("SessionExpiredMessage")}
              </span>
            </span>
            <span className="text-xs">
              {tHomePage("SessionExpiredMessageDesc")}
            </span>
          </div>
          <XIcon
            className="inline size-6 absolute -right-1 -top-1 cursor-pointer p-1 bg-white text-yellow-900 rounded-full border-yellow-300 border"
            onClick={() => {
              setSessionExpiredPopupShown(false);
              if (sessionExpired === "1") {
                replace("/", {
                  scroll: false,
                  skipLock: true,
                  allowDuringNav: true,
                });
              }
            }}
          />
        </div>
      )}
      {isPhoneVerification && authState.status && !accessDenied && (
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

      {accessDenied && authState.status !== "ready" && (
        <div className="w-full md:w-3/4 mx-auto relative flex items-start gap-2 p-3 text-red-800 bg-red-100 border border-red-200 rounded-md">
          <CircleAlert className="size-5 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span
              className={clsx(
                "text-sm md:text-base font-semibold",
                textPageHeadCls,
              )}
            >
              {tCommon("DeniedAccess")}
            </span>
            <span
              className={clsx(
                "text-xs md:text-sm",
                textBodyCls,
              )}
            >
              {tCommon("DeniedAccessDesc")}
            </span>
          </div>
          <XIcon
            className="inline size-5 absolute -right-1 -top-1 cursor-pointer p-1 bg-white text-red-900 rounded-full border-red-300 border"
            onClick={clearAccessDenied}
          />
        </div>
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
            <span className="text-foreground text-sm">
              {tHomePage("SecureServices")}
            </span>
            <p
              className={clsx(
                "text-xs text-justify",
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
        <div
          className="group block cursor-pointer"
          onClick={() => navigateTo("/daily-accounts")}
        >
          <Card
            className={clsx(
              "h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md",
              pendingRoute === "/daily-accounts" &&
                "opacity-70 pointer-events-none",
            )}
          >
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-indigo-100 text-indigo-900/90 ">
                {/* replace with your own icon */}
                <span className="">
                  <ClipboardListIcon className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2 items-start w-full">
                <CardTitle className="leading-6 flex items-start justify-between w-full text-lg">
                  {tDailyAccount("Title")}
                  {pendingRoute === "/daily-accounts" ? (
                    <div className="text-primary bg-primary/10 p-1 rounded-md">
                      <Loader2 className="animate-spin size-5" />
                    </div>
                  ) : authState.status !== "ready" ? (
                    isUserLoading ? (
                      <div className="text-primary bg-primary/10 p-1 rounded-md">
                        <Loader2 className="animate-spin size-5" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-1 bg-primary/10 rounded-md">
                        <LockKeyholeIcon className="size-5 text-primary rounded-md" />
                      </div>
                    )
                  ) : null}
                </CardTitle>
                <CardDescription className="">
                  {tDailyAccount("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div
          className="group block cursor-pointer"
          onClick={() => navigateTo("/stamp-register")}
        >
          <Card
            className={clsx(
              "h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md",
              pendingRoute === "/stamp-register" &&
                "opacity-70 pointer-events-none",
            )}
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                {/* replace with your own icon */}
                <span className="font-semibold">
                  <Layers className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2 w-full">
                <CardTitle
                  className={clsx(
                    "leading-6 flex items-start w-full justify-between text-lg",
                  )}
                >
                  {tStampRegister("Title")}
                  {pendingRoute === "/stamp-register" ? (
                    <div className="text-primary bg-primary/10 p-1 rounded-md">
                      <Loader2 className="animate-spin size-5" />
                    </div>
                  ) : authState.status !== "ready" ? (
                    isUserLoading ? (
                      <div className="text-primary bg-primary/10 p-1 rounded-md">
                        <Loader2 className="animate-spin size-5" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-1 bg-primary/10 rounded-md">
                        <LockKeyholeIcon className="size-5 text-primary rounded-md" />
                      </div>
                    )
                  ) : null}
                </CardTitle>
                <CardDescription className="">
                  {tStampRegister("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
        <div
          className="group block cursor-pointer"
          onClick={() => navigateTo("/photocopy-register")}
        >
          <Card
            className={clsx(
              "h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md",
              pendingRoute === "/photocopy-register" &&
                "opacity-70 pointer-events-none",
            )}
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300">
                {/* replace with your own icon */}
                <span className="font-semibold">
                  <Newspaper className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2 w-full">
                <CardTitle
                  className={clsx(
                    "leading-6 flex items-start justify-between w-full text-lg",
                  )}
                >
                  {tPhotocopyRegister("Title")}
                  {pendingRoute === "/photocopy-register" ? (
                    <div className="text-primary bg-primary/10 p-1 rounded-md">
                      <Loader2 className="animate-spin size-5" />
                    </div>
                  ) : authState.status !== "ready" ? (
                    isUserLoading ? (
                      <div className="text-primary bg-primary/10 p-1 rounded-md">
                        <Loader2 className="animate-spin size-5" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-1 bg-primary/10 rounded-md">
                        <LockKeyholeIcon className="size-5 text-primary rounded-md" />
                      </div>
                    )
                  ) : null}
                </CardTitle>
                <CardDescription className="">
                  {tPhotocopyRegister("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
      <div id="recaptcha-container" className="hidden"></div>
    </section>
  );
}
