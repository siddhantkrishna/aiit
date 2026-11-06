import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { attendanceAdmin, attendanceError } from "@/lib/attendance/server";
import { AttendanceError, positiveId } from "@/lib/attendance/rules";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    attendanceAdmin(req);
    const id = positiveId((await params).id, "Employee");
    const [member] = await db
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        role: staff.role,
        department: staff.department,
        status: staff.status,
        joiningDate: staff.joiningDate,
        employmentType: staff.employmentType,
        email: staff.email,
        mobile: staff.mobile,
      })
      .from(staff)
      .where(eq(staff.id, id));
    if (!member) throw new AttendanceError("Staff member not found.", 404);
    return NextResponse.json(member, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return attendanceError(error);
  }
}
export const dynamic = "force-dynamic";
