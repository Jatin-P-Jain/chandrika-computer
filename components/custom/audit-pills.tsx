"use client";

import clsx from "clsx";
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMini } from "@/types/user";



type AuditPillProps = {
  variant?: "created" | "updated";
  label: string; // "Created By" | "Last Updated By"
  user?: UserMini | null;
  atText?: string; // formatted date string
  className?: string;
  textBodyCls?: string; // your existing typography class
};

function initials(name?: string | null) {
  const n = (name || "").trim();
  if (!n) return "U";
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function AuditPill({
  variant = "created",
  label,
  user,
  atText,
  className,
  textBodyCls,
}: AuditPillProps) {
  const name = user?.displayName || "-";
  const phone = user?.phoneNumber || "-";
  const photo = user?.photoUrl || "";

  const iconColor = variant === "created" ? "text-emerald-600" : "text-sky-600";

  return (
    <div
      className={clsx(
        "rounded-full border bg-background/70 backdrop-blur px-3 py-2 shadow-sm",
        "flex items-center gap-2",
        textBodyCls,
        className
      )}
    >
      <span className="text-[11px] italic text-muted-foreground whitespace-nowrap">
        {label}
      </span>

      <span className="flex items-center gap-2 min-w-0">
        <Avatar className="h-6 w-6 border">
          <AvatarImage src={photo} alt={name} />
          <AvatarFallback className="text-[10px]">
            {initials(name)}
          </AvatarFallback>
        </Avatar>

        <BadgeCheck className={clsx("size-4 shrink-0", iconColor)} />

        <span className="min-w-0 truncate">
          <span className="font-semibold italic">{name}</span>
          <span className="text-muted-foreground font-medium"> ({phone})</span>
        </span>
      </span>

      <span className="text-[11px] italic text-muted-foreground whitespace-nowrap">
        at
      </span>
      <span className="text-sm font-medium whitespace-nowrap">
        {atText || "-"}
      </span>
    </div>
  );
}

type AuditPillsProps = {
  createdBy?: UserMini | null;
  createdAtText?: string;
  updatedBy?: UserMini | null;
  updatedAtText?: string;

  // To keep your exact positioning: pass wrapper classNames
  createdWrapperClassName?: string; // e.g. "flex lg:absolute lg:top-4 lg:left-4"
  updatedWrapperClassName?: string; // e.g. "flex lg:absolute lg:bottom-4 lg:right-4"

  textBodyCls?: string;
};

export function AuditPills({
  createdBy,
  createdAtText,
  updatedBy,
  updatedAtText,
  createdWrapperClassName = "flex ",
  updatedWrapperClassName = "flex ",
  textBodyCls,
}: AuditPillsProps) {
  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <div className={createdWrapperClassName}>
        <AuditPill
          variant="created"
          label="Created By"
          user={createdBy}
          atText={createdAtText}
          textBodyCls={textBodyCls}
        />
      </div>

      <div className={updatedWrapperClassName}>
        <AuditPill
          variant="updated"
          label="Last Updated By"
          user={updatedBy}
          atText={updatedAtText}
          textBodyCls={textBodyCls}
        />
      </div>
    </div>
  );
}
