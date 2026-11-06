import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";

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
          ? and(...conditions)
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
    const firstName = String(body.firstName || "").trim();
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    const dob = String(body.dob || "").trim();
    const validDob = /^\d{4}-\d{2}-\d{2}$/.test(dob) &&
      !Number.isNaN(Date.parse(dob)) &&
      new Date(dob).toISOString().slice(0, 10) === dob;

    if (!firstName || mobile.length !== 10 || !validDob) {
      return NextResponse.json(
        { error: "First name, a 10-digit mobile number, and a valid date of birth are required." },
        { status: 400 },
      );
    }

    const documentStatus = String(body.documentStatus || "NOT RECEIVED").trim().toUpperCase();
    if (!["NOT RECEIVED", "PARTIAL", "COMPLETE"].includes(documentStatus)) {
      return NextResponse.json(
        { error: "Document status must be NOT RECEIVED, PARTIAL, or COMPLETE." },
        { status: 400 },
      );
    }

    const studentId =
      String(body.studentId || "").trim() ||
      `STU-${randomUUID().slice(0, 8).toUpperCase()}`;

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

        firstName,

        lastName:
          String(body.lastName || "").trim() || null,

        dob,
        gender: body.gender || null,

        mobile,

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

        paymentStatus:
          String(body.paymentStatus || "PENDING"),

        documentStatus,

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
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    const code = cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : "unknown";
    // Avoid logging SQL parameters, which can contain student contact details.
    console.error("Failed to create student (database code):", code);

    if (code === "23505") {
      return NextResponse.json(
        { error: "A student with this ID already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create student. Please contact the administrator if the problem persists." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";