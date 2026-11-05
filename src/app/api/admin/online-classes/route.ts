import { NextRequest, NextResponse } from "next/server";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { onlineClasses } from "@/db/schema";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function validWebUrl(value: string) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const search = text(req.nextUrl.searchParams.get("search"));
    const rows = await db
      .select()
      .from(onlineClasses)
      .where(
        search
          ? or(
              ilike(onlineClasses.title, `%${search}%`),
              ilike(onlineClasses.instructor, `%${search}%`),
            )
          : undefined,
      )
      .orderBy(asc(onlineClasses.scheduledAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load online classes:", error);
    return NextResponse.json({ error: "Failed to load online classes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = text(body.title);
    const scheduledAt = text(body.scheduledAt);
    const meetingUrl = text(body.meetingUrl);
    const recordingUrl = text(body.recordingUrl);
    const durationMinutes = Number(body.durationMinutes ?? 60);

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Class title and schedule are required." }, { status: 400 });
    }

    const when = new Date(scheduledAt);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
      return NextResponse.json({ error: "Duration must be between 1 and 600 minutes." }, { status: 400 });
    }
    if (!validWebUrl(meetingUrl) || !validWebUrl(recordingUrl)) {
      return NextResponse.json({ error: "Meeting and recording links must be valid HTTP(S) URLs." }, { status: 400 });
    }
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid class date/time." }, { status: 400 });
    }

    const [created] = await db
      .insert(onlineClasses)
      .values({
        title,
        description: text(body.description) || null,
        instructor: text(body.instructor) || null,
        courseId: body.courseId ? Number(body.courseId) : null,
        scheduledAt: when,
        durationMinutes,
        meetingUrl: meetingUrl || null,
        recordingUrl: recordingUrl || null,
        status: text(body.status) || "SCHEDULED",
        enabled: body.enabled !== false,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, class: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create online class:", error);
    return NextResponse.json({ error: "Failed to create online class." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "A valid class ID is required." }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["title", "description", "instructor", "meetingUrl", "recordingUrl", "status"]) {
      if (body[key] !== undefined) patch[key] = text(body[key]) || null;
    }
    if (body.courseId !== undefined) patch.courseId = body.courseId ? Number(body.courseId) : null;
    if (body.durationMinutes !== undefined) {
      const minutes = Number(body.durationMinutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) return NextResponse.json({ error: "Duration must be 1–600 minutes." }, { status: 400 });
      patch.durationMinutes = minutes;
    }
    for (const key of ["meetingUrl", "recordingUrl"]) {
      if (body[key] !== undefined && !validWebUrl(text(body[key]))) {
        return NextResponse.json({ error: "Meeting and recording links must be valid HTTP(S) URLs." }, { status: 400 });
      }
    }
    if (body.scheduledAt !== undefined) {
      const when = new Date(text(body.scheduledAt));
      if (Number.isNaN(when.getTime())) return NextResponse.json({ error: "Invalid class date/time." }, { status: 400 });
      patch.scheduledAt = when;
    }
    if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);

    const [updated] = await db.update(onlineClasses).set(patch).where(eq(onlineClasses.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Class not found." }, { status: 404 });
    return NextResponse.json({ success: true, class: updated });
  } catch (error) {
    console.error("Failed to update online class:", error);
    return NextResponse.json({ error: "Failed to update online class." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "A valid class ID is required." }, { status: 400 });
    await db.delete(onlineClasses).where(eq(onlineClasses.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete online class:", error);
    return NextResponse.json({ error: "Failed to delete online class." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
