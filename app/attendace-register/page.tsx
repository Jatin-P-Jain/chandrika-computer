import { Suspense } from "react";
import { getAttendanceEmployees } from "./actions";
import { AttendanceRegisterClient } from "./attendance-register-client";
import { AttendanceRegisterSkeleton } from "./attendance-register-skeleton";

export default async function Page() {
  const attendancePromise = getAttendanceEmployees();

  return (
    <Suspense fallback={<AttendanceRegisterSkeleton />}>
      <AttendanceRegisterClient attendancePromise={attendancePromise} />
    </Suspense>
  );
}
