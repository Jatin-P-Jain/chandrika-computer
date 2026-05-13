"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "../../ui/button";
import { Loader2 } from "lucide-react";

const COOKIE_NAME = "CHANDRIKA_COMPUTER_LOCALE";

function setLocaleCookie(locale: string) {
  // Keep SameSite=Lax (good default for a locale preference cookie)
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LocaleToggle({ labelClassName }: { labelClassName: string }) {
  const tCommon = useTranslations("Common");
  const locale = useLocale() as "en" | "hi";
  const [pendingLocale, setPendingLocale] = useState<"en" | "hi" | null>(null);
  const activeLocale = pendingLocale ?? locale;
  const isPending = pendingLocale !== null;

  const toggleLocale = (nextLocale: "en" | "hi") => {
    if (nextLocale === activeLocale) return;

    // Persist the locale before reloading so the next request renders correctly.
    setLocaleCookie(nextLocale);
    setPendingLocale(nextLocale);

    window.location.reload();
  };

  return (
    <div
      className="flex w-full gap-4 items-center justify-between"
      aria-label="Toggle language"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <span className={labelClassName}>{tCommon("Language")}: </span>
      {isPending ? (
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
        </span>
      ) : null}

      <div className="flex gap-2 md:gap-4 items-center">
        <Button
          type="button"
          disabled={isPending}
          variant={activeLocale === "hi" ? "default" : "outline"}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleLocale("hi");
          }}
          onClick={() => toggleLocale("hi")}
        >
          {tCommon("Hindi")}
        </Button>

        <Button
          type="button"
          disabled={isPending}
          variant={activeLocale === "en" ? "default" : "outline"}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleLocale("en");
          }}
          onClick={() => toggleLocale("en")}
        >
          {tCommon("English")}
        </Button>
      </div>
    </div>
  );
}
