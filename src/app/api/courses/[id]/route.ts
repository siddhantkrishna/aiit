import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findDuplicateCourse } from "@/lib/course-search";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    sameOrigin(req);
    adminIdentity(req);
    const { id } = await params;
    const body = await req.json();
    const courseId = Number(id);
    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    }
    const [current] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!current) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    const candidate = {
      ...current,
      ...body,
      universityId: body.universityId !== undefined
        ? (Number(body.universityId) || null)
        : current.universityId,
    };
    if (candidate.enabled !== false) {
      const activeCourses = await db.select().from(courses).where(eq(courses.enabled, true));
      const duplicate = findDuplicateCourse(activeCourses, candidate, courseId);
      if (duplicate) {
        return NextResponse.json({
          error: `This course already exists: ${duplicate.name} (${duplicate.studyMode ?? "Regular"}). Edit the existing course instead.`,
          existingCourseId: duplicate.id,
        }, { status: 409 });
      }
    }
    const updated = await db
      .update(courses)
      .set({
        name: body.name,
        fullName: body.fullName,
        duration: body.duration,
        eligibility: body.eligibility,
        ...(body.universityId !== undefined ? { universityId: Number(body.universityId) || null } : {}),
        studyMode: body.studyMode,
        category: body.category,
        fee: body.fee || null,
        enabled: body.enabled,
      })
      .where(eq(courses.id, courseId))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating course:", error);
    return feeResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    sameOrigin(req);
    adminIdentity(req);
    const { id } = await params;
    await db.delete(courses).where(eq(courses.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return feeResponse(error);
  }
}

export const dynamic = "force-dynamic";
