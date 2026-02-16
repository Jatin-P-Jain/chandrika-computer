"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "../../ui/button";
import { Loader2 } from "lucide-react";

const COOKIE_NAME = "CHANDRIKA_COMPUTER_LOCALE";

function getCookieValue(name: string) {
  const matches = document.cookie
    .split("; ")
    .filter((c) => c.startsWith(`${name}=`))
    .map((c) => c.split("=").slice(1).join("="));

  return matches.length ? matches[matches.length - 1] : undefined;
}

function setLocaleCookie(locale: string) {
  // Keep SameSite=Lax (good default for a locale preference cookie)
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function getInitialLocale(): "en" | "hi" {
  const v = getCookieValue(COOKIE_NAME);
  if (v === "en" || v === "hi") return v;

  const browser = navigator.language.slice(0, 2);
  return browser === "hi" ? "hi" : "en";
}

export function LocaleToggle({ labelClassName }: { labelClassName: string }) {
  const router = useRouter();
  const tCommon = useTranslations("Common");

  const [locale, setLocale] = useState<"en" | "hi">(() => getInitialLocale());
  const [isPending, startTransition] = useTransition();

  const toggleLocale = (nextLocale: "en" | "hi") => {
    if (nextLocale === locale) return;

    // 1) Write cookie synchronously so refresh sees the new locale immediately
    setLocaleCookie(nextLocale);

    // 2) Update button UI state immediately
    setLocale(nextLocale);

    // 3) Refresh in a transition so we can show loading feedback [web:321][web:330]
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div
      className="flex w-full gap-4 items-center justify-between"
      aria-label="Toggle language"
    >
      <span className={labelClassName}>{tCommon("Language")}: </span>
      {isPending ? (
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
        </span>
      ) : null}

      <div className="flex gap-2 md:gap-4 items-center">
        <Button
          disabled={isPending}
          variant={locale === "hi" ? "default" : "outline"}
          onClick={() => toggleLocale("hi")}
        >
          {tCommon("Hindi")}
        </Button>

        <Button
          disabled={isPending}
          variant={locale === "en" ? "default" : "outline"}
          onClick={() => toggleLocale("en")}
        >
          {tCommon("English")}
        </Button>
      </div>
    </div>
  );
}
