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
  Users,
  XIcon,
  CalendarHeart,
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
import { GoogleOneTap } from "../google-one-tap";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const tAttendanceRegister = useTranslations("AttendanceRegister");
  const tToast = useTranslations("Toast");
  const { textPageHeadCls, textBodyCls, textSmCls } = useLocaleTypography();

  const auth = useAuth();
  const {
    authState,
    completePhoneVerification,
    accessDenied,
    clearAccessDenied,
    authDebugEntries,
    clearAuthDebugEntries,
  } = auth;
  const isDev = process.env.NEXT_PUBLIC_AUTH_DIAGNOSTICS === "true";
  const isUserLoading = authState.status === "loading";
  const isPhoneVerification =
    authState.status === "first-time-setup" ||
    authState.status === "phone-verification-required";
  const currentUser = isPhoneVerification ? authState.currentUser : null;

  const [sessionExpiredDismissed, setSessionExpiredDismissed] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<
    | "/daily-accounts"
    | "/stamp-register"
    | "/photocopy-register"
    | "/attendace-register"
    | null
  >(null);
  const [diagnosticsPanelPosition, setDiagnosticsPanelPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDraggingDiagnostics, setIsDraggingDiagnostics] = useState(false);
  const diagnosticsPanelRef = useRef<HTMLDivElement | null>(null);
  const diagnosticsDragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const thisMonthHolidayDate = useMemo(() => {
    const now = new Date();
    const lastDateOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysFromSunday = lastDateOfMonth.getDay();
    const lastSunday = new Date(lastDateOfMonth);
    lastSunday.setDate(lastDateOfMonth.getDate() - daysFromSunday);

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(lastSunday);
  }, [locale]);

  const navigateTo = (
    path:
      | "/daily-accounts"
      | "/stamp-register"
      | "/photocopy-register"
      | "/attendace-register",
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

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        setShowLoadingOverlay(isUserLoading);
      },
      isUserLoading ? 250 : 0,
    );

    return () => window.clearTimeout(timeout);
  }, [isUserLoading]);

  useEffect(() => {
    if (!isDev) return;

    setDiagnosticsPanelPosition((current) => {
      if (current) return current;

      const panelWidth = diagnosticsPanelRef.current?.offsetWidth ?? 320;
      return {
        x: Math.max(8, window.innerWidth - panelWidth - 16),
        y: 96,
      };
    });
  }, [isDev]);

  useEffect(() => {
    if (!isDev || !diagnosticsPanelPosition) return;

    const clampToViewport = () => {
      const panelWidth = diagnosticsPanelRef.current?.offsetWidth ?? 320;
      const panelHeight = diagnosticsPanelRef.current?.offsetHeight ?? 176;
      setDiagnosticsPanelPosition((current) => {
        if (!current) return current;

        return {
          x: Math.min(
            Math.max(8, current.x),
            Math.max(8, window.innerWidth - panelWidth - 8),
          ),
          y: Math.min(
            Math.max(8, current.y),
            Math.max(8, window.innerHeight - panelHeight - 8),
          ),
        };
      });
    };

    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [diagnosticsPanelPosition, isDev]);

  useEffect(() => {
    if (!isDraggingDiagnostics) return;

    const onWindowPointerMove = (event: PointerEvent) => {
      const dragState = diagnosticsDragRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      if (event.pointerType === "touch") {
        event.preventDefault();
      }

      const panelWidth = diagnosticsPanelRef.current?.offsetWidth ?? 320;
      const panelHeight = diagnosticsPanelRef.current?.offsetHeight ?? 176;
      const nextX = event.clientX - dragState.offsetX;
      const nextY = event.clientY - dragState.offsetY;

      setDiagnosticsPanelPosition({
        x: Math.min(
          Math.max(8, nextX),
          Math.max(8, window.innerWidth - panelWidth - 8),
        ),
        y: Math.min(
          Math.max(8, nextY),
          Math.max(8, window.innerHeight - panelHeight - 8),
        ),
      });
    };

    const onWindowPointerEnd = (event: PointerEvent) => {
      if (diagnosticsDragRef.current?.pointerId !== event.pointerId) return;

      diagnosticsDragRef.current = null;
      setIsDraggingDiagnostics(false);
    };

    window.addEventListener("pointermove", onWindowPointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
    };
  }, [isDraggingDiagnostics]);

  const onDiagnosticsPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const panel = diagnosticsPanelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    diagnosticsDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setIsDraggingDiagnostics(true);
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onDiagnosticsPointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (diagnosticsDragRef.current?.pointerId !== event.pointerId) return;

    diagnosticsDragRef.current = null;
    setIsDraggingDiagnostics(false);
    if (
      event.currentTarget.hasPointerCapture &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="flex w-full flex-col mx-auto rounded-xl bg-muted shadow-sm gap-4 no-scrollbar p-3 md:p-6 relative">
      <GoogleOneTap />
      {sessionExpired === "1" && !sessionExpiredDismissed && (
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
              setSessionExpiredDismissed(true);
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
            <span className={clsx("text-xs md:text-sm", textBodyCls)}>
              {tCommon("DeniedAccessDesc")}
            </span>
          </div>
          <XIcon
            className="inline size-5 absolute -right-1 -top-1 cursor-pointer p-1 bg-white text-red-900 rounded-full border-red-300 border"
            onClick={clearAccessDenied}
          />
        </div>
      )}

      {authState.status !== "ready" && !isPhoneVerification && (
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

      <p
        className={clsx(
          "px-2 text-xs font-medium text-primary/80 gap-2 flex items-center w-full justify-center",
          textSmCls,
        )}
      >
        <span className={clsx("flex items-center gap-2")}>
          <CalendarHeart className="size-5 text-red-700" />{" "}
          {tHomePage("MonthlyHolidayPrefix")}{" "}
        </span>
        <span
          className={clsx("text-sm font-semibold text-red-700", textBodyCls)}
        >
          {thisMonthHolidayDate}
        </span>
        <span> {tHomePage("MonthlyHolidaySuffix")}</span>
      </p>

      {showLoadingOverlay && (
        <div className="flex justify-center items-center w-full h-full absolute z-10 bg-muted-foreground/30 top-0 left-0 rounded-md">
          <div className="flex flex-col gap-2 justify-center items-center bg-white dark:bg-black/90 p-2 rounded-md">
            <Loader2 className="animate-spin size-8 text-primary" />
            <span className="text-primary font-bold">{tCommon("Loading")}</span>
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

        <div
          className="group block cursor-pointer"
          onClick={() => navigateTo("/attendace-register")}
        >
          <Card
            className={clsx(
              "h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md",
              pendingRoute === "/attendace-register" &&
                "opacity-70 pointer-events-none",
            )}
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex p-4 size-12 md:size-16 items-center justify-center rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                <span className="font-semibold">
                  <Users className="size-8" />
                </span>
              </div>
              <div className="flex flex-col gap-1 md:gap-2 w-full">
                <CardTitle
                  className={clsx(
                    "leading-6 flex items-start justify-between w-full text-lg",
                  )}
                >
                  {tAttendanceRegister("Title")}
                  {pendingRoute === "/attendace-register" ? (
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
                  {tAttendanceRegister("Desc")}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
      <div id="recaptcha-container" className="hidden"></div>

      {isDev ? (
        <div
          ref={diagnosticsPanelRef}
          className={clsx(
            "fixed top-24 right-4 z-50 w-80 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur select-none touch-none",
            isDraggingDiagnostics ? "cursor-grabbing" : "cursor-grab",
          )}
          style={
            diagnosticsPanelPosition
              ? {
                  left: diagnosticsPanelPosition.x,
                  top: diagnosticsPanelPosition.y,
                  right: "auto",
                }
              : undefined
          }
          onPointerDown={onDiagnosticsPointerDown}
          onPointerUp={onDiagnosticsPointerEnd}
          onPointerCancel={onDiagnosticsPointerEnd}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              Auth Diagnostics
            </p>
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-2"
              onClick={clearAuthDebugEntries}
            >
              Reset
            </button>
          </div>
          <p className="mb-1 text-[11px] text-muted-foreground">
            {`status: ${authState.status}`}
          </p>

          {authDebugEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No auth diagnostics yet
            </p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-auto pr-1">
              {authDebugEntries.map((entry) => (
                <p key={entry.id} className="text-xs leading-snug">
                  <span className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}:
                  </span>{" "}
                  <span>{entry.message}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
