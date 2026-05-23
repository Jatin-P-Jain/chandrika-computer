"use client";

import * as React from "react";
import { CalendarClock, ChevronLeft, UserCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AttendanceEmployeeDetails,
  MonthWiseAbsence,
} from "@/types/attendance";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import clsx from "clsx";

function formatYmd(ymd: string, locale: string) {
  const date = new Date(`${ymd}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function monthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function groupMonthWise(
  absentDates: string[],
  locale: string,
): MonthWiseAbsence[] {
  const map = new Map<string, string[]>();

  for (const date of absentDates) {
    const key = date.slice(0, 7);
    const previous = map.get(key) ?? [];
    previous.push(date);
    map.set(key, previous);
  }

  return Array.from(map.entries())
    .map(([monthKey, dates]) => ({
      monthKey,
      monthLabel: monthLabel(monthKey, locale),
      absentDates: dates.sort(),
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function EmployeeAttendanceDetails({
  employee,
}: {
  employee: AttendanceEmployeeDetails;
}) {
  const ALL_MONTHS = "all";
  const { back } = useSafeRouter();
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const tAttendance = useTranslations("AttendanceRegister");
  const { textHeadingCls, textBodyCls, textSmCls } = useLocaleTypography();

  const monthWiseAbsence = React.useMemo(
    () => groupMonthWise(employee.absentDates, locale),
    [employee.absentDates, locale],
  );
  const [selectedMonth, setSelectedMonth] = React.useState<string>(ALL_MONTHS);

  const filteredMonthWiseAbsence = React.useMemo(() => {
    if (selectedMonth === ALL_MONTHS) {
      return monthWiseAbsence;
    }

    return monthWiseAbsence.filter(
      (monthItem) => monthItem.monthKey === selectedMonth,
    );
  }, [monthWiseAbsence, selectedMonth]);

  return (
    <div className="flex flex-col gap-2 w-full ">
      <div className="flex items-center justify-between flex-wrap">
        <Button variant="link" onClick={() => back()} className="px-0!">
          <ChevronLeft className="size-4" />
          {tAttendance("BackToAttendance")}
        </Button>
      </div>

      <Card className="p-0 mb-4 mx-2">
        <CardContent className="p-4">
          <h1
            className={`text-lg font-semibold flex items-center gap-2 ${textHeadingCls}`}
          >
            <UserCircle2 className="size-6" />
            {employee.name}
          </h1>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2
            className={`text-muted-foreground mx-2 text-base font-medium flex items-center gap-2 ${textHeadingCls}`}
          >
            <CalendarClock className="size-5" />
            {tAttendance("MonthWiseAbsentDays")}
          </h2>
          <div className="w-full">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger
                className={clsx("w-full font-medium", textBodyCls)}
              >
                <SelectValue
                  placeholder={tAttendance("SelectMonth")}
                  className=""
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MONTHS} className="text-base!">
                  {tAttendance("AllMonths")}
                </SelectItem>
                {monthWiseAbsence.map((monthItem) => (
                  <SelectItem
                    key={monthItem.monthKey}
                    value={monthItem.monthKey}
                    className="text-base! font-medium"
                  >
                    {monthItem.monthLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {monthWiseAbsence.length === 0 ? (
          <Card className="p-0">
            <CardContent className={`p-4 text-center ${textBodyCls}`}>
              {tAttendance("NoAbsencesYet")}
            </CardContent>
          </Card>
        ) : filteredMonthWiseAbsence.length === 0 ? (
          <Card className="p-0">
            <CardContent className={`p-4 text-center ${textBodyCls}`}>
              {tAttendance("NoAbsencesForSelectedMonth")}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredMonthWiseAbsence.map((monthItem) => (
              <Card key={monthItem.monthKey} className="p-0">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`font-semibold ${textHeadingCls}`}>
                      {monthItem.monthLabel}
                    </h3>
                    <span
                      className={`text-sm font-medium text-primary ${textBodyCls}`}
                    >
                      {tAttendance("AbsentDaysCount", {
                        count: monthItem.absentDates.length,
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`text-sm text-muted-foreground font-medium ${textSmCls}`}
                    >
                      {tCommon("Date")}:
                    </span>
                    {monthItem.absentDates.map((date) => (
                      <span
                        key={date}
                        className={`text-sm font-medium text-primary ${textBodyCls} px-2.5 py-1 rounded-md border bg-muted/50`}
                      >
                        {formatYmd(date, locale)}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
