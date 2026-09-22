import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { getStudentFromRequest } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  try {
    const sessionId = getStudentFromRequest(req);
    if (!sessionId) return NextResponse.json({ authenticated: false }, { status: 401 });

    const [student] = await db.select({
      id: students.id, studentId: students.studentId, firstName: students.firstName, lastName: students.lastName,
      email: students.email, mobile: students.mobile, dob: students.dob, programName: students.programName,
      studentStatus: students.studentStatus, totalFee: students.totalFee, amountPaid: students.amountPaid, amountPending: students.amountPending,
    }).from(students).where(eq(students.id, Number(sessionId)));

    if (!student) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, student });
  } catch (error) {
    console.error("Failed to load student session:", error);
    return NextResponse.json({ error: "Unable to load student session." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
