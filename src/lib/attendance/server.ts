import { NextRequest, NextResponse } from "next/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { staff, staffAttendance } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ATTENDANCE_STATUSES,
  AttendanceError,
  attendanceValues,
  csvCell,
  demoStaff,
  indiaDate,
  indiaDateTime,
  monthRange,
  positiveId,
  validDate,
  type AttendanceInput,
} from "./rules";

export function attendanceAdmin(req: NextRequest, write = false) {
  const user = requireAdmin(req);
  if (!user) throw new AttendanceError("Administrator sign-in required.", 401);
  if (
    write &&
    req.headers.get("origin") &&
    req.headers.get("origin") !== req.nextUrl.origin
  )
    throw new AttendanceError("Cross-origin request rejected.", 403);
  return Number(user.id);
}
export function attendanceError(error: unknown) {
  if (error instanceof AttendanceError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  const cause =
    error instanceof Error && "cause" in error ? error.cause : error;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : "unknown";
  if (code === "23505")
    return NextResponse.json(
      {
        error:
          "Attendance already exists for this employee and date. Refresh and edit that record instead.",
      },
      { status: 409 },
    );
  if (code === "23503")
    return NextResponse.json(
      { error: "The employee record changed. Refresh and try again." },
      { status: 409 },
    );
  if (code === "23514")
    return NextResponse.json(
      { error: "Attendance values are invalid." },
      { status: 400 },
    );
  console.error("Attendance request failed (database code):", code);
  return NextResponse.json(
    { error: "Unable to process attendance. Please try again." },
    { status: 503 },
  );
}
export async function saveAttendance(
  adminId: number,
  inputs: unknown,
  editOnly = false,
  now = new Date(),
) {
  if (!Array.isArray(inputs) || !inputs.length || inputs.length > 250)
    throw new AttendanceError("Submit between 1 and 250 attendance records.");
  const records = inputs
    .map((input) => {
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw new AttendanceError("Invalid attendance record.");
      const values = attendanceValues(input as AttendanceInput, now);
      const id =
        input.id == null ? null : positiveId(input.id, "Attendance record");
      const version = id ? positiveId(input.version, "Record version") : null;
      if (editOnly && !id)
        throw new AttendanceError(
          "An existing attendance record and version are required.",
        );
      return { values, id, version };
    })
    .sort(
      (a, b) =>
        a.values.staffId - b.values.staffId ||
        a.values.attendanceDate.localeCompare(b.values.attendanceDate),
    );
  const keys = records.map(
    (r) => `${r.values.staffId}:${r.values.attendanceDate}`,
  );
  if (new Set(keys).size !== keys.length)
    throw new AttendanceError(
      "The same employee and date appear twice in this request.",
      409,
    );
  return db.transaction(async (tx) => {
    const employees = await tx
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        centreId: staff.centreId,
        joiningDate: staff.joiningDate,
      })
      .from(staff)
      .where(
        inArray(
          staff.id,
          records.map((r) => r.values.staffId),
        ),
      )
      .orderBy(asc(staff.id))
      .for("share");
    const saved = [];
    for (const record of records) {
      const member = employees.find((s) => s.id === record.values.staffId);
      if (!member)
        throw new AttendanceError(
          "An employee no longer exists. Refresh the staff list.",
          404,
        );
      if (
        member.joiningDate &&
        record.values.attendanceDate < member.joiningDate
      )
        throw new AttendanceError(
          "Attendance cannot precede the employee’s joining date.",
        );
      const values = {
        ...record.values,
        centreId: member.centreId,
        isDemo: demoStaff(member),
        markedBy: adminId,
        updatedAt: new Date(),
      };
      if (record.id) {
        const [row] = await tx
          .update(staffAttendance)
          .set({ ...values, version: sql`${staffAttendance.version} + 1` })
          .where(
            and(
              eq(staffAttendance.id, record.id),
              eq(staffAttendance.staffId, values.staffId),
              eq(staffAttendance.attendanceDate, values.attendanceDate),
              eq(staffAttendance.version, record.version!),
            ),
          )
          .returning();
        if (!row)
          throw new AttendanceError(
            "Attendance changed since you opened it. Refresh before editing; no records from this batch were saved.",
            409,
          );
        saved.push(row);
      } else {
        const [row] = await tx
          .insert(staffAttendance)
          .values(values)
          .returning();
        saved.push(row);
      }
    }
    return saved;
  });
}
export async function clockAttendance(
  adminId: number,
  body: Record<string, unknown>,
  now = new Date(),
) {
  const staffId = positiveId(body.staffId, "Employee");
  const date = indiaDate(now);
  const [existing] = await db
    .select()
    .from(staffAttendance)
    .where(
      and(
        eq(staffAttendance.staffId, staffId),
        eq(staffAttendance.attendanceDate, date),
      ),
    );
  if (
    existing &&
    positiveId(body.version, "Record version") !== existing.version
  )
    throw new AttendanceError(
      "Attendance changed. Refresh before checking in or out.",
      409,
    );
  if (existing && !["PRESENT", "HALF DAY"].includes(existing.leaveStatus || ""))
    throw new AttendanceError(
      "Edit the Absent/Leave status before recording working time.",
      409,
    );
  if (body.action === "check_in" && existing?.checkIn)
    throw new AttendanceError("This employee is already checked in.", 409);
  if (body.action === "check_out" && (!existing?.checkIn || existing.checkOut))
    throw new AttendanceError(
      "An open check-in is required for check-out.",
      409,
    );
  if (body.action !== "check_in" && body.action !== "check_out")
    throw new AttendanceError("Unknown attendance action.");
  return saveAttendance(
    adminId,
    [
      {
        id: existing?.id,
        version: existing?.version,
        staffId,
        attendanceDate: date,
        leaveStatus: existing?.leaveStatus || "PRESENT",
        shiftStart: existing?.shiftStart?.slice(0, 5) || body.shiftStart,
        checkIn: existing?.checkIn
          ? indiaDateTime(existing.checkIn)
          : indiaDateTime(now),
        checkOut: body.action === "check_out" ? indiaDateTime(now) : null,
        notes: existing?.notes,
      },
    ],
    false,
    now,
  );
}
const isDemo = sql<boolean>`(coalesce(${staffAttendance.isDemo}, false) OR ${staff.employeeId} ILIKE 'DEMO-%' OR ${staff.name} ~* '^DEMO([[:space:][:punct:]]|$)')`;
export type AttendanceFilters = ReturnType<typeof parseAttendanceFilters>;
export function parseAttendanceFilters(
  params: URLSearchParams,
  now = new Date(),
) {
  const today = indiaDate(now);
  const date = params.get("date") || today;
  if (!validDate(date))
    throw new AttendanceError("Choose a valid attendance date.");
  const month = params.get("month") || date.slice(0, 7);
  const range = monthRange(month);
  const from = params.get("from") || range.from,
    to = params.get("to") || range.to;
  if (!validDate(from) || !validDate(to) || from > to)
    throw new AttendanceError(
      "Choose a valid date range, with the start before the end.",
    );
  const status = params.get("status") || params.get("leaveStatus") || "ALL";
  if (!["ALL", "LATE", ...ATTENDANCE_STATUSES].includes(status))
    throw new AttendanceError("Choose a valid attendance status.");
  const scope = params.get("scope") || "all";
  if (!["all", "official", "demo"].includes(scope))
    throw new AttendanceError("Choose official, DEMO, or all records.");
  const page = params.get("page") ? positiveId(params.get("page"), "Page") : 1;
  if (page > 1_000_000) throw new AttendanceError("Page is out of range.");
  const search = params.get("search")?.trim() || "";
  const department = params.get("department")?.trim() || "";
  if (search.length > 255 || department.length > 100)
    throw new AttendanceError("The search or department filter is too long.");
  return {
    today,
    date,
    month,
    from,
    to,
    status,
    scope,
    page,
    search,
    department,
    staffId: params.get("staffId")
      ? positiveId(params.get("staffId"), "Employee")
      : null,
    monthFrom: range.from,
    monthTo: range.to,
  };
}
function conditions(f: AttendanceFilters) {
  const where: Array<SQL | undefined> = [];
  if (f.search)
    where.push(
      or(
        ilike(staff.name, `%${f.search}%`),
        ilike(staff.employeeId, `%${f.search}%`),
        ilike(staff.department, `%${f.search}%`),
        sql`${staffAttendance.attendanceDate}::text ILIKE ${`%${f.search}%`}`,
      ),
    );
  if (f.staffId) where.push(eq(staff.id, f.staffId));
  if (f.department) where.push(eq(staff.department, f.department));
  if (f.status !== "ALL")
    where.push(
      f.status === "LATE"
        ? sql`${staffAttendance.lateMinutes} > 0`
        : eq(staffAttendance.leaveStatus, f.status),
    );
  if (f.scope !== "all")
    where.push(f.scope === "demo" ? isDemo : sql`NOT ${isDemo}`);
  return where;
}
function statistics(where: Array<SQL | undefined>) {
  return db
    .select({
      total: count(),
      present: sql<number>`count(*) filter(where ${staffAttendance.leaveStatus}='PRESENT')::int`,
      absent: sql<number>`count(*) filter(where ${staffAttendance.leaveStatus}='ABSENT')::int`,
      halfDay: sql<number>`count(*) filter(where ${staffAttendance.leaveStatus}='HALF DAY')::int`,
      leave: sql<number>`count(*) filter(where ${staffAttendance.leaveStatus}='LEAVE')::int`,
      late: sql<number>`count(*) filter(where ${staffAttendance.lateMinutes}>0)::int`,
      hours: sql<string>`coalesce(sum(${staffAttendance.workingHours}),0)::text`,
    })
    .from(staffAttendance)
    .innerJoin(staff, eq(staff.id, staffAttendance.staffId))
    .where(and(...where));
}
const historyColumns = {
  record: staffAttendance,
  employeeId: staff.employeeId,
  name: staff.name,
  department: staff.department,
  isDemo,
};
export async function attendanceReport(params: URLSearchParams) {
  const filters = parseAttendanceFilters(params);
  const base = conditions(filters);
  const range = [
    gte(staffAttendance.attendanceDate, filters.from),
    lte(staffAttendance.attendanceDate, filters.to),
  ];
  const exportCsv = params.get("export") === "csv";
  const history = db
    .select(historyColumns)
    .from(staffAttendance)
    .innerJoin(staff, eq(staff.id, staffAttendance.staffId))
    .where(and(...base, ...range))
    .orderBy(
      desc(staffAttendance.attendanceDate),
      asc(staff.name),
      asc(staffAttendance.id),
    );
  if (exportCsv) {
    const rows = await history;
    const headers = [
      "Record type",
      "Employee ID",
      "Employee",
      "Department",
      "Date (India)",
      "Status",
      "Scheduled start (India)",
      "Check in (India)",
      "Check out (India)",
      "Working hours",
      "Late minutes",
      "Notes",
    ];
    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((r) =>
        [
          r.isDemo ? "DEMO" : "OFFICIAL",
          r.employeeId,
          r.name,
          r.department,
          r.record.attendanceDate,
          r.record.leaveStatus,
          r.record.shiftStart,
          r.record.checkIn ? indiaDateTime(r.record.checkIn) : "",
          r.record.checkOut ? indiaDateTime(r.record.checkOut) : "",
          r.record.workingHours,
          r.record.lateMinutes,
          r.record.notes,
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\r\n");
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=aiit-attendance-${filters.scope}-${filters.from}.csv`,
        "cache-control": "private, no-store",
      },
    });
  }
  const [rows, totals, daily, monthly, roster, employees, demoPeriod] =
    await Promise.all([
      history.limit(100).offset((filters.page - 1) * 100),
      statistics([...base, ...range]),
      statistics([
        ...base,
        eq(staffAttendance.attendanceDate, filters.date),
        sql`NOT ${isDemo}`,
      ]),
      statistics([
        ...base,
        gte(staffAttendance.attendanceDate, filters.monthFrom),
        lte(staffAttendance.attendanceDate, filters.monthTo),
        sql`NOT ${isDemo}`,
      ]),
      db
        .select({
          employee: {
            id: staff.id,
            employeeId: staff.employeeId,
            name: staff.name,
            department: staff.department,
            status: staff.status,
          },
          record: staffAttendance,
          isDemo,
        })
        .from(staff)
        .leftJoin(
          staffAttendance,
          and(
            eq(staffAttendance.staffId, staff.id),
            eq(staffAttendance.attendanceDate, filters.date),
          ),
        )
        .where(
          and(
            ...base,
            or(
              sql`${staff.joiningDate} IS NULL`,
              lte(staff.joiningDate, filters.date),
            ),
          ),
        )
        .orderBy(asc(staff.name)),
      db
        .select({
          id: staff.id,
          employeeId: staff.employeeId,
          name: staff.name,
          department: staff.department,
        })
        .from(staff)
        .orderBy(asc(staff.name)),
      db
        .select({
          from: sql<
            string | null
          >`min(${staffAttendance.attendanceDate})::text`,
          to: sql<string | null>`max(${staffAttendance.attendanceDate})::text`,
          total: count(),
        })
        .from(staffAttendance)
        .innerJoin(staff, eq(staff.id, staffAttendance.staffId))
        .where(
          and(
            isDemo,
            filters.staffId ? eq(staff.id, filters.staffId) : undefined,
          ),
        ),
    ]);
  return NextResponse.json(
    {
      filters,
      rows,
      total: totals[0].total,
      matchingSummary: totals[0],
      officialDaily: daily[0],
      officialMonthly: monthly[0],
      roster,
      employees,
      departments: [
        ...new Set(
          employees.map((e) => e.department).filter((d): d is string => !!d),
        ),
      ].sort(),
      demoPeriod: demoPeriod[0],
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
export type AttendanceRow = {
  record: typeof staffAttendance.$inferSelect;
  employeeId: string;
  name: string;
  department: string | null;
  isDemo: boolean;
};
