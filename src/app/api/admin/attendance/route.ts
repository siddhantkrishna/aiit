import { AttendanceError } from "@/lib/attendance/rules";
import { NextRequest, NextResponse } from "next/server";
import {
  attendanceAdmin,
  attendanceError,
  attendanceReport,
  clockAttendance,
  saveAttendance,
} from "@/lib/attendance/server";

export async function GET(req: NextRequest) {
  try {
    attendanceAdmin(req);
    return await attendanceReport(req.nextUrl.searchParams);
  } catch (error) {
    return attendanceError(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const adminId = attendanceAdmin(req, true);
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new AttendanceError("Invalid request body.");
    const attendance = await saveAttendance(adminId, body.records || [body]);
    return NextResponse.json({ success: true, attendance }, { status: 201 });
  } catch (error) {
    return attendanceError(error);
  }
}
export async function PUT(req: NextRequest) {
  try {
    const adminId = attendanceAdmin(req, true);
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new AttendanceError("Invalid request body.");
    const attendance = body.action
      ? await clockAttendance(adminId, body)
      : await saveAttendance(adminId, body.records || [body], true);
    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    return attendanceError(error);
  }
}
export const dynamic = "force-dynamic";
