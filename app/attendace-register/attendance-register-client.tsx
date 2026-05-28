"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowBigRightDash,
  CalendarDaysIcon,
  Calendars,
  IndianRupee,
  Loader2,
  Pencil,
  SquarePlus,
  Trash2,
  UserCircle2,
  UserPlus2,
  Users,
} from "lucide-react";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import type {
  AttendanceEmployeeListItem,
  AttendanceSalaryAuditEntry,
} from "@/types/attendance";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/useAuth";
import {
  createAttendanceEmployee,
  deleteAttendanceEmployee,
  toggleEmployeeAbsent,
  updateEmployeeSalary,
} from "./actions";
import { AmountInput } from "@/components/custom/daily-page/common-components/amount-input";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import clsx from "clsx";
import { enUS, hi } from "date-fns/locale";
import { formatINR } from "@/lib/utils";

type AttendancePromise = Promise<{ data: AttendanceEmployeeListItem[] }>;

function todayYmd() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMonthPrefix(ymd: string) {
  return ymd.slice(0, 7);
}

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

function parseYmdToDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function formatMonthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function toMonthInputValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function parseMonthKeyToDate(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return undefined;
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function getMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function toDateOrNull(input: Date | string | null | undefined) {
  if (!input) return null;
  if (input instanceof Date) return input;

  const next = new Date(input);
  return Number.isNaN(next.getTime()) ? null : next;
}

const AVERAGE_SALARY_DAYS = 30;

function resolveMonthlySalaryForMonth(
  monthKey: string,
  currentSalary: number | null,
  salaryAuditTrail: AttendanceSalaryAuditEntry[],
) {
  const sortedTrail = [...salaryAuditTrail]
    .filter((entry) => Boolean(entry.effectiveFromMonth))
    .sort(
      (a, b) =>
        (a.effectiveFromMonth ?? "").localeCompare(
          b.effectiveFromMonth ?? "",
        ) ||
        (toDateOrNull(a.updatedAt)?.getTime() ?? 0) -
          (toDateOrNull(b.updatedAt)?.getTime() ?? 0),
    );

  if (sortedTrail.length === 0) {
    return {
      monthlySalary: currentSalary,
      effectiveFromMonth: null,
    };
  }

  let lastKnownSalary: number | null = null;
  let lastKnownFromMonth: string | null = null;

  for (const entry of sortedTrail) {
    if (!entry.effectiveFromMonth) {
      continue;
    }

    if (monthKey < entry.effectiveFromMonth) {
      return {
        monthlySalary: entry.previousSalary ?? lastKnownSalary ?? currentSalary,
        effectiveFromMonth: lastKnownFromMonth,
      };
    }

    lastKnownSalary = entry.newSalary;
    lastKnownFromMonth = entry.effectiveFromMonth;
  }

  return {
    monthlySalary: lastKnownSalary ?? currentSalary,
    effectiveFromMonth: lastKnownFromMonth,
  };
}

export function AttendanceRegisterClient({
  attendancePromise,
}: {
  attendancePromise: AttendancePromise;
}) {
  const todayDate = React.useMemo(() => todayYmd(), []);
  const { data } = React.use(attendancePromise);
  const [employees, setEmployees] =
    React.useState<AttendanceEmployeeListItem[]>(data);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<{
    id: string;
    name: string;
    currentSalary: number | null;
    salaryAuditTrail: AttendanceSalaryAuditEntry[];
  } | null>(null);
  const [name, setName] = React.useState("");
  const [salaryInput, setSalaryInput] = React.useState(0);
  const [salaryFromMonth, setSalaryFromMonth] =
    React.useState(toMonthInputValue());
  const [salaryMonthPickerYear, setSalaryMonthPickerYear] = React.useState(
    new Date().getFullYear(),
  );
  const [isSalaryMonthPickerOpen, setIsSalaryMonthPickerOpen] =
    React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [savingEmployeeId, setSavingEmployeeId] = React.useState<string | null>(
    null,
  );
  const [deletingEmployeeId, setDeletingEmployeeId] = React.useState<
    string | null
  >(null);
  const [reasonDialog, setReasonDialog] = React.useState<{
    employeeId: string;
    dateYmd: string;
  } | null>(null);
  const [absenceReason, setAbsenceReason] = React.useState("");
  const [selectedDatesByEmployee, setSelectedDatesByEmployee] = React.useState<
    Record<string, string>
  >({});

  const { textHeadingCls, textBodyCls, textSmCls } = useLocaleTypography();
  const locale = useLocale();
  const calendarLocale = locale === "hi" ? hi : enUS;
  const tCommon = useTranslations("Common");
  const tAttendance = useTranslations("AttendanceRegister");
  const { authState } = useAuth();
  const { push } = useSafeRouter();

  const monthOptions = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        index,
        label: new Intl.DateTimeFormat(locale, { month: "long" }).format(
          new Date(2000, index, 1),
        ),
      })),
    [locale],
  );
  const currentMonthKey = React.useMemo(() => toMonthInputValue(), []);
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const parsedSalaryInput = salaryInput > 0 ? salaryInput : null;
  const isEditingSalaryUnchanged =
    Boolean(editingEmployee) &&
    editingEmployee?.currentSalary === parsedSalaryInput;

  React.useEffect(() => {
    setEmployees(data);
  }, [data]);

  React.useEffect(() => {
    setSelectedDatesByEmployee((prev) => {
      const next = { ...prev };

      for (const employee of data) {
        if (!next[employee.id]) {
          next[employee.id] = todayDate;
        }
      }

      return next;
    });
  }, [data, todayDate]);

  const closeEmployeeDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    setName("");
    setSalaryInput(0);
    setSalaryFromMonth(toMonthInputValue());
    setSalaryMonthPickerYear(new Date().getFullYear());
    setIsSalaryMonthPickerOpen(false);
  };

  const onSaveEmployee = async () => {
    if (isAdding) return;

    if (authState.status !== "ready") {
      toast.error(tAttendance("AuthenticationRequired"));
      return;
    }

    const parsedSalary = salaryInput > 0 ? salaryInput : null;

    if (parsedSalary && !/^\d{4}-\d{2}$/.test(salaryFromMonth)) {
      toast.error(tAttendance("FromMonthRequired"));
      return;
    }

    // --- edit salary for existing employee ---
    if (editingEmployee) {
      try {
        setIsAdding(true);
        const token = await authState.currentUser.getIdToken();
        const result = await updateEmployeeSalary({
          employeeId: editingEmployee.id,
          monthlySalary: parsedSalary,
          effectiveFromMonth: parsedSalary ? salaryFromMonth : null,
          user: authState.clientUser,
          authtoken: token,
        });

        if (!result.success) {
          toast.error(result.error || tAttendance("UnableToUpdateSalary"));
          return;
        }

        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id
              ? {
                  ...emp,
                  monthlySalary: result.data.monthlySalary,
                  lastSalaryUpdatedAt: result.data.lastSalaryUpdatedAt,
                  salaryAuditTrail: result.data.salaryAuditTrail,
                }
              : emp,
          ),
        );
        closeEmployeeDialog();
        toast.success(tAttendance("SalaryUpdated"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : tAttendance("UnableToUpdateSalary"),
        );
      } finally {
        setIsAdding(false);
      }
      return;
    }

    // --- create new employee ---
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(tAttendance("NameRequired"));
      return;
    }

    try {
      setIsAdding(true);
      const token = await authState.currentUser.getIdToken();
      const result = await createAttendanceEmployee({
        name: trimmedName,
        monthlySalary: parsedSalary,
        salaryFromMonth: parsedSalary ? salaryFromMonth : null,
        user: authState.clientUser,
        authtoken: token,
      });

      if (!result.success) {
        toast.error(result.error || tAttendance("UnableToAddEmployee"));
        return;
      }

      setEmployees((prev) =>
        [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedDatesByEmployee((prev) => ({
        ...prev,
        [result.data.id]: todayDate,
      }));
      closeEmployeeDialog();
      toast.success(tAttendance("EmployeeAdded"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tAttendance("UnableToAddEmployee"),
      );
    } finally {
      setIsAdding(false);
    }
  };

  const onToggleAbsent = async (employeeId: string, reason?: string) => {
    if (savingEmployeeId) return;

    if (authState.status !== "ready") {
      toast.error(tAttendance("AuthenticationRequired"));
      return;
    }

    const dateYmd = selectedDatesByEmployee[employeeId] ?? todayDate;

    const previous = employees;
    setSavingEmployeeId(employeeId);
    setEmployees((prev) =>
      prev.map((employee) => {
        if (employee.id !== employeeId) return employee;
        const isAbsentOnSelectedDate = employee.absentDates.includes(dateYmd);
        const nextAbsentReasons = { ...employee.absentReasons };
        const nextAbsentDates = isAbsentOnSelectedDate
          ? employee.absentDates.filter((date) => date !== dateYmd)
          : [...employee.absentDates, dateYmd].sort();

        if (isAbsentOnSelectedDate) {
          delete nextAbsentReasons[dateYmd];
        } else if (reason?.trim()) {
          nextAbsentReasons[dateYmd] = reason.trim();
        }

        return {
          ...employee,
          absentDates: nextAbsentDates,
          absentReasons: nextAbsentReasons,
        };
      }),
    );

    try {
      const token = await authState.currentUser.getIdToken();
      const result = await toggleEmployeeAbsent({
        employeeId,
        dateYmd,
        reason,
        user: authState.clientUser,
        authtoken: token,
      });

      if (!result.success) {
        setEmployees(previous);
        toast.error(result.error || tAttendance("UnableToUpdateAttendance"));
        return false;
      }

      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === employeeId
            ? {
                ...employee,
                absentDates: result.data.absentDates,
                absentReasons: result.data.absentReasons,
              }
            : employee,
        ),
      );
      return true;
    } catch (error) {
      setEmployees(previous);
      toast.error(
        error instanceof Error
          ? error.message
          : tAttendance("UnableToUpdateAttendance"),
      );
      return false;
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const onSwitchChange = (employeeId: string, checked: boolean) => {
    if (savingEmployeeId || deletingEmployeeId) return;

    if (!checked) {
      void onToggleAbsent(employeeId);
      return;
    }

    const dateYmd = selectedDatesByEmployee[employeeId] ?? todayDate;
    setReasonDialog({ employeeId, dateYmd });
    setAbsenceReason("");
  };

  const onConfirmAbsentReason = async () => {
    if (!reasonDialog) return;

    const trimmedReason = absenceReason.trim();
    if (!trimmedReason) {
      toast.error(tAttendance("ReasonRequired"));
      return;
    }

    const success = await onToggleAbsent(
      reasonDialog.employeeId,
      trimmedReason,
    );
    if (!success) return;

    setReasonDialog(null);
    setAbsenceReason("");
  };

  const onDeleteEmployee = async (employeeId: string) => {
    if (deletingEmployeeId || savingEmployeeId) return;

    if (authState.status !== "ready") {
      toast.error(tAttendance("AuthenticationRequired"));
      return;
    }

    try {
      setDeletingEmployeeId(employeeId);
      const token = await authState.currentUser.getIdToken();
      const result = await deleteAttendanceEmployee({
        employeeId,
        user: authState.clientUser,
        authtoken: token,
      });

      if (!result.success) {
        toast.error(result.error || tAttendance("UnableToDeleteEmployee"));
        return;
      }

      setEmployees((prev) =>
        prev.filter((employee) => employee.id !== result.data.employeeId),
      );
      setSelectedDatesByEmployee((prev) => {
        const next = { ...prev };
        delete next[result.data.employeeId];
        return next;
      });
      toast.success(tAttendance("EmployeeDeleted"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tAttendance("UnableToDeleteEmployee"),
      );
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        <h1
          className={`text-primary flex text-lg font-semibold justify-center items-start gap-1 ${textHeadingCls}`}
        >
          <Users className="size-6" />
          <span>{tAttendance("AttendanceRegister")}</span>
        </h1>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (isAdding) return;
            if (!open) closeEmployeeDialog();
            else setIsDialogOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2 text-primary border border-primary"
              variant="outline"
            >
              <UserPlus2 className="size-4" />
              {tAttendance("AddEmployee")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-md"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {editingEmployee
                  ? editingEmployee.currentSalary
                    ? tAttendance("EditSalary")
                    : tAttendance("AddSalary")
                  : tAttendance("AddEmployee")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {editingEmployee ? (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <UserCircle2 className="size-4 text-muted-foreground shrink-0" />
                  <span className={clsx("text-sm font-medium", textBodyCls)}>
                    {editingEmployee.name}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="employee-name" className={textSmCls}>
                    {tAttendance("EmployeeName")}
                  </Label>
                  <Input
                    id="employee-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={tAttendance("EmployeeNamePlaceholder")}
                    disabled={isAdding}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="employee-salary"
                  className={clsx("text-muted-foreground", textSmCls)}
                >
                  {tAttendance("Salary")}
                </Label>
                <AmountInput
                  inputId="employee-salary"
                  value={salaryInput}
                  onChange={setSalaryInput}
                  placeholder={tAttendance("SalaryPlaceholder")}
                  readOnly={isAdding}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="employee-salary-from-month"
                  className={clsx("text-muted-foreground", textSmCls)}
                >
                  {tAttendance("FromMonth")}
                </Label>
                <Popover
                  open={isSalaryMonthPickerOpen}
                  onOpenChange={setIsSalaryMonthPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="employee-salary-from-month"
                      variant="outline"
                      disabled={isAdding}
                      className={clsx(
                        "w-full justify-between text-left font-medium",
                        textBodyCls,
                      )}
                    >
                      <span>
                        {/^\d{4}-\d{2}$/.test(salaryFromMonth)
                          ? formatMonthLabel(salaryFromMonth, locale)
                          : tAttendance("SelectMonth")}
                      </span>
                      <CalendarDaysIcon className="size-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2 space-y-2" align="start">
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={salaryMonthPickerYear <= currentYear}
                        onClick={() =>
                          setSalaryMonthPickerYear((year) => year - 1)
                        }
                      >
                        -
                      </Button>
                      <span
                        className={clsx("text-sm font-semibold", textBodyCls)}
                      >
                        {salaryMonthPickerYear}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSalaryMonthPickerYear((year) => year + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {monthOptions.map((month) => {
                        const monthKey = getMonthKey(
                          salaryMonthPickerYear,
                          month.index,
                        );
                        const isSelected = salaryFromMonth === monthKey;
                        const isPastMonth = monthKey < currentMonthKey;

                        return (
                          <Button
                            key={monthKey}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={clsx("justify-center", textSmCls)}
                            disabled={isPastMonth}
                            onClick={() => {
                              setSalaryFromMonth(monthKey);
                              setIsSalaryMonthPickerOpen(false);
                            }}
                          >
                            {month.label}
                          </Button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {editingEmployee ? (
                <div className="rounded-md border p-2 space-y-1">
                  <h3
                    className={clsx(
                      "text-sm font-medium text-muted-foreground",
                      textSmCls,
                    )}
                  >
                    {tAttendance("SalaryHistory")}
                  </h3>

                  {editingEmployee.salaryAuditTrail.length === 0 ? (
                    <p
                      className={clsx(
                        "text-sm text-muted-foreground",
                        textSmCls,
                      )}
                    >
                      {tAttendance("NoSalaryAuditYet")}
                    </p>
                  ) : (
                    <div className="relative max-h-60 overflow-y-auto pr-1">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-2.5 top-2 bottom-2 w-px bg-border"
                      />
                      <div className="space-y-1">
                        {editingEmployee.salaryAuditTrail.map(
                          (entry, index) => {
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
                                  <p
                                    className={clsx(
                                      "text-xs text-muted-foreground",
                                      textSmCls,
                                    )}
                                  >
                                    {tAttendance("From")}:{" "}
                                    <span
                                      className={clsx(
                                        "font-medium",
                                        index === 0
                                          ? "text-foreground"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      {entry.effectiveFromMonth
                                        ? formatMonthLabel(
                                            entry.effectiveFromMonth,
                                            locale,
                                          )
                                        : "-"}
                                    </span>
                                  </p>
                                  <p
                                    className={clsx(
                                      "text-xs text-muted-foreground",
                                      textSmCls,
                                    )}
                                  >
                                    {tAttendance("UpdatedBy")}:{" "}
                                    <span
                                      className={clsx(
                                        "font-medium",
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
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 [&>button]:shrink-0">
              <Button
                variant="outline"
                onClick={closeEmployeeDialog}
                disabled={isAdding}
              >
                {tCommon("Cancel")}
              </Button>
              <Button
                onClick={onSaveEmployee}
                disabled={isAdding || isEditingSalaryUnchanged}
              >
                {isAdding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : editingEmployee ? null : (
                  <UserPlus2 className="size-4" />
                )}
                {editingEmployee ? tCommon("Save") : tCommon("Add")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(reasonDialog)}
          onOpenChange={(open) => {
            if (savingEmployeeId) return;
            if (!open) {
              setReasonDialog(null);
              setAbsenceReason("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{tAttendance("AddAbsenceReasonTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="absence-reason" className={textSmCls}>
                  {tAttendance("AbsenceReason")}
                </Label>
                <Input
                  id="absence-reason"
                  value={absenceReason}
                  onChange={(event) => setAbsenceReason(event.target.value)}
                  placeholder={tAttendance("AbsenceReasonPlaceholder")}
                  disabled={Boolean(savingEmployeeId)}
                />
              </div>
              {reasonDialog ? (
                <p className={clsx("text-xs text-muted-foreground", textSmCls)}>
                  {tAttendance("AttendanceDate")}:{" "}
                  <span className={clsx("font-semibold", textSmCls)}>
                    {formatDisplayDate(reasonDialog.dateYmd, locale)}
                  </span>
                </p>
              ) : null}
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 [&>button]:shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setReasonDialog(null);
                  setAbsenceReason("");
                }}
                disabled={Boolean(savingEmployeeId)}
              >
                {tCommon("Cancel")}
              </Button>
              <Button
                onClick={onConfirmAbsentReason}
                disabled={Boolean(savingEmployeeId)}
              >
                {savingEmployeeId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {tCommon("Save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className={`py-7 text-center ${textBodyCls}`}>
            {tAttendance("NoEmployees")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {employees.map((employee) => {
            const isSaving = savingEmployeeId === employee.id;
            const selectedDate =
              selectedDatesByEmployee[employee.id] ?? todayDate;
            const isAbsentOnSelectedDate =
              employee.absentDates.includes(selectedDate);
            const selectedMonthLabel = new Intl.DateTimeFormat(locale, {
              month: "long",
              year: "numeric",
            }).format(new Date(`${selectedDate}T00:00:00`));
            const currentMonthAbsentDates = employee.absentDates
              .filter(
                (date) => getMonthPrefix(date) === getMonthPrefix(selectedDate),
              )
              .sort((a, b) => b.localeCompare(a));
            const currentMonthAbsentDays = employee.absentDates.filter(
              (date) => getMonthPrefix(date) === getMonthPrefix(selectedDate),
            ).length;
            const selectedMonthKey = getMonthPrefix(selectedDate);
            const resolvedSalary = resolveMonthlySalaryForMonth(
              selectedMonthKey,
              employee.monthlySalary,
              employee.salaryAuditTrail,
            );
            const salaryBreakup = resolvedSalary.monthlySalary
              ? (() => {
                  const daysInMonth = AVERAGE_SALARY_DAYS;
                  const perDay = resolvedSalary.monthlySalary / daysInMonth;
                  const deduction = perDay * currentMonthAbsentDays;
                  const netSalary = resolvedSalary.monthlySalary - deduction;

                  return {
                    monthlySalary: resolvedSalary.monthlySalary,
                    effectiveFromMonth: resolvedSalary.effectiveFromMonth,
                    daysInMonth,
                    perDay,
                    deduction,
                    netSalary,
                  };
                })()
              : null;

            return (
              <Card key={employee.id} className="p-2">
                <CardContent className="p-0 gap-2 flex flex-col">
                  <div className="flex flex-wrap gap-3 justify-between items-start">
                    <div className="flex flex-col px-2 gap-0.5">
                      <div className="flex gap-1 items-center">
                        <UserCircle2 className="size-5 text-primary" />
                        <h3
                          className={`text-primary font-semibold text-lg ${textHeadingCls}`}
                        >
                          {employee.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary"
                        onClick={() =>
                          push(`/attendace-register/${employee.id}`)
                        }
                      >
                        <Calendars className="size-4" />
                        {tAttendance("Details")}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/40"
                            disabled={
                              savingEmployeeId === employee.id ||
                              deletingEmployeeId === employee.id
                            }
                          >
                            {deletingEmployeeId === employee.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {tAttendance("DeleteConfirmTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription
                              className={clsx("text-center", textBodyCls)}
                            >
                              {tAttendance("DeleteConfirmDesc", {
                                name: employee.name,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={deletingEmployeeId === employee.id}
                            >
                              {tCommon("Cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-800"
                              disabled={deletingEmployeeId === employee.id}
                              onClick={() => onDeleteEmployee(employee.id)}
                            >
                              {tAttendance("Delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {employee.monthlySalary ? (
                      <div className="flex flex-wrap items-center border rounded-md">
                        <span className="text-sm text-muted-foreground px-3 py-1">
                          {tAttendance("Salary")}{" "}
                          <span className="font-semibold text-foreground">
                            ({selectedMonthLabel})
                          </span>
                        </span>
                        <div className="flex flex-wrap items-center w-full bg-primary/5 py-1">
                          <Button
                            variant={"link"}
                            onClick={() => {
                              setEditingEmployee({
                                id: employee.id,
                                name: employee.name,
                                currentSalary: employee.monthlySalary,
                                salaryAuditTrail: employee.salaryAuditTrail,
                              });
                              setSalaryInput(employee.monthlySalary ?? 0);
                              setSalaryFromMonth(
                                employee.salaryAuditTrail[0]
                                  ?.effectiveFromMonth ?? toMonthInputValue(),
                              );
                              setSalaryMonthPickerYear(
                                parseMonthKeyToDate(
                                  employee.salaryAuditTrail[0]
                                    ?.effectiveFromMonth ?? toMonthInputValue(),
                                )?.getFullYear() ?? new Date().getFullYear(),
                              );
                              setIsDialogOpen(true);
                            }}
                            className={clsx(
                              "flex items-center gap-1 justify-start",
                            )}
                          >
                            <span className="text-lg!">
                              {salaryBreakup
                                ? formatINR(salaryBreakup.monthlySalary)
                                : formatINR(employee.monthlySalary)}
                            </span>
                            <Pencil className=" size-5 bg-accent p-1 rounded-md text-muted-foreground" />
                          </Button>

                          {salaryBreakup ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={clsx(
                                    "text-sm font-medium flex-1 justify-between text-muted-foreground mx-1 shadow-md",
                                    textBodyCls,
                                  )}
                                >
                                  {tAttendance("NetSalary")}:
                                  <span className="font-semibold text-lg! text-green-700">
                                    {formatINR(salaryBreakup.netSalary)}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="end"
                                className=" space-y-2"
                              >
                                <p
                                  className={clsx(
                                    "text-xs font-semibold text-muted-foreground",
                                    textSmCls,
                                  )}
                                >
                                  {tAttendance("SalaryBreakdown")}
                                  <span className="ml-1 text-foreground/70">
                                    ({selectedMonthLabel})
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
                                    {formatINR(salaryBreakup.monthlySalary)}
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
                                    {currentMonthAbsentDays > 0 && (
                                      <span className="text-muted-foreground/60 ml-1">
                                        ({currentMonthAbsentDays}×
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
                                    {currentMonthAbsentDays > 0
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
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant={"outline"}
                        onClick={() => {
                          setEditingEmployee({
                            id: employee.id,
                            name: employee.name,
                            currentSalary: null,
                            salaryAuditTrail: employee.salaryAuditTrail,
                          });
                          setSalaryInput(0);
                          setSalaryFromMonth(toMonthInputValue());
                          setSalaryMonthPickerYear(new Date().getFullYear());
                          setIsDialogOpen(true);
                        }}
                        className={clsx(
                          "flex items-center gap-2 text-sm text-primary",
                          textBodyCls,
                        )}
                      >
                        <IndianRupee className="size-4" />
                        {tAttendance("AddSalary")}
                        <SquarePlus className="size-4" />
                      </Button>
                    )}
                    <div className="flex items-center justify-between border rounded-md px-3 py-2 shadow-sm gap-1">
                      <Label
                        htmlFor={`absent-switch-${employee.id}`}
                        className={`flex wrap-break-word text-muted-foreground text-sm ${textSmCls}`}
                      >
                        {tAttendance("MarkAsAbsent")}
                      </Label>
                      <div className="flex items-center gap-2 ml-auto">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={isSaving}
                              className={`justify-between text-right text-primary text-sm font-medium ${textBodyCls}`}
                            >
                              <CalendarDaysIcon className="size-4 text-muted-foreground" />
                              <span className="truncate">
                                {formatDisplayDate(selectedDate, locale)}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                              mode="single"
                              locale={calendarLocale}
                              selected={parseYmdToDate(selectedDate)}
                              onSelect={(date) => {
                                if (!date) return;

                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(
                                  2,
                                  "0",
                                );
                                const dd = String(date.getDate()).padStart(
                                  2,
                                  "0",
                                );

                                setSelectedDatesByEmployee((prev) => ({
                                  ...prev,
                                  [employee.id]: `${yyyy}-${mm}-${dd}`,
                                }));
                              }}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Switch
                          id={`absent-switch-${employee.id}`}
                          checked={isAbsentOnSelectedDate}
                          disabled={isSaving}
                          onCheckedChange={(checked) =>
                            onSwitchChange(employee.id, checked)
                          }
                          checkedThumbLabel="A"
                          uncheckedThumbLabel="P"
                          className="h-7 w-16 data-[state=checked]:bg-red-700 shadow-md"
                          thumbClassName={clsx(
                            "size-6 data-[state=checked]:translate-x-[150%] text-sm text-primary",
                            textBodyCls,
                          )}
                        />
                      </div>
                    </div>
                    <div className=" flex flex-col items-center border rounded-md">
                      <div className="flex items-center justify-between w-full p-1 px-2">
                        <span
                          className={`text-sm text-muted-foreground ${textSmCls}`}
                        >
                          {tAttendance("TotalAbsentThisMonth")}
                          <span
                            className={`text-sm font-semibold text-foreground ${textBodyCls}`}
                          >
                            {" "}
                            {`(${selectedMonthLabel})`}
                          </span>
                        </span>
                        <span
                          className={`font-semibold text-lg text-primary ${textHeadingCls}`}
                        >
                          {currentMonthAbsentDays}
                        </span>
                      </div>
                      {currentMonthAbsentDates.length > 0 && (
                        <div className="w-full overflow-hidden rounded-md border">
                          <div
                            className={clsx(
                              "grid grid-cols-[minmax(40px,60px)_minmax(60px,80px)_minmax(0,1fr)] gap-2 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground",
                              textSmCls,
                            )}
                          >
                            <span className={`text-sm ${textSmCls}`}>
                              {tCommon("Date")}
                            </span>
                            <span className={`text-sm ${textSmCls}`}>
                              {tCommon("Day")}
                            </span>
                            <span className={`text-sm ${textSmCls}`}>
                              {tAttendance("AbsenceReason")}
                            </span>
                          </div>

                          {currentMonthAbsentDates.map((date) => (
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
                              <span className="whitespace-normal wrap-break-word text-foreground/90">
                                {employee.absentReasons[date] || "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSaving && (
                    <div className="text-xs text-primary flex items-center gap-1">
                      <Loader2 className="size-4 animate-spin" />
                      {tCommon("Saving")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
