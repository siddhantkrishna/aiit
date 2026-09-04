import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
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
          ilike(leads.name, `%${search}%`),
          ilike(leads.mobile, `%${search}%`),
          ilike(leads.email, `%${search}%`),
          ilike(leads.leadId, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(eq(leads.status, status));
    }

    const rows = await db
      .select()
      .from(leads)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(leads.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load leads:", error);

    return NextResponse.json(
      { error: "Failed to load leads." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const mobile = String(body.mobile || "").trim();

    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required." },
        { status: 400 },
      );
    }

    const leadId =
      String(body.leadId || "").trim() ||
      `LEAD-${Date.now().toString().slice(-8)}`;

    const [lead] = await db
      .insert(leads)
      .values({
        leadId,
        name,
        mobile,
        whatsapp:
          String(body.whatsapp || "").trim() || null,
        email:
          String(body.email || "").trim() || null,
        location:
          String(body.location || "").trim() || null,
        qualification:
          String(body.qualification || "").trim() || null,
        interestedCourseId:
          body.interestedCourseId
            ? Number(body.interestedCourseId)
            : null,
        preferredUniversityId:
          body.preferredUniversityId
            ? Number(body.preferredUniversityId)
            : null,
        source:
          String(body.source || "").trim() || null,
        centreId:
          body.centreId ? Number(body.centreId) : null,
        assignedTo:
          body.assignedTo ? Number(body.assignedTo) : null,
        status: String(body.status || "NEW"),
        priority: String(body.priority || "NORMAL"),
        nextAction:
          String(body.nextAction || "").trim() || null,
        expectedAdmissionDate:
          body.expectedAdmissionDate || null,
        notes:
          String(body.notes || "").trim() || null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        lead,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create lead:", error);

    return NextResponse.json(
      { error: "Failed to create lead." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";