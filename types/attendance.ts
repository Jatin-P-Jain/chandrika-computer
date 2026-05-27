export type AttendanceEmployeeDoc = {
  id: string;
  name: string;
  absentDates: string[]; // YYYY-MM-DD
  absentReasons: Record<string, string>; // YYYY-MM-DD -> reason
  monthlySalary: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type AttendanceEmployeeListItem = {
  id: string;
  name: string;
  absentDates: string[];
  absentReasons: Record<string, string>;
  monthlySalary: number | null;
};

export type AttendanceEmployeeDetails = {
  id: string;
  name: string;
  absentDates: string[];
  absentReasons: Record<string, string>;
  monthlySalary: number | null;
};

export type MonthWiseAbsence = {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  absentDates: string[];
};
