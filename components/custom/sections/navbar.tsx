// components/navbar.tsx
"use client";

import Link from "next/link";
import { ThemeModeToggle } from "../action-items/theme-mode-button";
import { LocaleToggle } from "../action-items/locale-toggle";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function Navbar() {
  const tCommon = useTranslations("Common");
  return (
    <header className="w-full shadow-md bg-card">
      <div className="mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: logo + name */}
        <Link href="/" className="flex items-center gap-4">
          {/* Replace with <Image> or svg logo as needed */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            C
          </div>
          <span className="text-2xl font-bold underline underline-offset-3">
            {tCommon("ChandrikaComputer")}
          </span>
        </Link>

        {/* Right: action buttons */}
        <div className="flex items-center gap-3">
          <ThemeModeToggle />
          <Separator orientation="vertical" className="h-8!" />
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}
