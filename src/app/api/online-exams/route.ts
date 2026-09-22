import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { onlineExams } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db.select({
      id: onlineExams.id, examCode: onlineExams.examCode, title: onlineExams.title,
      instructions: onlineExams.instructions, startsAt: onlineExams.startsAt, endsAt: onlineExams.endsAt,
      durationMinutes: onlineExams.durationMinutes, totalMarks: onlineExams.totalMarks, passingMarks: onlineExams.passingMarks,
    }).from(onlineExams).where(eq(onlineExams.published, true)).orderBy(asc(onlineExams.startsAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load online exams:", error);
    return NextResponse.json({ error: "Failed to load online exams." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
