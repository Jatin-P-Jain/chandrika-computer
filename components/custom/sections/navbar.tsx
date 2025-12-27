// components/navbar.tsx
"use client";

import Link from "next/link";
import { ThemeModeToggle } from "../action-items/theme-mode-button";
import { LocaleToggle } from "../action-items/locale-toggle";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import MobilePreferences, { Preferences } from "../preferences";

export function Navbar() {
  const tCommon = useTranslations("Common");
  return (
    <header className="w-full shadow-md bg-card dark:shadow-primary/10">
      <div className="mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8 text-primary">
        {/* Left: logo + name */}
        <Link href="/" className="flex items-center gap-2 md:gap-4">
          {/* Replace with <Image> or svg logo as needed */}
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold border-2">
            Ch
          </div>
          <span className="text-lg md:text-xl font-semibold md:font-bold underline underline-offset-3">
            {tCommon("ChandrikaComputer")}
          </span>
        </Link>

        <Preferences />
      </div>
    </header>
  );
}
