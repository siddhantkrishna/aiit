import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentResults } from "@/db/schema";
import { getStudentFromRequest } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  try {
    const sessionId = getStudentFromRequest(req);
    if (!sessionId) return NextResponse.json({ error: "Student login required." }, { status: 401 });

    const rows = await db.select().from(studentResults)
      .where(eq(studentResults.studentId, Number(sessionId)))
      .orderBy(asc(studentResults.examination), asc(studentResults.subject));

    return NextResponse.json(rows.filter((row) => row.published));
  } catch (error) {
    console.error("Failed to load student results:", error);
    return NextResponse.json({ error: "Unable to load results." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
