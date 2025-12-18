"use client";
import Button from "@mui/material/Button";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LocaleToggle() {
  const router = useRouter();
  const [locale, setLocale] = useState("");
  const t = useTranslations("HomePage");

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
      className="flex w-fit mx-auto gap-8 items-center justify-between"
      aria-label="Toggle language"
    >
      <span className="">
        {t("Language")}:{" "}
        {locale === "en" ? t("English") : locale === "hi" ? t("Hindi") : "None"}
      </span>
      <Button
        variant={locale === "hi" ? "contained" : "outlined"}
        onClick={() => toggleLocale("hi")}
      >
        {t("Hindi")}
      </Button>
      <Button
        variant={locale === "en" ? "contained" : "outlined"}
        onClick={() => toggleLocale("en")}
      >
        {t("English")}
      </Button>
    </div>
  );
}
