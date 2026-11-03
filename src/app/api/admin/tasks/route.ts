import { randomUUID } from "node:crypto";
import { taskSchema, id } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffTasks } from "@/db/schema";
import { desc, eq, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(staffTasks.taskId, `%${search}%`),
          ilike(staffTasks.taskName, `%${search}%`),
          ilike(staffTasks.description, `%${search}%`),
          ilike(staffTasks.remarks, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(eq(staffTasks.status, status));
    }

    if (priority && priority !== "ALL") {
      conditions.push(eq(staffTasks.priority, priority));
    }

    const rows = await db
      .select()
      .from(staffTasks)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined,
      )
      .orderBy(desc(staffTasks.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load tasks:", error);

    return NextResponse.json(
      { error: "Failed to load tasks." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) { return save(req, false); }
export async function PUT(req: NextRequest) { return save(req, true); }

async function save(req: NextRequest, updating: boolean) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (updating && !id.safeParse(body.id).success) return NextResponse.json({ error: "Valid record ID required." }, { status: 400 });
    const [existing] = updating ? await db.select().from(staffTasks).where(eq(staffTasks.id, Number(body.id))) : [];
    if (updating && !existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    const parsed = taskSchema.safeParse({ ...existing, ...body });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const referenceError = await invalidReference(parsed.data);
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const values = { ...parsed.data, updatedAt: new Date() };
    const [record] = updating
      ? await db.update(staffTasks).set(values).where(eq(staffTasks.id, Number(body.id))).returning()
      : await db.insert(staffTasks).values({ ...values, taskId: `TASK-${randomUUID()}` }).returning();
    return NextResponse.json({ success: true, task: record }, { status: updating ? 200 : 201 });
  } catch { return NextResponse.json({ error: "Unable to save tasks." }, { status: 400 }); }
}
export const dynamic = "force-dynamic";
