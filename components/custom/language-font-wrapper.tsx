"use client";
import clsx from "clsx";
import { useLocale } from "next-intl";
import { ReactNode } from "react";

interface LanguageFontWrapperProps {
  children: ReactNode;
}

export function LanguageFontWrapper({ children }: LanguageFontWrapperProps) {
  const locale = useLocale();
  return (
    <div className={clsx(locale === "hi" ? "font-hi font-medium" : "font-en")}>
      {children}
    </div>
  );
}
