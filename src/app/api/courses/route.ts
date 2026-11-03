import { invalidReference } from "@/lib/record-validation";
import { courseSchema } from "@/lib/validation";
import { publicCourse } from "@/lib/catalogue";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const allCourses = await db.select().from(courses).where(requireAdmin(req) ? undefined : publicCourse).orderBy(desc(courses.createdAt));
    return NextResponse.json(requireAdmin(req) ? allCourses : allCourses.map(row => ({ id: row.id, name: row.name, fullName: row.fullName, duration: row.duration, eligibility: row.eligibility, universityId: row.universityId, studyMode: row.studyMode, category: row.category, fee: row.fee, enabled: row.enabled })));
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = courseSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const referenceError = await invalidReference({ universityId: parsed.data.universityId });
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const newCourse = await db.insert(courses).values({ ...parsed.data, lastVerifiedAt: parsed.data.verificationStatus === "VERIFIED" ? new Date() : null }).returning();
    return NextResponse.json(newCourse[0]);
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
