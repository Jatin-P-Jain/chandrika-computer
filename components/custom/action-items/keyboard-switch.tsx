"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { useKeyboard } from "@/context/keyboard-context";

const COOKIE_NAME = "CHANDRIKA_COMPUTER_KEYBOARD";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.split("=")[1] || "") : null;
}

function setCookie(name: string, value: string) {
  // cookie for entire site
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function KeyboardSwitch({ labelClassName }: { labelClassName: string }) {
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const { isHindiActive, setIsHindiActive } = useKeyboard();

  // On mount: sync switch state from cookie (fallback: browser locale)
  useEffect(() => {
    const cookieValue = getCookie(COOKIE_NAME);

    if (cookieValue === "hi") {
      setIsHindiActive(true);
      return;
    }

    if (cookieValue === "en") {
      setIsHindiActive(false);
      return;
    }

    // No cookie: default from browser language
    const browserLocale = navigator.language.slice(0, 2);
    const defaultIsHindi = browserLocale === "hi";

    setIsHindiActive(defaultIsHindi);
    setCookie(COOKIE_NAME, defaultIsHindi ? "hi" : "en");
    router.refresh();
  }, [router, setIsHindiActive]);

  const onToggle = (checked: boolean) => {
    setIsHindiActive(checked);
    setCookie(COOKIE_NAME, checked ? "hi" : "en");
    router.refresh();
  };

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className={labelClassName}>{tCommon("HindiKeyboard")}:</span>

      <Switch
        className="cursor-pointer"
        checked={isHindiActive}
        onCheckedChange={onToggle}
        aria-label={tCommon("HindiKeyboard")}
      />
    </div>
  );
}
