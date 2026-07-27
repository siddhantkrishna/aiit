import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db
      .update(courses)
      .set({
        name: body.name,
        fullName: body.fullName,
        duration: body.duration,
        eligibility: body.eligibility,
        universityId: body.universityId || null,
        studyMode: body.studyMode,
        category: body.category,
        fee: body.fee || null,
        enabled: body.enabled,
      })
      .where(eq(courses.id, parseInt(id)))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(courses).where(eq(courses.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
