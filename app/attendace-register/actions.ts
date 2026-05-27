"use server";

import { fireStore } from "@/firebase/server";
import { ensureAdminAccess } from "@/lib/daily-accounts/policy";
import { startFirestoreMetric } from "@/lib/firebase/firestore-metrics";
import type {
  AttendanceEmployeeDetails,
  AttendanceSalaryAuditEntry,
  AttendanceEmployeeDoc,
  AttendanceEmployeeListItem,
} from "@/types/attendance";
import type { UserData } from "@/types/user";
import { revalidatePath } from "next/cache";

type TimestampLike = { toMillis: () => number };

const EMPLOYEE_COLLECTION = "attendance-employees";

function toYmd(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isYmd(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "object" && ts !== null) {
    const maybe = ts as TimestampLike;
    if (typeof maybe.toMillis === "function") return maybe.toMillis();
  }
  return null;
}

function toDate(ts: unknown): Date | null {
  const ms = toMillis(ts);
  return ms ? new Date(ms) : null;
}

function normalizeName(input: string) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function normalizeEmployeeId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "employee"}-${Date.now()}`;
}

function getMonthPrefix(ymd: string) {
  return ymd.slice(0, 7);
}

function normalizeEmployeeDoc(
  id: string,
  raw: Record<string, unknown>,
): AttendanceEmployeeDoc {
  const absentReasonsRaw =
    typeof raw.absentReasons === "object" && raw.absentReasons !== null
      ? (raw.absentReasons as Record<string, unknown>)
      : {};

  const absentReasons: Record<string, string> = Object.fromEntries(
    Object.entries(absentReasonsRaw).filter(
      ([key, value]) => isYmd(key) && typeof value === "string",
    ),
  ) as Record<string, string>;

  const salaryAuditTrailRaw = Array.isArray(raw.salaryAuditTrail)
    ? raw.salaryAuditTrail
    : [];

  const salaryAuditTrail: AttendanceSalaryAuditEntry[] = salaryAuditTrailRaw
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) {
        return null;
      }

      const value = entry as Record<string, unknown>;
      const updatedByRaw =
        typeof value.updatedBy === "object" && value.updatedBy !== null
          ? (value.updatedBy as Record<string, unknown>)
          : {};

      const previousSalary =
        typeof value.previousSalary === "number" && value.previousSalary > 0
          ? value.previousSalary
          : null;
      const newSalary =
        typeof value.newSalary === "number" && value.newSalary > 0
          ? value.newSalary
          : null;

      return {
        previousSalary,
        newSalary,
        updatedAt: toDate(value.updatedAt),
        updatedBy: {
          uid: typeof updatedByRaw.uid === "string" ? updatedByRaw.uid : "",
          displayName:
            typeof updatedByRaw.displayName === "string"
              ? updatedByRaw.displayName
              : null,
          email:
            typeof updatedByRaw.email === "string" ? updatedByRaw.email : null,
        },
      } satisfies AttendanceSalaryAuditEntry;
    })
    .filter((entry): entry is AttendanceSalaryAuditEntry => entry !== null)
    .sort(
      (a, b) =>
        (toMillis(b.updatedAt) ?? 0) -
        (toMillis(a.updatedAt) ?? 0),
    );

  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "",
    absentDates: Array.isArray(raw.absentDates)
      ? raw.absentDates.filter((v): v is string => typeof v === "string")
      : [],
    absentReasons,
    monthlySalary:
      typeof raw.monthlySalary === "number" && raw.monthlySalary > 0
        ? raw.monthlySalary
        : null,
    lastSalaryUpdatedAt: toDate(raw.lastSalaryUpdatedAt),
    salaryAuditTrail,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}

export async function getAttendanceEmployees(): Promise<{
  data: AttendanceEmployeeListItem[];
}> {
  const done = startFirestoreMetric({
    source: "server",
    operation: "getAttendanceEmployees",
    collection: EMPLOYEE_COLLECTION,
  });

  const snap = await fireStore
    .collection(EMPLOYEE_COLLECTION)
    .orderBy("name", "asc")
    .get();

  done({
    success: true,
    docsRead: snap.size,
  });

  const data = snap.docs.map((doc) => {
    const employee = normalizeEmployeeDoc(
      doc.id,
      doc.data() as Record<string, unknown>,
    );

    return {
      id: employee.id,
      name: employee.name,
      absentDates: employee.absentDates,
      absentReasons: employee.absentReasons,
      monthlySalary: employee.monthlySalary,
      lastSalaryUpdatedAt: employee.lastSalaryUpdatedAt,
      salaryAuditTrail: employee.salaryAuditTrail,
    } satisfies AttendanceEmployeeListItem;
  });

  return { data };
}

export async function createAttendanceEmployee(opts: {
  name: string;
  monthlySalary?: number | null;
  user: UserData;
  authtoken: string;
}) {
  try {
    const access = await ensureAdminAccess(opts.user, opts.authtoken);
    if (!access.ok) {
      return {
        success: false as const,
        error: access.message,
      };
    }

    const name = normalizeName(opts.name);
    if (!name) {
      return { success: false as const, error: "Employee name is required" };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "createAttendanceEmployee",
      collection: EMPLOYEE_COLLECTION,
    });

    const nameMatches = await fireStore
      .collection(EMPLOYEE_COLLECTION)
      .where("name", "==", name)
      .limit(10)
      .get();

    const duplicate = nameMatches.docs[0];

    if (duplicate) {
      return {
        success: false as const,
        error: "Employee already exists",
      };
    }

    const id = normalizeEmployeeId(name);
    const now = new Date();

    const salary =
      typeof opts.monthlySalary === "number" && opts.monthlySalary > 0
        ? opts.monthlySalary
        : null;

    await fireStore.collection(EMPLOYEE_COLLECTION).doc(id).set({
      id,
      name,
      absentDates: [],
      absentReasons: {},
      monthlySalary: salary,
      lastSalaryUpdatedAt: salary ? now : null,
      salaryAuditTrail: salary
        ? [
            {
              previousSalary: null,
              newSalary: salary,
              updatedAt: now,
              updatedBy: {
                uid: opts.user.uid,
                displayName: opts.user.displayName,
                email: opts.user.email,
              },
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    });

    done({
      success: true,
      docsRead: nameMatches.size,
      docsWritten: 1,
      details: { employeeId: id },
    });

    revalidatePath("/attendace-register");

    return {
      success: true as const,
      data: {
        id,
        name,
        absentDates: [],
        absentReasons: {},
        monthlySalary: salary,
        lastSalaryUpdatedAt: salary ? now : null,
        salaryAuditTrail: salary
          ? [
              {
                previousSalary: null,
                newSalary: salary,
                updatedAt: now,
                updatedBy: {
                  uid: opts.user.uid,
                  displayName: opts.user.displayName,
                  email: opts.user.email,
                },
              },
            ]
          : [],
      } satisfies AttendanceEmployeeListItem,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unable to add employee",
    };
  }
}

export async function updateEmployeeSalary(opts: {
  employeeId: string;
  monthlySalary: number | null;
  user: UserData;
  authtoken: string;
}) {
  try {
    const access = await ensureAdminAccess(opts.user, opts.authtoken);
    if (!access.ok) {
      return { success: false as const, error: access.message };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "updateEmployeeSalary",
      collection: EMPLOYEE_COLLECTION,
    });

    const ref = fireStore.collection(EMPLOYEE_COLLECTION).doc(opts.employeeId);
    const snap = await ref.get();

    if (!snap.exists) {
      return { success: false as const, error: "Employee not found" };
    }

    const salary =
      typeof opts.monthlySalary === "number" && opts.monthlySalary > 0
        ? opts.monthlySalary
        : null;

    const employee = normalizeEmployeeDoc(
      snap.id,
      snap.data() as Record<string, unknown>,
    );

    if (employee.monthlySalary === salary) {
      done({
        success: true,
        docsRead: 1,
        docsWritten: 0,
        details: { employeeId: opts.employeeId, unchanged: true },
      });

      return {
        success: true as const,
        data: {
          monthlySalary: salary,
          lastSalaryUpdatedAt: employee.lastSalaryUpdatedAt,
          salaryAuditTrail: employee.salaryAuditTrail,
        },
      };
    }

    const now = new Date();
    const nextSalaryAuditTrail: AttendanceSalaryAuditEntry[] = [
      {
        previousSalary: employee.monthlySalary,
        newSalary: salary,
        updatedAt: now,
        updatedBy: {
          uid: opts.user.uid,
          displayName: opts.user.displayName,
          email: opts.user.email,
        },
      },
      ...employee.salaryAuditTrail,
    ].slice(0, 50);

    await ref.set(
      {
        monthlySalary: salary,
        lastSalaryUpdatedAt: now,
        salaryAuditTrail: nextSalaryAuditTrail,
        updatedAt: now,
      },
      { merge: true },
    );

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { employeeId: opts.employeeId },
    });

    revalidatePath("/attendace-register");
    revalidatePath(`/attendace-register/${opts.employeeId}`);

    return {
      success: true as const,
      data: {
        monthlySalary: salary,
        lastSalaryUpdatedAt: now,
        salaryAuditTrail: nextSalaryAuditTrail,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unable to update salary",
    };
  }
}

export async function toggleEmployeeAbsent(opts: {
  employeeId: string;
  dateYmd: string;
  reason?: string;
  user: UserData;
  authtoken: string;
}) {
  try {
    const access = await ensureAdminAccess(opts.user, opts.authtoken);
    if (!access.ok) {
      return {
        success: false as const,
        error: access.message,
      };
    }

    if (!isYmd(opts.dateYmd)) {
      return {
        success: false as const,
        error: "Date must be in YYYY-MM-DD format",
      };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "toggleEmployeeAbsent",
      collection: EMPLOYEE_COLLECTION,
    });

    const ref = fireStore.collection(EMPLOYEE_COLLECTION).doc(opts.employeeId);
    const snap = await ref.get();

    if (!snap.exists) {
      return { success: false as const, error: "Employee not found" };
    }

    const employee = normalizeEmployeeDoc(
      snap.id,
      snap.data() as Record<string, unknown>,
    );

    const set = new Set(employee.absentDates);
    const currentlyAbsent = set.has(opts.dateYmd);
    const normalizedReason = opts.reason?.trim();

    if (!currentlyAbsent && !normalizedReason) {
      return {
        success: false as const,
        error: "Reason is required when marking absent",
      };
    }

    const nextAbsentReasons = { ...employee.absentReasons };

    if (currentlyAbsent) {
      set.delete(opts.dateYmd);
      delete nextAbsentReasons[opts.dateYmd];
    } else {
      set.add(opts.dateYmd);
      nextAbsentReasons[opts.dateYmd] = normalizedReason as string;
    }

    const nextAbsentDates = Array.from(set).sort();
    await ref.set(
      {
        absentDates: nextAbsentDates,
        absentReasons: nextAbsentReasons,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { employeeId: opts.employeeId, dateYmd: opts.dateYmd },
    });

    revalidatePath("/attendace-register");
    revalidatePath(`/attendace-register/${opts.employeeId}`);

    return {
      success: true as const,
      data: {
        absentDates: nextAbsentDates,
        absentReasons: nextAbsentReasons,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Unable to update attendance",
    };
  }
}

export async function deleteAttendanceEmployee(opts: {
  employeeId: string;
  user: UserData;
  authtoken: string;
}) {
  try {
    const access = await ensureAdminAccess(opts.user, opts.authtoken);
    if (!access.ok) {
      return {
        success: false as const,
        error: access.message,
      };
    }

    const done = startFirestoreMetric({
      source: "server",
      operation: "deleteAttendanceEmployee",
      collection: EMPLOYEE_COLLECTION,
    });

    const ref = fireStore.collection(EMPLOYEE_COLLECTION).doc(opts.employeeId);
    const snap = await ref.get();

    if (!snap.exists) {
      return { success: false as const, error: "Employee not found" };
    }

    await ref.delete();

    done({
      success: true,
      docsRead: 1,
      docsWritten: 1,
      details: { employeeId: opts.employeeId },
    });

    revalidatePath("/attendace-register");
    revalidatePath(`/attendace-register/${opts.employeeId}`);

    return {
      success: true as const,
      data: {
        employeeId: opts.employeeId,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unable to delete employee",
    };
  }
}

export async function getEmployeeAttendanceDetail(
  employeeId: string,
): Promise<{ data: AttendanceEmployeeDetails | null }> {
  const done = startFirestoreMetric({
    source: "server",
    operation: "getEmployeeAttendanceDetail",
    collection: EMPLOYEE_COLLECTION,
  });

  const snap = await fireStore.collection(EMPLOYEE_COLLECTION).doc(employeeId).get();

  done({
    success: true,
    docsRead: snap.exists ? 1 : 0,
    details: { employeeId },
  });

  if (!snap.exists) {
    return { data: null };
  }

  const employee = normalizeEmployeeDoc(
    snap.id,
    snap.data() as Record<string, unknown>,
  );

  return {
    data: {
      id: employee.id,
      name: employee.name,
      absentDates: employee.absentDates.sort(),
      absentReasons: employee.absentReasons,
      monthlySalary: employee.monthlySalary,
      lastSalaryUpdatedAt: employee.lastSalaryUpdatedAt,
      salaryAuditTrail: employee.salaryAuditTrail,
    },
  };
}
