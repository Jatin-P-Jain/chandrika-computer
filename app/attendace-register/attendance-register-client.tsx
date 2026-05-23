"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDaysIcon,
  Calendars,
  Loader2,
  Trash2,
  UserCircle2,
  UserPlus2,
  Users,
} from "lucide-react";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import type { AttendanceEmployeeListItem } from "@/types/attendance";
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
} from "./actions";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import clsx from "clsx";

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

function formatDisplayDate(ymd: string, locale: string) {
  const date = new Date(`${ymd}T00:00:00`);
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseYmdToDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
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
  const [name, setName] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [savingEmployeeId, setSavingEmployeeId] = React.useState<string | null>(
    null,
  );
  const [deletingEmployeeId, setDeletingEmployeeId] = React.useState<
    string | null
  >(null);
  const [selectedDatesByEmployee, setSelectedDatesByEmployee] = React.useState<
    Record<string, string>
  >({});

  const { textHeadingCls, textPageHeadCls, textBodyCls, textSmCls } =
    useLocaleTypography();
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const tAttendance = useTranslations("AttendanceRegister");
  const { authState } = useAuth();
  const { push } = useSafeRouter();

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

  const onAddEmployee = async () => {
    if (isAdding) return;
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error(tAttendance("NameRequired"));
      return;
    }

    if (authState.status !== "ready") {
      toast.error(tAttendance("AuthenticationRequired"));
      return;
    }

    try {
      setIsAdding(true);
      const token = await authState.currentUser.getIdToken();
      const result = await createAttendanceEmployee({
        name: trimmedName,
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
      setName("");
      setIsDialogOpen(false);
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

  const onToggleAbsent = async (employeeId: string) => {
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
        const nextAbsentDates = isAbsentOnSelectedDate
          ? employee.absentDates.filter((date) => date !== dateYmd)
          : [...employee.absentDates, dateYmd].sort();

        return {
          ...employee,
          absentDates: nextAbsentDates,
        };
      }),
    );

    try {
      const token = await authState.currentUser.getIdToken();
      const result = await toggleEmployeeAbsent({
        employeeId,
        dateYmd,
        user: authState.clientUser,
        authtoken: token,
      });

      if (!result.success) {
        setEmployees(previous);
        toast.error(result.error || tAttendance("UnableToUpdateAttendance"));
        return;
      }

      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === employeeId
            ? {
                ...employee,
                absentDates: result.data.absentDates,
              }
            : employee,
        ),
      );
    } catch (error) {
      setEmployees(previous);
      toast.error(
        error instanceof Error
          ? error.message
          : tAttendance("UnableToUpdateAttendance"),
      );
    } finally {
      setSavingEmployeeId(null);
    }
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 text-primary border border-primary"
              variant="outline"
            >
              <UserPlus2 className="size-4" />
              {tAttendance("AddEmployee")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{tAttendance("AddEmployee")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
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
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 [&>button]:shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isAdding}
              >
                {tCommon("Cancel")}
              </Button>
              <Button onClick={onAddEmployee} disabled={isAdding}>
                {isAdding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus2 className="size-4" />
                )}
                {tCommon("Add")}
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
            const currentMonthAbsentDays = employee.absentDates.filter(
              (date) => getMonthPrefix(date) === getMonthPrefix(selectedDate),
            ).length;

            return (
              <Card key={employee.id} className="p-2">
                <CardContent className="p-0 gap-2 flex flex-col">
                  <div className="flex flex-wrap gap-3 justify-between items-start">
                    <div className="flex px-2 gap-1 items-center">
                      <UserCircle2 className="size-5 text-primary" />
                      <h3
                        className={`text-primary font-semibold text-lg ${textHeadingCls}`}
                      >
                        {employee.name}
                      </h3>
                      {/* <p
                        className={`text-xs text-muted-foreground ${textSmCls}`}
                      >
                        {tAttendance("JoinedOn", {
                          date: prettyDate(employee.joiningDate, locale),
                        })}
                      </p> */}
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
                    <div className="flex items-center justify-between border rounded-md px-3 py-2 shadow-sm">
                      <Label
                        htmlFor={`absent-switch-${employee.id}`}
                        className={`text-sm ${textBodyCls}`}
                      >
                        {tAttendance("MarkAsAbsent")}
                      </Label>
                      <Switch
                        id={`absent-switch-${employee.id}`}
                        checked={isAbsentOnSelectedDate}
                        disabled={isSaving}
                        onCheckedChange={() => onToggleAbsent(employee.id)}
                        checkedThumbLabel="A"
                        uncheckedThumbLabel="P"
                        className="h-7 w-16 data-[state=checked]:bg-red-700"
                        thumbClassName={clsx(
                          "size-6 data-[state=checked]:translate-x-[150%] text-sm text-primary",
                          textBodyCls,
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between border rounded-md px-3 py-2 gap-3">
                      <span className={`text-sm ${textSmCls}`}>
                        {tAttendance("AttendanceDate")}
                      </span>
                      <div className="flex flex-col items-end gap-1">
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
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
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
                      </div>
                    </div>

                    <div className="flex items-center justify-between border rounded-md px-3 py-2">
                      <span className={`text-sm ${textSmCls}`}>
                        {tAttendance("TotalAbsentThisMonth")}
                        <span
                          className={`text-sm font-semibold ${textBodyCls}`}
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
                  </div>

                  {isSaving && (
                    <div className="text-xs text-primary flex items-center gap-1">
                      <Loader2 className="size-3.5 animate-spin" />
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
