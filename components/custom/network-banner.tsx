"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { XCircle } from "lucide-react";

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g" | string;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
}

export default function NetworkBanner() {
  const tCommon = useTranslations("Common");
  const [isOffline, setIsOffline] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [dismissedState, setDismissedState] = useState<
    "offline" | "slow" | null
  >(null);

  useEffect(() => {
    const updateNetworkStatus = () => {
      const nextIsOffline = !navigator.onLine;

      const nav = window.navigator as NavigatorWithConnection;
      const connection = nav.connection;
      const nextIsSlowConnection =
        !nextIsOffline && Boolean(connection?.effectiveType)
          ? ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "")
          : false;

      setIsOffline(nextIsOffline);
      setIsSlowConnection(nextIsSlowConnection);

      const nextBannerState: "offline" | "slow" | null = nextIsOffline
        ? "offline"
        : nextIsSlowConnection
          ? "slow"
          : null;

      setDismissedState((prev) =>
        prev !== null && prev !== nextBannerState ? null : prev,
      );
    };

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    const nav = window.navigator as NavigatorWithConnection;
    if (nav.connection?.addEventListener) {
      nav.connection.addEventListener("change", updateNetworkStatus);
    }

    updateNetworkStatus();

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      if (nav.connection?.removeEventListener) {
        nav.connection.removeEventListener("change", updateNetworkStatus);
      }
    };
  }, []);

  const bannerState: "offline" | "slow" | null = isOffline
    ? "offline"
    : isSlowConnection
      ? "slow"
      : null;

  if (bannerState === null || dismissedState === bannerState) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        "fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-xl p-1 rounded-md shadow-sm text-white text-center text-sm md:top-20 md:text-base",
        isOffline ? "bg-red-600" : isSlowConnection ? "bg-amber-500" : "",
      )}
    >
      <Button
        variant={"link"}
        aria-label="Dismiss network banner"
        onClick={() => setDismissedState(bannerState)}
        className="absolute top-0 right-0 rounded"
      >
        <XCircle className="text-muted" />
      </Button>
      <div className="font-semibold pr-7">
        {isOffline ? tCommon("NoInternet") : tCommon("SlowInternet")}
      </div>
      <div className="pr-7">
        {isOffline ? tCommon("NoInternetDesc") : tCommon("SlowInternetDesc")}
      </div>
    </div>
  );
}
