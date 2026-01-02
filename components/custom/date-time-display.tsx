"use client";

import { useEffect, useState } from "react";
import { AlarmClock, CalendarDays } from "lucide-react";
import { useLocale } from "next-intl";
import clsx from "clsx";
import { Skeleton } from "../ui/skeleton";

export function DateTimeDisplay() {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = now.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const day = now.toLocaleDateString(locale, {
    weekday: "long",
  });

  const time = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={clsx(
        "flex w-full items-center justify-between text-muted-foreground px-2 pb-2 text-base font-medium",
        locale === "hi" && "font-semibold"
      )}
    >
      <span className=" flex justify-center items-center gap-2">
        <CalendarDays size={20} />
        {mounted ? (
          <>
            <span className={clsx(locale === "en" && "text-sm")}>{day},</span>{" "}
            <span className="">{date}</span>
          </>
        ) : (
          <Skeleton className="h-5 w-50 bg-muted-foreground/30" />
        )}
      </span>
      <span className="flex justify-center items-center gap-2 font-en">
        <AlarmClock size={20} />
        {mounted ? (
          time
        ) : (
          <Skeleton className="h-5 w-30 bg-muted-foreground/30" />
        )}
      </span>
    </div>
  );
}
