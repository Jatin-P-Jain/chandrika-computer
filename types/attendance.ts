export type AttendanceEmployeeDoc = {
  id: string;
  name: string;
  absentDates: string[]; // YYYY-MM-DD
  absentReasons: Record<string, string>; // YYYY-MM-DD -> reason
  monthlySalary: number | null;
  lastSalaryUpdatedAt: Date | null;
  salaryAuditTrail: AttendanceSalaryAuditEntry[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type AttendanceSalaryAuditEntry = {
  previousSalary: number | null;
  newSalary: number | null;
  updatedAt: Date | null;
  updatedBy: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
};

export type AttendanceEmployeeListItem = {
  id: string;
  name: string;
  absentDates: string[];
  absentReasons: Record<string, string>;
  monthlySalary: number | null;
  lastSalaryUpdatedAt: Date | null;
  salaryAuditTrail: AttendanceSalaryAuditEntry[];
};

export type AttendanceEmployeeDetails = {
  id: string;
  name: string;
  absentDates: string[];
  absentReasons: Record<string, string>;
  monthlySalary: number | null;
  lastSalaryUpdatedAt: Date | null;
  salaryAuditTrail: AttendanceSalaryAuditEntry[];
};

export type MonthWiseAbsence = {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  absentDates: string[];
};
