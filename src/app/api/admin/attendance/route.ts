import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffAttendance } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const leaveStatus =
      searchParams.get("leaveStatus")?.trim() || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(
            staffAttendance.attendanceDate,
            `%${search}%`,
          ),
          ilike(
            staffAttendance.leaveStatus,
            `%${search}%`,
          ),
        ),
      );
    }

    if (leaveStatus && leaveStatus !== "ALL") {
      conditions.push(
        eq(staffAttendance.leaveStatus, leaveStatus),
      );
    }

    const rows = await db
      .select()
      .from(staffAttendance)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(staffAttendance.attendanceDate));

    return NextResponse.json(rows);
  } catch (error) {
    console.error(
      "Failed to load attendance:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load attendance." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const staffId = Number(body.staffId);

    if (!staffId || !body.attendanceDate) {
      return NextResponse.json(
        {
          error:
            "Staff ID and attendance date are required.",
        },
        { status: 400 },
      );
    }

    const [record] = await db
      .insert(staffAttendance)
      .values({
        staffId,

        centreId: body.centreId
          ? Number(body.centreId)
          : null,

        attendanceDate: body.attendanceDate,

        checkIn: body.checkIn
          ? new Date(body.checkIn)
          : null,

        checkOut: body.checkOut
          ? new Date(body.checkOut)
          : null,

        workingHours:
          body.workingHours != null
            ? String(body.workingHours)
            : null,

        lateMinutes:
          body.lateMinutes != null
            ? Number(body.lateMinutes)
            : null,

        leaveStatus:
          String(body.leaveStatus || "PRESENT"),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        attendance: record,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create attendance:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create attendance." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";