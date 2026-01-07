"use client";

import * as React from "react";
import { format } from "date-fns";
import { enUS, hi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocale } from "use-intl";
import clsx from "clsx";

type DaySelectorProps = {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
};

function clampDate(d: Date, minDate?: Date, maxDate?: Date) {
  const time = d.getTime();
  if (minDate && time < minDate.getTime()) return minDate;
  if (maxDate && time > maxDate.getTime()) return maxDate;
  return d;
}

function addDaysSafe(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function DayNavigator({
  value,
  onChange,
  className,
  disabled,
  minDate,
  maxDate = new Date(),
}: DaySelectorProps) {
  const locale = useLocale();
  const isHi = locale === "hi";

  const [internalDate, setInternalDate] = React.useState<Date>(
    () => value ?? new Date()
  );

  // Keep internal state in sync when used as a controlled component.
  React.useEffect(() => {
    if (value) setInternalDate(value);
  }, [value]);

  const selected = value ?? internalDate;

  const setSelected = (next: Date) => {
    const clamped = clampDate(next, minDate, maxDate);
    if (!value) setInternalDate(clamped);
    onChange?.(clamped);
  };

  const prevDisabled =
    !!disabled ||
    (minDate ? addDaysSafe(selected, -1).getTime() < minDate.getTime() : false);

  const nextDisabled =
    !!disabled ||
    (maxDate ? addDaysSafe(selected, 1).getTime() > maxDate.getTime() : false);

  return (
    <div className="flex items-center w-full justify-between gap-2">
      <div className="flex">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSelected(addDaysSafe(selected, -1))}
          disabled={prevDisabled}
          aria-label="Previous day"
          className="border shadow-none"
        >
          <ChevronLeft className="size-6 text-primary" />
        </Button>
      </div>
      <div className="flex w-full">
        <Popover>
          <PopoverTrigger asChild className="">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={clsx(
                "justify-center w-full font-semibold text-primary md:text-base",
                isHi && "md:text-lg"
              )}
              aria-label="Pick a date"
            >
              {format(selected, "EEEE, dd MMMM yyyy", {
                locale: { en: enUS, hi: hi }[locale] || enUS,
              })}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (d) setSelected(d);
              }}
              // Optional bounds
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              endMonth={maxDate}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSelected(addDaysSafe(selected, 1))}
          disabled={nextDisabled}
          aria-label="Next day"
          className="z-10"
        >
          <ChevronRight className="size-6" />
        </Button>
      </div>
    </div>
  );
}
