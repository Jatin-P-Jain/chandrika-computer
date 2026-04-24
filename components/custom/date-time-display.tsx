"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, Hourglass } from "lucide-react";
import { useLocale } from "next-intl";
import clsx from "clsx";

export function DateTimeDisplay() {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    updateTime();

    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const date = now
    ? now.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const day = now
    ? now.toLocaleDateString(locale, {
        weekday: "long",
      })
    : "";

  const timeParts = now
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).formatToParts(now)
    : null;

  const hour = timeParts?.find((part) => part.type === "hour")?.value ?? "--";
  const minute =
    timeParts?.find((part) => part.type === "minute")?.value ?? "--";
  const dayPeriod =
    timeParts?.find((part) => part.type === "dayPeriod")?.value ?? "";
  const isColonVisible = now ? now.getSeconds() % 2 === 0 : true;

  return (
    <div
      className={clsx(
        "fixed flex w-full items-center justify-between text-muted-foreground dark:text-white/80 top-14 md:top-16 px-4 md:px-8 py-1 text-sm md:text-base font-medium shadow-md dark:shadow-primary/10 bg-muted z-30",
        locale === "hi" && "font-semibold",
      )}
    >
      <span className="flex justify-center items-center gap-1 md:gap-2">
        <CalendarDays size={14} />
        <>
          <span className={clsx("text-xs md:text-sm")}>{day},</span>{" "}
          <span
            className={clsx(
              "text-sm md:text-base",
              locale === "hi" && "text-base! md:text-lg!",
            )}
          >
            {date}
          </span>
        </>
      </span>
      <span
        className={clsx(
          "flex justify-center items-center gap-1 md:gap-2 text-sm md:text-base",
          locale === "hi" && "text-base! md:text-lg!",
        )}
      >
        <Clock size={14} />
        <span className="flex items-center gap-1">
          {hour}
          <span
            className={clsx(
              "inline-block w-[0.4ch] text-center text-sm",
              !isColonVisible && "opacity-0",
            )}
          >
            :
          </span>
          {minute}
          {dayPeriod ? <span className="">{dayPeriod}</span> : null}
        </span>
      </span>
    </div>
  );
}
