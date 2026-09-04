import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffTasks } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
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
          ? or(...conditions)
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const taskName = String(body.taskName || "").trim();

    if (!taskName) {
      return NextResponse.json(
        { error: "Task name is required." },
        { status: 400 },
      );
    }

    const taskId =
      String(body.taskId || "").trim() ||
      `TASK-${Date.now().toString().slice(-8)}`;

    const [task] = await db
      .insert(staffTasks)
      .values({
        taskId,
        staffId: body.staffId
          ? Number(body.staffId)
          : null,
        centreId: body.centreId
          ? Number(body.centreId)
          : null,
        taskDate: body.taskDate || null,
        taskName,
        description:
          String(body.description || "").trim() || null,
        deadline: body.deadline
          ? new Date(body.deadline)
          : null,
        assignedTo: body.assignedTo
          ? Number(body.assignedTo)
          : null,
        priority:
          String(body.priority || "NORMAL"),
        dueDate: body.dueDate || null,
        status:
          String(body.status || "PENDING"),
        remarks:
          String(body.remarks || "").trim() || null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create task:", error);

    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";