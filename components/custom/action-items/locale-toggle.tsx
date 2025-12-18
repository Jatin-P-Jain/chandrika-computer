"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";

export function LocaleToggle() {
  const router = useRouter();
  const [locale, setLocale] = useState("");
  const tCommon = useTranslations("Common");

  const toggleLocale = (localeString: string) => {
    setLocale(localeString);
    document.cookie = `CHANDRIKA_COMPUTER_LOCALE=${localeString};`;
    router.refresh();
  };

  useEffect(() => {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("CHANDRIKA_COMPUTER_LOCALE="))
      ?.split("=")[1];
    if (cookieLocale) setLocale(cookieLocale);
    else {
      const browserLocale = navigator.language.slice(0, 2);
      setLocale(browserLocale);
      document.cookie = `CHANDRIKA_COMPUTER_LOCALE=${browserLocale};`;
      router.refresh();
    }
  }, [router]);

  return (
    <div
      className="flex w-fit mx-auto gap-4 items-center justify-between"
      aria-label="Toggle language"
    >
      <span className="">{tCommon("Language")}: </span>
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
  );
}
