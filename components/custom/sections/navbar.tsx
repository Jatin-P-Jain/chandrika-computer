// components/navbar.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Preferences } from "../preferences";
import { UserAccount } from "../user-account";

export function Navbar() {
  const tCommon = useTranslations("Common");
  return (
    <header className="fixed w-full bg-card z-20">
      <div className="mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8 text-primary py-4">
        {/* Left: logo + name */}
        <Link href="/" className="flex items-center gap-2 md:gap-4">
          {/* Replace with <Image> or svg logo as needed */}
          <div className="flex size-8 md:size-10  items-center justify-center rounded-full bg-primary/10 text-primary font-semibold border-2">
            Ch
          </div>
          <span className="text-base md:text-xl font-semibold md:font-bold underline underline-offset-3">
            {tCommon("ChandrikaComputer")}
          </span>
        </Link>
        <UserAccount />
      </div>
    </header>
  );
}
