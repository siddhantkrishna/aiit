import { NextRequest, NextResponse } from "next/server";
import { asc, eq, and, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { onlineExams, students } from "@/db/schema";
import { studentSessionId } from "@/lib/student-portal";

export async function GET(req:NextRequest) {
  try {
    const studentId=studentSessionId(req);
    if(!studentId)return NextResponse.json({error:"Student sign-in required."},{status:401});
    const [person]=await db.select({courseId:students.courseId}).from(students).where(eq(students.id,studentId));
    if(!person)return NextResponse.json({error:"Student sign-in required."},{status:401});
    const rows = await db.select({
      id: onlineExams.id, examCode: onlineExams.examCode, title: onlineExams.title,
      instructions: onlineExams.instructions, startsAt: onlineExams.startsAt, endsAt: onlineExams.endsAt,
      durationMinutes: onlineExams.durationMinutes, totalMarks: onlineExams.totalMarks, passingMarks: onlineExams.passingMarks,
    }).from(onlineExams).where(and(eq(onlineExams.published,true),person.courseId?or(isNull(onlineExams.courseId),eq(onlineExams.courseId,person.courseId)):isNull(onlineExams.courseId))).orderBy(asc(onlineExams.startsAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load online exams:", error);
    return NextResponse.json({ error: "Failed to load online exams." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
