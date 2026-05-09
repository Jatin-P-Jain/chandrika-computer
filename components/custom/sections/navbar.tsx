// components/navbar.tsx
"use client";

import { useTranslations } from "next-intl";
import { UserAccount } from "../user-account";
import Image from "next/image";
import { SafeLink } from "@/components/custom/SafeLink";

export function Navbar() {
  const tCommon = useTranslations("Common");
  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-card">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 text-primary md:h-18">
        {/* Left: logo + name */}
        <SafeLink href="/" className="flex items-center gap-1 md:gap-3 mr-2">
          <div className="relative items-center h-12 shrink-0 w-22 flex mt-auto">
            <Image
              src="/images/logo.png"
              alt="Chandrika Computer Logo"
              width={128}
              height={128}
              className="object-fill"
              priority
            />
          </div>
          <span className="md:hidden text-lg font-semibold underline underline-offset-3 leading-none">
            {tCommon("Computer")}
          </span>
          <span className="hidden md:block text-xl font-bold underline underline-offset-3 leading-none">
            {tCommon("ChandrikaComputer")}
          </span>
        </SafeLink>
        <UserAccount />
      </div>
    </header>
  );
}
