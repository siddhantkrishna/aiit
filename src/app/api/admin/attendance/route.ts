import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffAttendance, staff } from "@/db/schema";
import { and, desc, eq, sql, getTableColumns } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { attendanceSchema, id } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const query = req.nextUrl.searchParams;
    const conditions = [];
    if (query.get("leaveStatus") && query.get("leaveStatus") !== "ALL") conditions.push(eq(staffAttendance.leaveStatus, query.get("leaveStatus")!));
    if (query.get("staffId")) conditions.push(eq(staffAttendance.staffId, Number(query.get("staffId"))));
    if (query.get("date")) conditions.push(eq(staffAttendance.attendanceDate, query.get("date")!));
    return NextResponse.json(await db.select({ ...getTableColumns(staffAttendance), staffName: staff.name }).from(staffAttendance).leftJoin(staff, eq(staffAttendance.staffId, staff.id)).where(and(...conditions)).orderBy(desc(staffAttendance.attendanceDate)));
  } catch { return NextResponse.json({ error: "Unable to load attendance." }, { status: 500 }); }
}
export async function POST(req: NextRequest) { return save(req); }
export async function PUT(req: NextRequest) { return save(req); }
async function save(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = attendanceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const value = parsed.data;
    if (req.method === "PUT") {
      if (!id.safeParse(body.id).success) return NextResponse.json({ error: "Select a valid attendance record." }, { status: 400 });
      const [existing] = await db.select().from(staffAttendance).where(eq(staffAttendance.id, Number(body.id)));
      if (!existing || existing.staffId !== value.staffId || existing.attendanceDate !== value.attendanceDate) return NextResponse.json({ error: "Employee and date identify the record. Choose Add new for a different employee or date." }, { status: 409 });
    }
    // shortcut: attendance is same-day in India time, add shift rules when overnight shifts are introduced.
    if ([value.checkIn, value.checkOut].some(time => time && time.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) !== value.attendanceDate)) return NextResponse.json({ error: "Use attendance timestamps on the selected date (India time)." }, { status: 400 });
    if (["LEAVE", "ABSENT"].includes(value.leaveStatus) && (value.checkIn || value.checkOut)) return NextResponse.json({ error: "Leave/absence cannot contain working timestamps." }, { status: 400 });
    const error = await invalidReference(value);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const attendance = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`attendance:${value.staffId}:${value.attendanceDate}`}, 0))`);
      const records = await tx.select().from(staffAttendance).where(and(eq(staffAttendance.staffId, value.staffId), eq(staffAttendance.attendanceDate, value.attendanceDate)));
      if (records.length > 1) throw new Error("Existing duplicate attendance requires review");
      const values = { ...value, workingHours: value.checkIn && value.checkOut ? ((value.checkOut.getTime() - value.checkIn.getTime()) / 3600000).toFixed(2) : null, leaveStatus: value.leaveStatus === "PRESENT" && value.lateMinutes > 0 ? "LATE" : value.leaveStatus };
      const [record] = records.length ? await tx.update(staffAttendance).set(values).where(eq(staffAttendance.id, records[0].id)).returning() : await tx.insert(staffAttendance).values(values).returning();
      return record;
    });
    return NextResponse.json({ success: true, attendance });
  } catch { return NextResponse.json({ error: "Unable to save attendance. Review duplicate records or invalid times." }, { status: 400 }); }
}
export const dynamic = "force-dynamic";
