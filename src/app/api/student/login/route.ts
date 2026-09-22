import { NextRequest, NextResponse } from "next/server";
import { authenticateStudent, createStudentSession, setStudentCookie } from "@/lib/student-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const student = await authenticateStudent(
      String(body.studentId || ""),
      String(body.mobile || ""),
      String(body.dob || ""),
    );

    if (!student) return NextResponse.json({ error: "Student details could not be verified." }, { status: 401 });

    const response = NextResponse.json({ success: true, student });
    setStudentCookie(response, createStudentSession(student.id));
    return response;
  } catch (error) {
    console.error("Student login failed:", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
