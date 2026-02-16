// components/navbar.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserAccount } from "../user-account";
import Image from "next/image";

export function Navbar() {
  const tCommon = useTranslations("Common");
  return (
    <header className="fixed w-full bg-card z-20">
      <div className="mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8 text-primary py-4">
        {/* Left: logo + name */}
        <Link href="/" className="flex items-center">
          {/* Replace with <Image> or svg logo as needed */}
          <div className="flex size-20 md:size-28 items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Chandrika Computer Logo"
              width={80}
              height={80}
              className="rounded-full object-contain"
              priority={true}
            />
          </div>
          <span className="flex md:hidden text-base md:text-xl font-semibold md:font-bold underline underline-offset-3 pl-1">
            {tCommon("Computer")}
          </span>
          <span className="hidden md:flex text-base md:text-xl font-semibold md:font-bold underline underline-offset-3">
            {tCommon("ChandrikaComputer")}
          </span>
        </Link>
        <UserAccount />
      </div>
    </header>
  );
}
