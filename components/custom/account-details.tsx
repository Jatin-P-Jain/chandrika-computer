"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserData } from "@/types/user";

export function AccountDetails({ user }: { user: UserData | null }) {
  console.log({ user });

  const profileImage = user?.photoUrl || "/default-profile.png";
  const name = user?.displayName || "Guest User";
  const email = user?.email || "No Email";
  const phoneNumber = user?.phoneNumber;
  const phoneNumberDisplay = phoneNumber
    ? phoneNumber.startsWith("+")
      ? phoneNumber.slice(0, 3) + " - " + phoneNumber.slice(3)
      : "+91 - " + phoneNumber
    : "No Phone Number";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-13 w-13 ring-2 p-0.5 ring-primary">
        <AvatarImage src={profileImage} alt={name} className="rounded-full" />
        <AvatarFallback className="bg-white">
          {initials || name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <p className="text-lg font-semibold text-primary">{name}</p>
        <p className="text-sm font-semibold text-primary">{email}</p>
        <p className="text-sm font-semibold text-primary">
          {phoneNumberDisplay}
        </p>
      </div>
    </div>
  );
}
