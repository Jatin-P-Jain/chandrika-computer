"use client";

import { useEffect, useRef, useCallback } from "react";

const DRAWER_SENTINEL_KEY = "drawer-back-sentinel";

export function useDrawerBackButton(isOpen: boolean, onClose: () => void) {
  const sentinelPushedRef = useRef(false);
  const navigationMarkedRef = useRef(false);

  // Push sentinel when drawer opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!sentinelPushedRef.current && typeof window !== "undefined") {
      // Push a sentinel state to history
      window.history.pushState(
        { [DRAWER_SENTINEL_KEY]: true },
        "",
        window.location.href
      );
      sentinelPushedRef.current = true;
      navigationMarkedRef.current = false;
    }
  }, [isOpen]);

  // Handle popstate (back button)
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePopState = (e: PopStateEvent) => {
      // Check if this is our sentinel state
      if (e.state && e.state[DRAWER_SENTINEL_KEY]) {
        // This should not happen as we consumed it
        return;
      }

      // Back button pressed while drawer is open - close drawer
      // Push sentinel back since user went back
      window.history.pushState(
        { [DRAWER_SENTINEL_KEY]: true },
        "",
        window.location.href
      );
      onClose();
      e.preventDefault();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose]);

  // Clean up sentinel when drawer closes
  useEffect(() => {
    if (isOpen || !sentinelPushedRef.current) {
      return;
    }

    // Drawer closed normally (not by back button)
    // Consume the sentinel by going back if not marked as navigated
    if (!navigationMarkedRef.current && typeof window !== "undefined") {
      window.history.back();
    }

    sentinelPushedRef.current = false;
    navigationMarkedRef.current = false;
  }, [isOpen]);

  // Mark that a navigation happened inside drawer
  // Call this before router.push() inside drawer to prevent cleanup from undoing it
  const markNavigated = useCallback(() => {
    navigationMarkedRef.current = true;
  }, []);

  return { markNavigated };
}
