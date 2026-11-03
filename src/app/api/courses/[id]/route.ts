import { invalidReference } from "@/lib/record-validation";
import { courseSchema, id as validId } from "@/lib/validation";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const parsed = courseSchema.partial().safeParse(await req.json());
    if (!validId.safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid catalogue update" }, { status: 400 });
    const referenceError = await invalidReference({ universityId: parsed.data.universityId });
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const updated = await db.update(courses).set({ ...parsed.data, ...(parsed.data.verificationStatus ? { lastVerifiedAt: parsed.data.verificationStatus === "VERIFIED" ? new Date() : null } : {}) }).where(eq(courses.id, Number(id))).returning();
    if (!updated.length) return NextResponse.json({ error: "Record not found" }, { status: 404 });
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
    if (!requireAdmin(_req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!validId.safeParse(id).success) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await db.update(courses).set({ enabled: false }).where(eq(courses.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
