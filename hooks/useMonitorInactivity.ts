"use client";

import { useEffect } from "react";
import { logoutUser } from "@/context/firebase-auth";
import { removeToken } from "@/context/actions";
import { User } from "firebase/auth";

const LAST_ACTIVITY_KEY = "lastActivity";
const CHECK_INTERVAL_MS = 60 * 1000; // check every 1 minute

const log = (...args: string[]) => {
  console.log(`[${new Date().toISOString()}]`, ...args);
};

const useMonitorInactivity = (
  currentUser: User | null,
  INACTIVITY_LIMIT: number | undefined,
) => {
  useEffect(() => {
    if (!currentUser || !INACTIVITY_LIMIT) return;

    // log("⏳ Inactivity monitor initialized", {
    //   user: currentUser.uid,
    //   limitInSeconds: INACTIVITY_LIMIT / 1000,
    // });

    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      // log("✅ Activity recorded");
    };

    const checkInactivity = async () => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0");
      const now = Date.now();
      const diff = now - last;

      // log("🔍 Checking inactivity:", {
      //   lastActivity: new Date(last).toLocaleString(),
      //   now: new Date(now).toLocaleString(),
      //   diffInSeconds: diff / 1000,
      // });

      if (diff >= INACTIVITY_LIMIT) {
        log("⛔ User is inactive. Logging out...");
        try {
          await logoutUser();
          await removeToken();
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          window.location.href = "/login?sessionExpired=1";
        } catch (err) {
          console.error("Logout failed due to inactivity:", err);
        }
      }
    };

    // Run once on mount to catch inactive session on reload/resume
    updateLastActivity();
    checkInactivity();

    // Watch activity events
    const activityEvents = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    activityEvents.forEach((event) =>
      window.addEventListener(event, updateLastActivity, { passive: true }),
    );

    // Check periodically
    const interval = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Check again when tab becomes visible
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Cleanup
    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, updateLastActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
      log("🧹 Inactivity monitor cleaned up");
    };
  }, [currentUser, INACTIVITY_LIMIT]);
};

export default useMonitorInactivity;
