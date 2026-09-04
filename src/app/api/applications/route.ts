import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching applications:", error);

    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const applicationId =
      body.applicationId ||
      `AIIT-${Date.now().toString().slice(-8)}`;

    const [application] = await db
      .insert(applications)
      .values({
        applicationId,
        courseId: Number(body.courseId),
        universityId: body.universityId
          ? Number(body.universityId)
          : null,
        studyMode: body.studyMode || null,

        firstName: String(body.firstName || "").trim(),
        lastName: String(body.lastName || "").trim(),
        fatherName: String(body.fatherName || "").trim(),
        motherName: String(body.motherName || "").trim(),

        dob: body.dob || null,
        gender: body.gender || null,

        mobile: String(body.mobile || "").trim(),
        email: String(body.email || "").trim(),

        address: String(body.address || "").trim(),
        city: String(body.city || "").trim(),
        state: String(body.state || "").trim(),
        pinCode: String(body.pinCode || "").trim(),

        tenthBoard: body.tenthBoard || null,
        tenthYear: body.tenthYear || null,
        tenthPercentage: body.tenthPercentage || null,

        twelfthBoard: body.twelfthBoard || null,
        twelfthYear: body.twelfthYear || null,
        twelfthPercentage: body.twelfthPercentage || null,

        gradUniversity: body.gradUniversity || null,
        gradYear: body.gradYear || null,
        gradPercentage: body.gradPercentage || null,

        declaration: Boolean(body.declaration),

        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        application,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating application:", error);

    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";