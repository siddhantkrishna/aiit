import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { date, mobile } from "@/lib/validation";

export async function GET() {
  return NextResponse.json({ error: "Use the verified status form." }, { status: 405, headers: { Allow: "POST" } });
}
export async function POST(req: NextRequest) {
  try {
    const parsed = z.object({ applicationId: z.string().trim().min(1).max(50), mobile, dob: date }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter application number, registered mobile and date of birth." }, { status: 400 });
    const value = parsed.data;
    const rows = await db.select({ applicationId: applications.applicationId, course: courses.name, status: applications.status, applicationStatus: applications.applicationStatus, nextAction: applications.nextAction, submittedAt: applications.createdAt, updatedAt: applications.updatedAt })
      .from(applications).leftJoin(courses, eq(courses.id, applications.courseId))
      .where(and(eq(applications.applicationId, value.applicationId), eq(applications.mobile, value.mobile), eq(applications.dob, value.dob)));
    if (!rows.length) return NextResponse.json({ error: "Application details could not be verified." }, { status: 404 });
    return NextResponse.json(rows, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to check status." }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
