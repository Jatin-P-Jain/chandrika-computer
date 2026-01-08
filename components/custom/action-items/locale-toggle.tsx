"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";

const COOKIE_NAME = "CHANDRIKA_COMPUTER_LOCALE";

function getCookieValue(name: string) {
  // If duplicates exist, collect all and pick the last one found (more stable than .find()).
  const matches = document.cookie
    .split("; ")
    .filter((c) => c.startsWith(`${name}=`))
    .map((c) => c.split("=").slice(1).join("="));

  return matches.length ? matches[matches.length - 1] : undefined;
}

function setLocaleCookie(locale: string) {
  // Path=/ ensures a single cookie is used across all routes. [web:77][web:76]
  document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LocaleToggle({ labelClassName }: { labelClassName: string }) {
  const router = useRouter();
  const [locale, setLocale] = useState("");
  const tCommon = useTranslations("Common");

  const toggleLocale = (localeString: string) => {
    setLocale(localeString);
    setLocaleCookie(localeString);

    router.refresh();
  };

  useEffect(() => {
    const cookieLocale = getCookieValue(COOKIE_NAME);

    if (cookieLocale) {
      setLocale(cookieLocale);
      // Ensure it exists at Path=/ (normalize to one cookie). [web:76][web:77]
      setLocaleCookie(cookieLocale);
      return;
    }

    const browserLocale = navigator.language.slice(0, 2);
    setLocale(browserLocale);
    setLocaleCookie(browserLocale);
    router.refresh();
  }, [router]);

  return (
    <div
      className="flex w-full gap-4 items-center justify-between"
      aria-label="Toggle language"
    >
      <span className={labelClassName}>{tCommon("Language")}: </span>
      <div className="flex gap-2 md:gap-4">
        <Button
          variant={locale === "hi" ? "default" : "outline"}
          onClick={() => toggleLocale("hi")}
        >
          {tCommon("Hindi")}
        </Button>
        <Button
          variant={locale === "en" ? "default" : "outline"}
          onClick={() => toggleLocale("en")}
        >
          {tCommon("English")}
        </Button>
      </div>
    </div>
  );
}
