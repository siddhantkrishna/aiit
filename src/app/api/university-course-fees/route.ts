import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { feeConfigurations, universities, courses } from "@/db/schema";
import { indiaDate } from "@/lib/fees/rules";

export async function GET(req: NextRequest) {
  const courseId = Number(req.nextUrl.searchParams.get("courseId"));
  const universityId = Number(req.nextUrl.searchParams.get("universityId"));
  if (!Number.isSafeInteger(courseId) || courseId < 1 || !Number.isSafeInteger(universityId) || universityId < 1) {
    return NextResponse.json({error:"Choose a course and university."},{status:400});
  }
  try {
    const [course, university] = await Promise.all([
      db.select({id:courses.id,enabled:courses.enabled,universityId:courses.universityId}).from(courses).where(eq(courses.id,courseId)),
      db.select({id:universities.id,enabled:universities.enabled}).from(universities).where(eq(universities.id,universityId)),
    ]);
    if (!course[0]?.enabled || !university[0]?.enabled || (course[0].universityId && course[0].universityId !== universityId)) {
      return NextResponse.json({available:false});
    }
    const [fee] = await db.select({originalAmount:feeConfigurations.originalAmount,semesters:feeConfigurations.semesters})
      .from(feeConfigurations)
      .where(and(eq(feeConfigurations.courseId,courseId),eq(feeConfigurations.universityId,universityId),lte(feeConfigurations.effectiveFrom,indiaDate())))
      .orderBy(desc(feeConfigurations.effectiveFrom),desc(feeConfigurations.id)).limit(1);
    return NextResponse.json(fee?{available:true,courseId,universityId,...fee}:{available:false,courseId,universityId},{headers:{"cache-control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Fee quote temporarily unavailable."},{status:503});
  }
}
export const dynamic="force-dynamic";
