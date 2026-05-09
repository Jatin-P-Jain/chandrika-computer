"use client";

import * as React from "react";
import { format } from "date-fns";
import { enUS, hi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";

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
  disabled,
  minDate,
  maxDate = new Date(),
}: DaySelectorProps) {
  const { locale, textSubheadingCls } = useLocaleTypography();

  const [internalDate, setInternalDate] = React.useState<Date>(
    () => value ?? new Date(),
  );

  // NEW
  const [isPending, startTransition] = React.useTransition();

  // Keep internal state in sync when used as a controlled component.
  React.useEffect(() => {
    if (value) setInternalDate(value);
  }, [value]);

  const selected = value ?? internalDate;

  const setSelected = (next: Date) => {
    const clamped = clampDate(next, minDate, maxDate);

    startTransition(() => {
      if (!value) setInternalDate(clamped);
      onChange?.(clamped);
    });
  };

  const prevDisabled =
    !!disabled ||
    isPending ||
    (minDate ? addDaysSafe(selected, -1).getTime() < minDate.getTime() : false);

  const nextDisabled =
    !!disabled ||
    isPending ||
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
              disabled={disabled || isPending}
              className={`justify-center w-full font-semibold text-primary md:text-base ${textSubheadingCls}`}
              aria-label="Pick a date"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {format(selected, "EEEE, dd MMMM yyyy", {
                    locale: { en: enUS, hi: hi }[locale] || enUS,
                  })}
                </span>
              ) : (
                format(selected, "EEEE, dd MMMM yyyy", {
                  locale: { en: enUS, hi: hi }[locale] || enUS,
                })
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="center">
            {isPending ? (
              <div className="flex items-center justify-center w-full h-full fixed inset-0 bg-background/80 z-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : null}
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (d) setSelected(d);
              }}
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
