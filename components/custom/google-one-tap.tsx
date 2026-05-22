"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/useAuth";
import {
  GOOGLE_EMAIL_DENIED_ERROR_CODE,
  GoogleEmailNotAllowedError,
} from "@/lib/auth/firebase-auth";
import { markOneTapAsFinished } from "@/hooks/useOneTapReady";

const GOOGLE_GSI_SRC = "https://accounts.google.com/gsi/client";
const ONE_TAP_COOLDOWN_KEY = "google_one_tap_last_prompt_at";
const ONE_TAP_COOLDOWN_MS = 2 * 60 * 1000;

function wasPromptedRecently() {
  if (typeof window === "undefined") return false;
  const raw = window.sessionStorage.getItem(ONE_TAP_COOLDOWN_KEY);
  if (!raw) return false;
  const lastTs = Number(raw);
  if (Number.isNaN(lastTs)) return false;
  return Date.now() - lastTs < ONE_TAP_COOLDOWN_MS;
}

function markPromptAttempted() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ONE_TAP_COOLDOWN_KEY, String(Date.now()));
}

function isDeniedError(error: unknown) {
  if (error instanceof GoogleEmailNotAllowedError) return true;
  if (typeof error === "object" && error !== null && "code" in error) {
    return error.code === GOOGLE_EMAIL_DENIED_ERROR_CODE;
  }
  return false;
}

export function GoogleOneTap() {
  const { authState, accessDenied, loginWithGoogleOneTap } = useAuth();
  const [scriptReady, setScriptReady] = useState(false);
  const initializingRef = useRef(false);

  const clientId = useMemo(
    () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "",
    [],
  );

  useEffect(() => {
    if (!scriptReady || !clientId) return;
    if (authState.status !== "no-user") return;
    if (accessDenied) return;
    if (initializingRef.current) return;
    if (wasPromptedRecently()) return;

    if (!window.google?.accounts?.id) return;

    initializingRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: true,
      cancel_on_tap_outside: false,
      context: "signin",
      callback: async ({ credential }) => {
        if (!credential) {
          markOneTapAsFinished();
          return;
        }

        try {
          await loginWithGoogleOneTap(credential);
        } catch (error) {
          if (!isDeniedError(error)) {
            console.error("Google One Tap sign-in failed", error);
          }
        } finally {
          markOneTapAsFinished();
        }
      },
    });

    markPromptAttempted();
    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        markOneTapAsFinished();
      }
    });

    return () => {
      try {
        window.google.accounts.id.cancel();
      } catch {
        // Ignore when script is partially available during fast route transitions.
      }
      initializingRef.current = false;
    };
  }, [
    accessDenied,
    authState.status,
    clientId,
    loginWithGoogleOneTap,
    scriptReady,
  ]);

  if (!clientId) return null;

  return (
    <Script
      src={GOOGLE_GSI_SRC}
      strategy="afterInteractive"
      onLoad={() => setScriptReady(true)}
      onError={() => {
        setScriptReady(false);
        console.error("Failed to load Google One Tap script");
      }}
    />
  );
}
