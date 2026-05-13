"use client";

import { format, parseISO, isValid } from "date-fns";
import { enIN, hi } from "date-fns/locale";
import { useLocale } from "next-intl";

type DateInput = string | number | Date | null | undefined;
type DateDisplayType = "docId" | "timestamp";

interface DateDisplayProps {
  value: DateInput;
  type?: DateDisplayType;
  className?: string;
  smallDay?: boolean;
  dayRequired?: boolean;
}

function parseDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);

  const isoDate = parseISO(String(value));
  return isValid(isoDate) ? isoDate : null;
}

export function DateDisplay({
  value,
  type = "timestamp",
  dayRequired = true,
  className = "",
  smallDay = false,
}: DateDisplayProps) {
  const locale = useLocale();
  const dfLocale = locale === "hi" ? hi : enIN;

  const date = parseDate(value);
  if (!date) return <span className="text-muted-foreground">-</span>;

  if (type === "docId") {
    const dayName = format(date, "EEEE", { locale: dfLocale });
    const formatted = format(date, "dd MMMM, yyyy", { locale: dfLocale });

    return (
      <span className={className}>
        {formatted}{" "}
        {dayRequired ? <span className="">({dayName.toString()})</span> : null}
      </span>
    );
  }

  // timestamp
  const dayName = format(date, "EEEE", { locale: dfLocale });
  let formatted = format(date, "dd MMMM, yyyy", { locale: dfLocale });

  if (smallDay) {
    formatted += ` ${dayName.toString()}`;
  }

  formatted += ` at ${format(date, "HH:mm", { locale: dfLocale })}`;

  return <span className={className}>{formatted}</span>;
}
