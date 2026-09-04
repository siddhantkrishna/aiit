import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
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
          ilike(staff.employeeId, `%${search}%`),
          ilike(staff.name, `%${search}%`),
          ilike(staff.role, `%${search}%`),
          ilike(staff.department, `%${search}%`),
          ilike(staff.email, `%${search}%`),
          ilike(staff.mobile, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(eq(staff.status, status));
    }

    const rows = await db
      .select()
      .from(staff)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(staff.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load staff:", error);

    return NextResponse.json(
      { error: "Failed to load staff." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Staff name is required." },
        { status: 400 },
      );
    }

    const employeeId =
      String(body.employeeId || "").trim() ||
      `EMP-${Date.now().toString().slice(-8)}`;

    const [member] = await db
      .insert(staff)
      .values({
        employeeId,
        name,

        role:
          String(body.role || "").trim() || null,

        department:
          String(body.department || "").trim() || null,

        centreId:
          body.centreId ? Number(body.centreId) : null,

        joiningDate:
          body.joiningDate || null,

        employmentType:
          String(body.employmentType || "").trim() || null,

        salary:
          body.salary != null
            ? String(body.salary)
            : null,

        managerId:
          body.managerId ? Number(body.managerId) : null,

        status:
          String(body.status || "ACTIVE"),

        email:
          String(body.email || "").trim() || null,

        mobile:
          String(body.mobile || "").trim() || null,

        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        staff: member,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create staff:", error);

    return NextResponse.json(
      { error: "Failed to create staff." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";