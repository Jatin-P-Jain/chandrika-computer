"use client";

import clsx from "clsx";
import { UserRound, UserRoundCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { UserData } from "@/types/user";
import { ThemeModeToggle } from "./action-items/theme-mode-button";
import { LocaleToggle } from "./action-items/locale-toggle";
import { KeyboardSwitch } from "./action-items/keyboard-switch";
import { Separator } from "../ui/separator";

export function AccountDropdown({
  user,
  userStatus,
}: {
  user: UserData | null;
  userStatus: string;
}) {
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isHi = locale === "hi";
  const textHiCls = clsx(isHi && "text-base! font-medium");

  const userReady = userStatus === "ready";
  const guest = userStatus === "no-user";
  const profileImage = user?.photoUrl || "";
  const name = user?.displayName || "Guest User";
  const email = user?.email || "No Email";
  const phoneNumber = user?.phoneNumber;
  const phoneNumberDisplay = phoneNumber
    ? phoneNumber.startsWith("+")
      ? phoneNumber.slice(0, 3) + " - " + phoneNumber.slice(3)
      : "+91 - " + phoneNumber
    : "No Phone Number";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer h-12">
          <Avatar className="size-10 ring-1 p-0.5 ring-primary">
            <AvatarImage
              src={profileImage}
              alt={name}
              className="rounded-full"
            />
            <AvatarFallback className="bg-white dark:bg-white/10">
              {guest ? (
                <UserRound className="text-primary size-6 md:size-8" />
              ) : userReady ? (
                <UserRoundCheck className="text-primary size-6 md:size-8" />
              ) : (
                <UserRound className="text-muted-foreground size-6 md:size-8 animate-pulse" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start text-left md:flex">
            <p
              className={clsx(
                "font-semibold text-primary text-sm",
                locale === "hi" ? "text-base font-en" : "",
              )}
            >
              {name}
            </p>
            <p
              className={clsx(
                "text-xs text-muted-foreground",
                locale === "hi" ? "text-base font-en" : "",
              )}
            >
              {email}
            </p>
          </div>
          <ChevronDown className="hidden md:flex size-4 ml-auto text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-3 gap-3 flex flex-col">
        {/* Account Details Section */}
        <div className="flex flex-col gap-1">
          <DropdownMenuLabel className="font-semibold text-muted-foreground p-0">
            {tCommon("Account")}
          </DropdownMenuLabel>

          <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
            <Avatar className="size-10 md:size-12 ring-2 p-0.5 ring-primary">
              <AvatarImage
                src={profileImage}
                alt={name}
                className="rounded-full"
              />
              <AvatarFallback>
                <UserRoundCheck className="size-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p
                className={clsx(
                  "font-semibold text-primary",
                  locale === "hi" ? "text-base font-en" : "text-sm",
                )}
              >
                {name}
              </p>
              <p
                className={clsx(
                  "text-xs text-muted-foreground",
                  locale === "hi" ? "text-base font-en" : "",
                )}
              >
                {email}
              </p>
              <p
                className={clsx(
                  "text-xs text-muted-foreground",
                  locale === "hi" ? "text-base font-en" : "",
                )}
              >
                {phoneNumberDisplay}
              </p>
            </div>
          </div>
        </div>
        <Separator />

        {/* Preferences Section */}
        <div className="flex flex-col gap-1">
          <DropdownMenuLabel className="font-semibold text-muted-foreground p-0 mb-2">
            {tCommon("Settings")}
          </DropdownMenuLabel>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0 mb-2"
            onSelect={(e) => e.preventDefault()}
          >
            <KeyboardSwitch labelClassName={textHiCls} />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0 mb-2"
            onSelect={(e) => e.preventDefault()}
          >
            <ThemeModeToggle labelClassName={textHiCls} />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between hover:bg-transparent! cursor-pointer p-0"
            onSelect={(e) => e.preventDefault()}
          >
            <LocaleToggle labelClassName={textHiCls} />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
