import { useEffect, useState } from "react";

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type PwaDiagnostics = {
  secureContext: boolean;
  hasManifestLink: boolean;
  hasServiceWorkerSupport: boolean;
  hasServiceWorkerController: boolean;
  beforeInstallPromptCaptured: boolean;
  supportsBeforeInstallPrompt: boolean;
  isMobile: boolean;
  isAndroidChrome: boolean;
};

export function usePwaPrompt() {
  const [isPwa, setIsPwa] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  });
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [diagnostics, setDiagnostics] = useState<PwaDiagnostics>(() => {
    if (typeof window === "undefined") {
      return {
        secureContext: false,
        hasManifestLink: false,
        hasServiceWorkerSupport: false,
        hasServiceWorkerController: false,
        beforeInstallPromptCaptured: false,
        supportsBeforeInstallPrompt: false,
        isMobile: false,
        isAndroidChrome: false,
      };
    }
    const ua = navigator.userAgent;
    return {
      secureContext: window.isSecureContext,
      hasManifestLink: !!document.querySelector('link[rel="manifest"]'),
      hasServiceWorkerSupport: "serviceWorker" in navigator,
      hasServiceWorkerController: !!navigator.serviceWorker?.controller,
      beforeInstallPromptCaptured: false,
      supportsBeforeInstallPrompt: "onbeforeinstallprompt" in window,
      isMobile: /Mobi|Android/i.test(ua),
      isAndroidChrome:
        /Android/i.test(ua) &&
        /Chrome/i.test(ua) &&
        !/SamsungBrowser/i.test(ua),
    };
  });

  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      const event = e as unknown as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(event);
      setDiagnostics((prev) => ({
        ...prev,
        beforeInstallPromptCaptured: true,
      }));
    };

    const appInstalledHandler = () => {
      setIsPwa(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    window.addEventListener("appinstalled", appInstalledHandler);

    // Update service worker status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          setDiagnostics((prev) => ({
            ...prev,
            hasServiceWorkerController: !!navigator.serviceWorker.controller,
          }));
        })
        .catch(() => {
          // Silently handle errors.
        });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallPromptHandler
      );
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const promptToInstall = async (): Promise<
    "accepted" | "dismissed" | null
  > => {
    if (!deferredPrompt) return null;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return outcome;
    } catch {
      return null;
    }
  };

  const canInstall = Boolean(deferredPrompt) && !isPwa;

  return {
    deferredPrompt,
    promptToInstall,
    isPwa,
    canInstall,
    diagnostics,
  };
}
