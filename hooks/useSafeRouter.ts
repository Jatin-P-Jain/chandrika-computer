"use client";

import { useRouter } from "nextjs-toploader/app";
import { useNavigationLock } from "@/context/navigation-lock-provider";
import { useCallback } from "react";

interface SafeRouterOptions {
  allowDuringNav?: boolean;
  skipLock?: boolean;
  scroll?: boolean;
}

export function useSafeRouter() {
  const router = useRouter();
  const { isNavigating, lock } = useNavigationLock();

  const push = useCallback(
    (href: string, options?: SafeRouterOptions) => {
      const {
        allowDuringNav = false,
        skipLock = false,
        ...navigateOptions
      } = options || {};

      // Block navigation if already navigating (unless explicitly allowed)
      if (isNavigating && !allowDuringNav) {
        return;
      }

      // Lock navigation unless explicitly skipped
      if (!skipLock) {
        lock();
      }

      router.push(href, navigateOptions);
    },
    [router, isNavigating, lock]
  );

  const replace = useCallback(
    (href: string, options?: SafeRouterOptions) => {
      const {
        allowDuringNav = false,
        skipLock = false,
        ...navigateOptions
      } = options || {};

      // Block navigation if already navigating (unless explicitly allowed)
      if (isNavigating && !allowDuringNav) {
        return;
      }

      // Lock navigation unless explicitly skipped
      if (!skipLock) {
        lock();
      }

      router.replace(href, navigateOptions);
    },
    [router, isNavigating, lock]
  );

  const back = useCallback(
    (options?: Pick<SafeRouterOptions, "allowDuringNav" | "skipLock">) => {
      const { allowDuringNav = false, skipLock = false } = options || {};

      if (isNavigating && !allowDuringNav) {
        return;
      }

      if (!skipLock) {
        lock();
      }

      router.back();
    },
    [router, isNavigating, lock]
  );

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    push,
    replace,
    back,
    refresh,
    isNavigating,
  };
}
