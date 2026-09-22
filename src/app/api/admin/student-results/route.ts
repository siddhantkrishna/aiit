import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentResults, students } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db.select({ result: studentResults, student: { studentId: students.studentId, firstName: students.firstName, lastName: students.lastName } })
      .from(studentResults).leftJoin(students, eq(studentResults.studentId, students.id)).orderBy(desc(studentResults.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load results:", error);
    return NextResponse.json({ error: "Failed to load results." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const studentId = Number(body.studentId);
    const maxMarks = Number(body.maxMarks);
    const marksObtained = Number(body.marksObtained);
    const examination = String(body.examination || "").trim();
    const subject = String(body.subject || "").trim();
    if (!studentId || !examination || !subject || !Number.isFinite(maxMarks) || maxMarks <= 0 || !Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > maxMarks) {
      return NextResponse.json({ error: "Please provide valid student, examination, subject and marks." }, { status: 400 });
    }
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId));
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const percentage = (marksObtained / maxMarks) * 100;
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : percentage >= 40 ? "D" : "F";
    const [result] = await db.insert(studentResults).values({
      studentId, examination, semester: String(body.semester || "").trim() || null, subject,
      maxMarks: String(maxMarks), marksObtained: String(marksObtained), grade,
      resultStatus: marksObtained / maxMarks >= 0.4 ? "PASS" : "FAIL",
      published: Boolean(body.published), remarks: String(body.remarks || "").trim() || null,
      updatedAt: new Date(),
    }).returning();
    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    console.error("Failed to create student result:", error);
    return NextResponse.json({ error: "Failed to save result." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Valid result ID required." }, { status: 400 });
    await db.delete(studentResults).where(eq(studentResults.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete result:", error);
    return NextResponse.json({ error: "Failed to delete result." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
