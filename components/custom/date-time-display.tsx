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
        "fixed flex w-full items-center justify-between text-muted-foreground dark:text-white/80 top-16 px-4 md:px-8 py-2 text-sm md:text-base font-medium shadow-md dark:shadow-primary/10 bg-muted z-30",
        locale === "hi" && "font-semibold"
      )}
    >
      <span className="flex justify-center items-center gap-1 md:gap-2">
        <CalendarDays size={20} />
        {mounted ? (
          <>
            <span className={clsx("text-xs md:text-sm")}>{day},</span>{" "}
            <span
              className={clsx(
                "text-sm md:text-base",
                locale === "hi" && "text-base! md:text-lg!"
              )}
            >
              {date}
            </span>
          </>
        ) : (
          <Skeleton className="h-4 w-30 md:h-5 md:w-50 bg-muted-foreground/30" />
        )}
      </span>
      <span
        className={clsx(
          "flex justify-center items-center gap-1 md:gap-2 text-sm md:text-base",
          locale === "hi" && "text-base! md:text-lg!"
        )}
      >
        <AlarmClock size={20} />
        {mounted ? (
          time
        ) : (
          <Skeleton className="h-4 w-20 md:h-5 md:w-30 bg-muted-foreground/30" />
        )}
      </span>
    </div>
  );
}
