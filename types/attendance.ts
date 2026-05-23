export type AttendanceEmployeeDoc = {
  id: string;
  name: string;
  absentDates: string[]; // YYYY-MM-DD
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type AttendanceEmployeeListItem = {
  id: string;
  name: string;
  absentDates: string[];
};

export type AttendanceEmployeeDetails = {
  id: string;
  name: string;
  absentDates: string[];
};

export type MonthWiseAbsence = {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  absentDates: string[];
};
