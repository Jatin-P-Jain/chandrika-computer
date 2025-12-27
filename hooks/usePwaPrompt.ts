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

export function usePwaPrompt() {
  const [isPwa, setIsPwa] = useState(false);

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      setIsPwa(standalone);
    }
  }, []);
  useEffect(() => {
    const handler = (e: unknown) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptToInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice; // Optionally handle outcome
    setDeferredPrompt(null);
  };

  return { deferredPrompt, promptToInstall, isPwa };
}
