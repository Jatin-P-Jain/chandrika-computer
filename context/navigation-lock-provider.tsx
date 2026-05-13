"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationLockContextType {
  isNavigating: boolean;
  lock: () => void;
  unlock: () => void;
}

const NavigationLockContext = createContext<NavigationLockContextType | null>(
  null,
);

const FAILSAFE_TIMEOUT = 3000; // 3 seconds failsafe, typically unlock happens on route change

export function NavigationLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRouteRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);

  // Track URL changes to detect successful navigation
  useEffect(() => {
    const currentRoute = `${pathname}?${searchParams.toString()}`;

    // On first render, just set the initial route
    if (isFirstRenderRef.current) {
      previousRouteRef.current = currentRoute;
      isFirstRenderRef.current = false;
      return;
    }

    // If URL changed and we were navigating, unlock
    if (
      isNavigating &&
      previousRouteRef.current !== null &&
      previousRouteRef.current !== currentRoute
    ) {
      setIsNavigating(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    previousRouteRef.current = currentRoute;
  }, [pathname, searchParams, isNavigating]);

  const lock = useCallback(() => {
    setIsNavigating(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set failsafe: unlock after 10s if URL never changes
    timeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      timeoutRef.current = null;
    }, FAILSAFE_TIMEOUT);
  }, []);

  const unlock = useCallback(() => {
    setIsNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <NavigationLockContext.Provider value={{ isNavigating, lock, unlock }}>
      {children}
    </NavigationLockContext.Provider>
  );
}

export function useNavigationLock() {
  const context = useContext(NavigationLockContext);
  if (!context) {
    throw new Error(
      "useNavigationLock must be used within NavigationLockProvider",
    );
  }
  return context;
}
