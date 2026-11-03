import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mobile, date } from "@/lib/validation";
import { rateLimit } from "@/lib/request-security";
import { authenticateStudent, createStudentSession, setStudentCookie } from "@/lib/student-auth";

export async function POST(req: NextRequest) {
  try {
    const parsed = z.object({ studentId: z.string().trim().min(1).max(100), mobile, dob: date, accessCode: z.string().min(16).max(128) }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter your student details and the access code issued by AIIT." }, { status: 400 });
    const body = parsed.data;
    const limited = await rateLimit(req, "student-account", 10, body.studentId);
    if (limited) return limited;
    const student = await authenticateStudent(
      String(body.studentId || ""),
      String(body.mobile || ""),
      String(body.dob || ""),
      body.accessCode,
    );

    if (!student) return NextResponse.json({ error: "Student details could not be verified." }, { status: 401 });

    const { accessCodeHash, ...publicStudent } = student;
    const response = NextResponse.json({ success: true, student: publicStudent });
    setStudentCookie(response, createStudentSession(student.id, accessCodeHash!));
    return response;
  } catch (error) {
    console.error("Student login failed:", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
