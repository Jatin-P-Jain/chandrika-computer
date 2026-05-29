"use client";

import { useEffect, useRef, useCallback } from "react";

const DRAWER_SENTINEL_KEY = "drawer-back-sentinel";

/**
 * Intercepts the mobile/browser back button while an overlay (drawer, dialog,
 * sheet) is open and closes the overlay instead of navigating away.
 *
 * How it works:
 *  - On open  → push a sentinel history entry (same URL, no visible navigation)
 *  - Back btn → popstate fires → call onClose(); skip cleanup's history.back()
 *  - On close → call history.back() to consume the sentinel entry we pushed
 *  - markNavigated() → call before router.push() inside the overlay so the
 *    cleanup doesn't undo the real navigation
 */
export function useDrawerBackButton(isOpen: boolean, onClose: () => void) {
  const sentinelPushedRef = useRef(false);
  // True when the overlay was closed by the back button (or markNavigated was
  // called). In that case the sentinel is already gone so we must NOT call
  // history.back() in the cleanup effect.
  const skipCleanupBackRef = useRef(false);

  // Push sentinel when overlay opens
  useEffect(() => {
    if (!isOpen) return;

    if (!sentinelPushedRef.current && typeof window !== "undefined") {
      window.history.pushState(
        { [DRAWER_SENTINEL_KEY]: true },
        "",
        window.location.href
      );
      sentinelPushedRef.current = true;
      skipCleanupBackRef.current = false;
    }
  }, [isOpen]);

  // Listen for the back button while the overlay is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      // Back button consumed our sentinel — mark so the cleanup effect won't
      // call history.back() a second time.
      skipCleanupBackRef.current = true;
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose]);

  // When the overlay closes normally (X button, backdrop, swipe, etc.) remove
  // the sentinel entry we pushed so it doesn't pollute the history stack.
  useEffect(() => {
    if (isOpen || !sentinelPushedRef.current) return;

    sentinelPushedRef.current = false;

    if (!skipCleanupBackRef.current && typeof window !== "undefined") {
      window.history.back();
    }

    skipCleanupBackRef.current = false;
  }, [isOpen]);

  /**
   * Call this before programmatic navigation (router.push) that happens while
   * the overlay is open, so the cleanup effect doesn't fire history.back() and
   * undo the real navigation.
   */
  const markNavigated = useCallback(() => {
    skipCleanupBackRef.current = true;
  }, []);

  return { markNavigated };
}
