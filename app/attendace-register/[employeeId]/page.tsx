import { notFound } from "next/navigation";
import { getEmployeeAttendanceDetail } from "../actions";
import { EmployeeAttendanceDetails } from "./employee-attendance-details";

type Props = {
  params: Promise<{
    employeeId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { employeeId } = await params;
  const result = await getEmployeeAttendanceDetail(employeeId);

  if (!result.data) {
    notFound();
  }

  return <EmployeeAttendanceDetails employee={result.data} />;
}
