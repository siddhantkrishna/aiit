import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentServices } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(
            studentServices.serviceType,
            `%${search}%`,
          ),
          ilike(
            studentServices.referenceNumber,
            `%${search}%`,
          ),
          ilike(
            studentServices.notes,
            `%${search}%`,
          ),
          ilike(
            studentServices.remarks,
            `%${search}%`,
          ),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(
        eq(studentServices.status, status),
      );
    }

    const rows = await db
      .select()
      .from(studentServices)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(studentServices.requestedAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error(
      "Failed to load student services:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load student services." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const studentId = Number(body.studentId);
    const serviceType = String(
      body.serviceType || "",
    ).trim();

    if (!studentId || !serviceType) {
      return NextResponse.json(
        {
          error:
            "Student ID and service type are required.",
        },
        { status: 400 },
      );
    }

    const [service] = await db
      .insert(studentServices)
      .values({
        studentId,

        serviceType,

        status: String(
          body.status || "PENDING",
        ),

        priority: String(
          body.priority || "NORMAL",
        ),

        requestedAt: body.requestedAt
          ? new Date(body.requestedAt)
          : new Date(),

        dueDate:
          body.dueDate || null,

        completedAt: body.completedAt
          ? new Date(body.completedAt)
          : null,

        ownerId: body.ownerId
          ? Number(body.ownerId)
          : null,

        assignedTo: body.assignedTo
          ? Number(body.assignedTo)
          : null,

        requestedBy: body.requestedBy
          ? Number(body.requestedBy)
          : null,

        referenceNumber:
          String(
            body.referenceNumber || "",
          ).trim() || null,

        notes:
          String(body.notes || "").trim() || null,

        remarks:
          String(body.remarks || "").trim() || null,

        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        service,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create student service:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create student service." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";