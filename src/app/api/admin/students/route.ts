import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
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
          ilike(students.studentId, `%${search}%`),
          ilike(students.firstName, `%${search}%`),
          ilike(students.lastName, `%${search}%`),
          ilike(students.mobile, `%${search}%`),
          ilike(students.email, `%${search}%`),
          ilike(students.programName, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(eq(students.studentStatus, status));
    }

    const rows = await db
      .select()
      .from(students)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(students.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load students:", error);

    return NextResponse.json(
      { error: "Failed to load students." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const studentId =
      String(body.studentId || "").trim() ||
      `STU-${Date.now().toString().slice(-8)}`;

    const [student] = await db
      .insert(students)
      .values({
        studentId,

        leadId: body.leadId
          ? Number(body.leadId)
          : null,

        applicationId: body.applicationId
          ? Number(body.applicationId)
          : null,

        centreId: body.centreId
          ? Number(body.centreId)
          : null,

        firstName:
          String(body.firstName || "").trim() || null,

        lastName:
          String(body.lastName || "").trim() || null,

        dob: body.dob || null,
        gender: body.gender || null,

        mobile:
          String(body.mobile || "").trim() || null,

        whatsapp:
          String(body.whatsapp || "").trim() || null,

        email:
          String(body.email || "").trim() || null,

        address:
          String(body.address || "").trim() || null,

        village:
          String(body.village || "").trim() || null,

        city:
          String(body.city || "").trim() || null,

        state:
          String(body.state || "").trim() || null,

        pinCode:
          String(body.pinCode || "").trim() || null,

        qualification:
          String(body.qualification || "").trim() || null,

        courseId: body.courseId
          ? Number(body.courseId)
          : null,

        universityId: body.universityId
          ? Number(body.universityId)
          : null,

        programName:
          String(body.programName || "").trim() || null,

        studyMode:
          String(body.studyMode || "").trim() || null,

        admissionDate:
          body.admissionDate || null,

        studentStatus:
          String(body.studentStatus || "ACTIVE"),

        totalFee:
          body.totalFee != null
            ? String(body.totalFee)
            : "0",

        amountPaid:
          body.amountPaid != null
            ? String(body.amountPaid)
            : "0",

        amountPending:
          body.amountPending != null
            ? String(body.amountPending)
            : "0",

        paymentStatus:
          String(body.paymentStatus || "PENDING"),

        documentStatus:
          String(body.documentStatus || "PENDING"),

        applicationStatus:
          String(body.applicationStatus || "COMPLETED"),

        enrollmentNumber:
          String(body.enrollmentNumber || "").trim() || null,

        examStatus:
          String(body.examStatus || "").trim() || null,

        resultStatus:
          String(body.resultStatus || "").trim() || null,

        certificateStatus:
          String(body.certificateStatus || "").trim() || null,

        assignedStaffId:
          body.assignedStaffId
            ? Number(body.assignedStaffId)
            : null,

        emergencyContactName:
          String(body.emergencyContactName || "").trim() || null,

        emergencyContactMobile:
          String(body.emergencyContactMobile || "").trim() || null,

        bloodGroup:
          String(body.bloodGroup || "").trim() || null,

        admissionSource:
          String(body.admissionSource || "").trim() || null,

        completionDate:
          body.completionDate || null,

        remarks:
          String(body.remarks || "").trim() || null,

        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        student,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create student:", error);

    return NextResponse.json(
      { error: "Failed to create student." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";