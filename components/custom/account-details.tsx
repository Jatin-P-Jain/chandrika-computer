"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserData } from "@/types/user";
import clsx from "clsx";
import { UserRound, UserRoundCheck } from "lucide-react";
import { useLocale } from "next-intl";

export function AccountDetails({
  user,
  userStatus,
}: {
  user: UserData | null;
  userStatus: string;
}) {
  const locale = useLocale();
  const userReady = userStatus === "ready";
  const guest = userStatus === "no-user";
  const profileImage = user?.photoUrl || "/default-profile.png";
  const name = user?.displayName || "Guest User";
  const email = user?.email || "No Email";
  const phoneNumber = user?.phoneNumber;
  const phoneNumberDisplay = phoneNumber
    ? phoneNumber.startsWith("+")
      ? phoneNumber.slice(0, 3) + " - " + phoneNumber.slice(3)
      : "+91 - " + phoneNumber
    : "No Phone Number";
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-8 md:h-13 md:w-13 ring-2 p-0.5 ring-primary">
        <AvatarImage src={profileImage} alt={name} className="rounded-full" />
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
      <div className="flex flex-col items-start">
        <p
          className={clsx(
            "md:text-lg font-semibold text-primary",
            locale === "hi" ? "text-base font-en" : ""
          )}
        >
          {name}
        </p>
        <p
          className={clsx(
            "text-xs md:text-sm font-semibold text-primary",
            locale === "hi" ? "text-base font-en" : ""
          )}
        >
          {email}
        </p>
        <p
          className={clsx(
            "text-xs md:text-sm font-semibold text-primary",
            locale === "hi" ? "text-base font-en" : ""
          )}
        >
          {phoneNumberDisplay}
        </p>
      </div>
    </div>
  );
}
