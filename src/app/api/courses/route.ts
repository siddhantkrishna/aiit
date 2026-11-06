import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allCourses = await db.select().from(courses).orderBy(desc(courses.createdAt));
    return NextResponse.json(allCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    adminIdentity(req);
    const body = await req.json();
    const newCourse = await db.insert(courses).values({
      name: body.name,
      fullName: body.fullName,
      duration: body.duration,
      eligibility: body.eligibility,
      universityId: body.universityId || null,
      studyMode: body.studyMode,
      category: body.category,
      fee: body.fee || null,
      enabled: body.enabled ?? true,
    }).returning();
    return NextResponse.json(newCourse[0]);
  } catch (error) {
    console.error("Error creating course:", error);
    return feeResponse(error);
  }
}

export const dynamic = "force-dynamic";
