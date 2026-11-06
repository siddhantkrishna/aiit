import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, applications, courses, feePlans } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { feeReport } from "@/lib/fees/report";
import { requireAdmin } from "@/lib/admin-auth";
import { randomUUID } from "node:crypto";

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({error:"Unauthorized"},{status:401});
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

    const ledger = await feeReport();
    const result = rows.map(student => {
      const balances = ledger.balances.filter(b => b.studentRef === student.studentId || (student.applicationId && b.applicationRef === student.applicationId));
      if (!balances.length) return student;
      const total = balances.reduce((sum,b) => sum+b.amount,0), paid = balances.reduce((sum,b) => sum+b.paid,0);
      return {...student,totalFee:String(total/100),amountPaid:String(paid/100),amountPending:String(Math.max(0,total-paid)/100),paymentStatus:paid>=total?"PAID IN FULL":paid>0?"PARTIALLY PAID":"PAYMENT PENDING"};
    });
    return NextResponse.json(result);
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
    if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    return await db.transaction(async tx => {
    if (body.applicationId) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`enrollment:${String(body.applicationId).trim()}`}))`);
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

    if (Number(body.amountPaid || 0) !== 0) return NextResponse.json({ error: "Record payments through the audited Fees & Payments workflow." }, { status: 400 });
    const applicationRef = String(body.applicationId || "").trim();
    if (applicationRef) {
      const [application] = await tx.select().from(applications).where(eq(applications.applicationId, applicationRef));
      const linked = await tx.select({ id: students.id }).from(students).where(eq(students.applicationId, applicationRef));
      if (!application || linked.length || application.mobile !== mobile || application.dob !== dob) return NextResponse.json({ error: "Use a unique application with matching mobile and date of birth." }, { status: 409 });
      body.courseId = application.courseId;
      body.universityId = application.universityId;
    }
    if (body.courseId) {
      const [course] = await tx.select({id:courses.id}).from(courses).where(eq(courses.id,Number(body.courseId)));
      if (!course) return NextResponse.json({error:"Select a valid course."},{status:400});
    }
    const [student] = await tx
      .insert(students)
      .values({
        studentId,

        leadId: body.leadId
          ? Number(body.leadId)
          : null,

        applicationId: applicationRef || null,

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

    if (applicationRef) {
      const [application] = await tx.select({id:applications.id}).from(applications).where(eq(applications.applicationId,applicationRef));
      await tx.update(feePlans).set({studentId:student.id}).where(eq(feePlans.applicationId,application.id));
    }
    return NextResponse.json(
      {
        success: true,
        student,
      },
      { status: 201 },
    );
    });
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