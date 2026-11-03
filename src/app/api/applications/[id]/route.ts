import { adjustBalance, paise } from "@/lib/payment-balance";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents, applicationStatusHistory, students, courses, leads, payments } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { signDocument } from "@/lib/private-storage";
import { z } from "zod";
import { date } from "@/lib/validation";

const reviewSchema = z.object({
  applicationStatus: z.enum(["RECEIVED", "UNDER REVIEW", "DOCUMENTS PENDING", "VERIFIED", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"]),
  documentStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  nextAction: z.string().trim().max(2000).optional(), remarks: z.string().trim().max(4000).optional(),
  dueDate: z.union([date, z.literal("")]).optional(),
});
const condition = (id: string) => /^\d+$/.test(id) ? eq(applications.id, Number(id)) : eq(applications.applicationId, id);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [application] = await db.select().from(applications).where(condition((await params).id));
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const [docs, history] = await Promise.all([
      db.select().from(documents).where(eq(documents.applicationId, application.applicationId)),
      db.select().from(applicationStatusHistory).where(eq(applicationStatusHistory.applicationId, application.id)).orderBy(desc(applicationStatusHistory.changedAt)),
    ]);
    return NextResponse.json({
      application: { ...application, paymentScreenshotPath: await signDocument(application.paymentScreenshotPath) },
      documents: await Promise.all(docs.map(async doc => ({ ...doc, filePath: await signDocument(doc.filePath) }))), history,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load application or secure documents. Check private storage setup." }, { status: 503 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = reviewSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const value = parsed.data;
    const id = (await params).id;
    const result = await db.transaction(async tx => {
      const [app] = await tx.select().from(applications).where(condition(id)).for("update");
      if (!app) return { error: "Application not found", status: 404 };
      if (value.applicationStatus === "DOCUMENTS PENDING" && !value.nextAction?.trim()) return { error: "Describe the missing documents in Next action.", status: 400 };
      const approving = ["APPROVED", "COMPLETED"].includes(value.applicationStatus);
      if (approving && ((value.documentStatus ?? app.documentStatus) !== "VERIFIED" || (value.verificationStatus ?? app.verificationStatus) !== "VERIFIED")) return { error: "Verify documents and applicant details before approval.", status: 400 };
      if (approving) {
        // Serialize matching identities across different applications as well as repeated approvals.
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${app.mobile}:${app.dob}:${app.courseId}`}, 0))`);
        const matches = await tx.select().from(students).where(or(eq(students.applicationId, app.id), and(eq(students.mobile, app.mobile), eq(students.dob, app.dob), eq(students.courseId, app.courseId))));
        if (matches.length > 1 || (matches[0]?.applicationId && matches[0].applicationId !== app.id)) return { error: "A matching student already exists. Review and link records before approval.", status: 409 };
        const [course] = await tx.select({ name: courses.name }).from(courses).where(eq(courses.id, app.courseId));
        if (!matches.length) {
          const [student] = await tx.insert(students).values({ studentId: `AIIT-STU-${app.applicationId.slice(5)}`, applicationId: app.id, leadId: app.leadId, centreId: app.centreId,
            firstName: app.firstName, lastName: app.lastName, fatherName: app.fatherName, motherName: app.motherName, dob: app.dob, gender: app.gender, mobile: app.mobile, email: app.email,
            address: app.address, city: app.city, state: app.state, pinCode: app.pinCode, qualification: app.qualification || (app.gradUniversity ? "Graduate" : app.twelfthBoard ? "12th" : "10th"),
            courseId: app.courseId, universityId: app.universityId, programName: course?.name, studyMode: app.studyMode, admissionDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
            documentStatus: "VERIFIED", applicationStatus: value.applicationStatus, studentStatus: "ACTIVE", totalFee: "0", amountPaid: "0", amountPending: "0",
          }).returning({ id: students.id });
          await tx.update(payments).set({ studentId: student.id }).where(and(eq(payments.applicationId, app.id), sql`student_id is null`));
          const registrationPayments = await tx.select().from(payments).where(and(eq(payments.studentId, student.id), eq(payments.paymentStatus, "VERIFIED")));
          const collected = registrationPayments.reduce((sum, p) => sum + paise(p.amount), 0);
          if (collected) await adjustBalance(tx, student.id, collected);
        } else {
          await tx.update(students).set({ applicationId: app.id, documentStatus: "VERIFIED", applicationStatus: value.applicationStatus, updatedAt: new Date() }).where(eq(students.id, matches[0].id));
        }
        if (app.leadId) await tx.update(leads).set({ status: "ADMITTED", updatedAt: new Date() }).where(eq(leads.id, app.leadId));
      }
      const [updated] = await tx.update(applications).set({ ...value, dueDate: value.dueDate === "" ? null : value.dueDate,
        status: approving ? "approved" : ["REJECTED", "CANCELLED"].includes(value.applicationStatus) ? "rejected" : "pending", updatedAt: new Date(),
      }).where(eq(applications.id, app.id)).returning();
      await tx.insert(applicationStatusHistory).values({ applicationId: app.id, oldStatus: app.applicationStatus || app.status, newStatus: value.applicationStatus, changedBy: admin.id, notes: value.remarks || value.nextAction || "Review updated" });
      return { applicationId: updated.applicationId };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, ...result });
  } catch { return NextResponse.json({ error: "Failed to update application." }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Applications are retained. Use Cancelled status instead." }, { status: 405 });
}
export const dynamic = "force-dynamic";
