"use client";

import * as React from "react";
import {
  ArrowBigRightDash,
  CalendarClock,
  ChevronLeft,
  IndianRupee,
  Loader2,
  Pencil,
  UserCircle2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AttendanceEmployeeDetails,
  AttendanceSalaryAuditEntry,
  MonthWiseAbsence,
} from "@/types/attendance";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import clsx from "clsx";
import { formatINR } from "@/lib/utils";
import { AmountInput } from "@/components/custom/daily-page/common-components/amount-input";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";
import { updateEmployeeSalary } from "../actions";

const AVERAGE_SALARY_DAYS = 30;

function formatDisplayDate(ymd: string, locale: string, showYear = true) {
  const date = new Date(`${ymd}T00:00:00`);

  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: showYear ? "numeric" : undefined,
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  if (!showYear) {
    return `${day} ${month}`.trim();
  }

  return `${day} ${month} ${year}`.trim();
}

function formatWeekday(ymd: string, locale: string) {
  const date = new Date(`${ymd}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(date);
}

function formatDateTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDateOrNull(input: Date | string | null | undefined) {
  if (!input) return null;
  if (input instanceof Date) return input;

  const next = new Date(input);
  return Number.isNaN(next.getTime()) ? null : next;
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
      absentDates: dates.sort((a, b) => b.localeCompare(a)),
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
  const { authState } = useAuth();
  const [monthlySalary, setMonthlySalary] = React.useState<number | null>(
    employee.monthlySalary,
  );
  const [salaryAuditTrail, setSalaryAuditTrail] = React.useState<
    AttendanceSalaryAuditEntry[]
  >(employee.salaryAuditTrail);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = React.useState(false);
  const [salaryInput, setSalaryInput] = React.useState(
    employee.monthlySalary ?? 0,
  );
  const [isSavingSalary, setIsSavingSalary] = React.useState(false);

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

  const getSalaryBreakup = React.useCallback(
    (absentDays: number) => {
      if (!monthlySalary) {
        return null;
      }

      const perDay = monthlySalary / AVERAGE_SALARY_DAYS;
      const deduction = perDay * absentDays;
      const netSalary = monthlySalary - deduction;

      return {
        daysInMonth: AVERAGE_SALARY_DAYS,
        perDay,
        deduction,
        netSalary,
      };
    },
    [monthlySalary],
  );

  const latestSalaryAuditEntry = salaryAuditTrail[0] ?? null;

  const openSalaryDialog = React.useCallback(() => {
    setSalaryInput(monthlySalary ?? 0);
    setIsSalaryDialogOpen(true);
  }, [monthlySalary]);

  const onSaveSalary = React.useCallback(async () => {
    if (isSavingSalary) return;

    if (authState.status !== "ready") {
      toast.error(tAttendance("AuthenticationRequired"));
      return;
    }

    try {
      setIsSavingSalary(true);
      const token = await authState.currentUser.getIdToken();
      const parsedSalary = salaryInput > 0 ? salaryInput : null;
      const result = await updateEmployeeSalary({
        employeeId: employee.id,
        monthlySalary: parsedSalary,
        user: authState.clientUser,
        authtoken: token,
      });

      if (!result.success) {
        toast.error(result.error || tAttendance("UnableToUpdateSalary"));
        return;
      }

      setMonthlySalary(result.data.monthlySalary);
      setSalaryAuditTrail(result.data.salaryAuditTrail);
      setIsSalaryDialogOpen(false);
      toast.success(tAttendance("SalaryUpdated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tAttendance("UnableToUpdateSalary"),
      );
    } finally {
      setIsSavingSalary(false);
    }
  }, [authState, employee.id, isSavingSalary, salaryInput, tAttendance]);

  return (
    <div className="flex flex-col w-full ">
      <div className="flex items-center justify-between flex-wrap">
        <Button
          variant="link"
          onClick={() => back()}
          className="px-0! text-sm! gap-1! items-center"
        >
          <ChevronLeft className="size-5" />
          {tAttendance("BackToAttendance")}
        </Button>
      </div>

      <Card className="p-0 mb-4 mx-2">
        <CardContent className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1
              className={`text-lg font-semibold flex items-center gap-2 ${textHeadingCls}`}
            >
              <UserCircle2 className="size-6" />
              {employee.name}
            </h1>
            {monthlySalary ? (
              <Button
                variant="link"
                onClick={openSalaryDialog}
                className={clsx(
                  "flex items-center gap-1 px-3 py-1",
                  textBodyCls,
                )}
              >
                <span className="text-xl font-semibold text-primary">
                  {formatINR(monthlySalary)}
                </span>
                <Pencil className="size-4 text-muted-foreground" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={openSalaryDialog}
                className={clsx(
                  "flex items-center gap-2 text-sm text-primary",
                  textBodyCls,
                )}
              >
                <IndianRupee className="size-4" />
                {tAttendance("AddSalary")}
              </Button>
            )}
          </div>

          {latestSalaryAuditEntry ? (
            <p className={clsx("text-xs text-muted-foreground", textSmCls)}>
              {tAttendance("LastSalaryUpdated")}:{" "}
              <span className="text-foreground font-medium">
                {toDateOrNull(latestSalaryAuditEntry.updatedAt)
                  ? formatDateTime(
                      toDateOrNull(latestSalaryAuditEntry.updatedAt) as Date,
                      locale,
                    )
                  : "-"}
              </span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={isSalaryDialogOpen}
        onOpenChange={(open) => {
          if (isSavingSalary) return;
          setIsSalaryDialogOpen(open);
          if (!open) {
            setSalaryInput(monthlySalary ?? 0);
          }
        }}
      >
        <DialogContent
          className="p-3! py-4!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {monthlySalary
                ? tAttendance("EditSalary")
                : tAttendance("AddSalary")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <AmountInput
              inputId="employee-monthly-salary"
              value={salaryInput}
              onChange={setSalaryInput}
              placeholder={tAttendance("SalaryPlaceholder")}
              readOnly={isSavingSalary}
              inputClassName={clsx("font-bold")}
            />

            <div className="rounded-md border p-2 space-y-1">
              <h3
                className={clsx(
                  "text-sm font-medium text-muted-foreground",
                  textSmCls,
                )}
              >
                {tAttendance("SalaryHistory")}
              </h3>

              {salaryAuditTrail.length === 0 ? (
                <p className={clsx("text-sm text-muted-foreground", textSmCls)}>
                  {tAttendance("NoSalaryAuditYet")}
                </p>
              ) : (
                <div className="relative max-h-60 overflow-y-auto pr-1">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-2 bottom-2 w-px bg-border"
                  />
                  <div className="space-y-1">
                    {salaryAuditTrail.map((entry, index) => {
                      const auditDate = toDateOrNull(entry.updatedAt);
                      return (
                        <div
                          key={`${toDateOrNull(entry.updatedAt)?.toISOString() ?? "no-date"}-${index}`}
                          className="relative pl-6"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute left-1.5 top-1 size-3 rounded-full border border-background bg-primary"
                          />
                          <div className="rounded-md border p-1 px-2 flex flex-col gap-1">
                            <p
                              className={clsx(
                                "text-xs",
                                index === 0
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground",
                                textSmCls,
                              )}
                            >
                              {auditDate
                                ? formatDateTime(auditDate, locale)
                                : tCommon("Date")}
                            </p>
                            <p className={clsx("text-xs", textSmCls)}>
                              {tAttendance("UpdatedBy")}:{" "}
                              <span
                                className={clsx(
                                  index === 0
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {entry.updatedBy.displayName ||
                                  entry.updatedBy.email ||
                                  "Unknown"}
                              </span>
                            </p>
                            <p
                              className={clsx(
                                "flex justify-between items-center text-sm",
                                textBodyCls,
                              )}
                            >
                              <span
                                className={clsx(
                                  "text-sm",
                                  textSmCls,
                                  index === 0
                                    ? " font-bold"
                                    : "text-foreground font-medium",
                                )}
                              >
                                {entry.previousSalary
                                  ? formatINR(entry.previousSalary)
                                  : "-"}
                              </span>

                              <ArrowBigRightDash className="size-5 text-muted-foreground" />
                              <span
                                className={clsx(
                                  "text-sm",
                                  textSmCls,
                                  index === 0
                                    ? "text-green-700 font-bold"
                                    : "text-foreground font-medium",
                                )}
                              >
                                {entry.newSalary
                                  ? formatINR(entry.newSalary)
                                  : "-"}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 [&>button]:shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsSalaryDialogOpen(false)}
              disabled={isSavingSalary}
            >
              {tCommon("Cancel")}
            </Button>
            <Button onClick={onSaveSalary} disabled={isSavingSalary}>
              {isSavingSalary ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {tCommon("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2
            className={`text-muted-foreground mx-2 text-base font-medium flex items-center gap-2 ${textBodyCls}`}
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
            {filteredMonthWiseAbsence.map((monthItem) => {
              const monthAbsentDays = monthItem.absentDates.length;
              const salaryBreakup = getSalaryBreakup(monthAbsentDays);

              return (
                <Card key={monthItem.monthKey} className="p-0 gap-0">
                  <CardContent className="p-3 space-y-1">
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

                    <div className="w-full overflow-hidden rounded-md border">
                      <div
                        className={clsx(
                          "grid grid-cols-[minmax(40px,60px)_minmax(60px,80px)_minmax(0,1fr)] gap-2 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground",
                          textSmCls,
                        )}
                      >
                        <span>{tCommon("Date")}</span>
                        <span>{tCommon("Day")}</span>
                        <span>{tAttendance("AbsenceReason")}</span>
                      </div>

                      {monthItem.absentDates.map((date) => (
                        <div
                          key={date}
                          className={clsx(
                            "grid grid-cols-[minmax(40px,60px)_minmax(60px,80px)_minmax(0,1fr)] gap-2 border-t px-3 py-2 text-sm items-center",
                            textBodyCls,
                          )}
                        >
                          <span className="font-medium text-primary">
                            {formatDisplayDate(date, locale, false)}
                          </span>
                          <span className="font-medium text-primary">
                            {formatWeekday(date, locale)}
                          </span>
                          <span className="whitespace-normal wrap-break-word text-foreground/90 text-xs">
                            {employee.absentReasons[date] || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {salaryBreakup ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className={clsx(
                              "text-sm font-medium flex-1 justify-between text-muted-foreground shadow-md w-full",
                              textBodyCls,
                            )}
                          >
                            {tAttendance("NetSalary")}:
                            <span className="text-xl! text-green-700">
                              {formatINR(salaryBreakup.netSalary)}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="center" className=" space-y-2">
                          <p
                            className={clsx(
                              "text-xs font-semibold text-muted-foreground",
                              textSmCls,
                            )}
                          >
                            {tAttendance("SalaryBreakdown")}
                            <span className="ml-1 text-foreground/70">
                              ({monthItem.monthLabel})
                            </span>
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span
                              className={clsx(
                                "text-xs text-muted-foreground",
                                textSmCls,
                              )}
                            >
                              {tAttendance("Salary")}
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-medium text-right",
                                textSmCls,
                              )}
                            >
                              {formatINR(monthlySalary ?? 0)}
                            </span>

                            <span
                              className={clsx(
                                "text-xs text-muted-foreground",
                                textSmCls,
                              )}
                            >
                              {tAttendance("PerDayRate")}
                              <span className="text-muted-foreground/60 ml-1">
                                ({salaryBreakup.daysInMonth}{" "}
                                {tAttendance("DaysUnit")})
                              </span>
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-medium text-right",
                                textSmCls,
                              )}
                            >
                              {formatINR(salaryBreakup.perDay)}
                            </span>

                            <span
                              className={clsx(
                                "text-xs text-muted-foreground",
                                textSmCls,
                              )}
                            >
                              {tAttendance("Deduction")}
                              {monthAbsentDays > 0 && (
                                <span className="text-muted-foreground/60 ml-1">
                                  ({monthAbsentDays}×
                                  {formatINR(salaryBreakup.perDay)})
                                </span>
                              )}
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-medium text-right text-destructive",
                                textSmCls,
                              )}
                            >
                              {monthAbsentDays > 0
                                ? `−${formatINR(salaryBreakup.deduction)}`
                                : `−${formatINR(0)}`}
                            </span>

                            <span
                              className={clsx(
                                "text-xs font-semibold border-t pt-1",
                                textSmCls,
                              )}
                            >
                              {tAttendance("NetSalary")}
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-bold text-right text-primary border-t pt-1",
                                textBodyCls,
                              )}
                            >
                              {formatINR(salaryBreakup.netSalary)}
                            </span>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
