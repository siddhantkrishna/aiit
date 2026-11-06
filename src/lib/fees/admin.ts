import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, courses, students, universities, feeConfigurations, feePlans, feeObligations, feeOrders, feeOfflineCredits, feeAudit, feeAccess } from "@/db/schema";
import { FeeError, indiaDate, paise, validDate, validateSchedule, recoveryHash } from "./rules";
import { owner, findPlan, planSummary } from "./service";

export async function configurationOptions() {
  const [courseRows, universityRows, configurations] = await Promise.all([
    db.select({ id: courses.id, name: courses.name, fee: courses.aiitFee, semesters: courses.semesters, universityId: courses.universityId, enabled: courses.enabled }).from(courses),
    db.select({ id: universities.id, name: universities.name, enabled: universities.enabled }).from(universities),
    db.select().from(feeConfigurations).orderBy(desc(feeConfigurations.id)),
  ]);
  return { courses: courseRows, universities: universityRows, configurations };
}
export async function configure(adminId: number, body: Record<string, unknown>) {
  const courseId = Number(body.courseId);
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
  if (!course?.enabled) throw new FeeError("Select an active course.");
  const universityId = Number(body.universityId);
  if (!Number.isSafeInteger(universityId) || universityId < 1) throw new FeeError("Select a specific university before entering the fee.");
  const [university] = await db.select({ id: universities.id, enabled: universities.enabled }).from(universities).where(eq(universities.id, universityId));
  if (!university?.enabled) throw new FeeError("Select an active university.");
  if (course.universityId && course.universityId !== universityId) throw new FeeError("This course belongs to a different university. Choose its associated university.");
  const originalAmount = paise(body.originalFee);
  const semesters = Number(body.semesters);
  if (!Array.isArray(body.schedule)) throw new FeeError("Configure the semester schedule.");
  const schedule = body.schedule.map((o, i) => ({ semester: i + 1, amount: paise(o.amount) }));
  validateSchedule(originalAmount, semesters, schedule);
  const reason = String(body.reason || "").trim();
  if (reason.length < 10) throw new FeeError("Provide an approval reason of at least 10 characters.");
  // Immutable versions: existing plans retain their contracted fee and payment amounts.
  const [configuration] = await db.insert(feeConfigurations).values({ courseId, universityId, originalAmount, semesters, schedule, effectiveFrom: indiaDate(), reason, createdBy: adminId }).returning();
  return configuration;
}
export async function adminAction(adminId: number, body: Record<string, unknown>) {
  const reason = String(body.reason || "").trim();
  if (reason.length < 10) throw new FeeError("An audit reason of at least 10 characters is required.");
  return db.transaction(async tx => {
    const planId = Number(body.planId);
    const [plan] = await tx.select().from(feePlans).where(eq(feePlans.id, planId)).for("update");
    if (!plan) throw new FeeError("Fee plan not found.", 404);
    const summary = await planSummary(tx, plan);
    const person = await owner(tx, { adminId }, { applicationId: plan.applicationId || undefined, studentId: plan.studentId || undefined });
    if (body.action === "review_legacy") {
      const imported = summary.offline.filter(o => o.legacy).reduce((s, o) => s + o.amount, 0);
      if (imported < person.historicalPaid) throw new FeeError("Import the historical paid balance as audited offline credits before completing review.");
      await tx.update(feePlans).set({ legacyReviewed: true }).where(eq(feePlans.id, plan.id));
    } else if (body.action === "offline" || body.action === "adjust") {
      const item = summary.schedule.find(o => o.id === Number(body.obligationId));
      if (!item) throw new FeeError("Select a fee obligation.");
      const orders = await tx.select({ id: feeOrders.id }).from(feeOrders).where(eq(feeOrders.obligationId, item.id));
      if (orders.length) throw new FeeError("An order already exists for this obligation. Reconcile it; its amount cannot be changed or credited offline.", 409);
      const amount = paise(body.amount);
      if (body.action === "offline") {
        if (amount > item.outstanding) throw new FeeError("Offline credit exceeds the outstanding fee.");
        const reference = String(body.reference || "").trim();
        if (reference.length < 5 || reference.startsWith("pay_") || reference.startsWith("order_")) throw new FeeError("Use a unique bank/cash voucher or historical record reference, not a Razorpay ID.");
        if (!validDate(body.receivedAt) || body.receivedAt > indiaDate()) throw new FeeError("Provide the actual receipt date (not in the future).");
        if (plan.kind === "full") throw new FeeError("Offline collections use a semester plan; the upfront gateway discount does not apply.");
        await tx.insert(feeOfflineCredits).values({ obligationId: item.id, amount, reference, reason, adminId, receivedAt: body.receivedAt, legacy: body.legacy === true });
      } else {
        if (amount < item.paid || item.paid > 0) throw new FeeError("Adjust only an unpaid obligation; preserve recorded credits.");
        if (plan.kind === "full") throw new FeeError("The full-payment discount contract cannot be adjusted. Accounts must resolve it separately.");
        await tx.update(feeObligations).set({ amount }).where(eq(feeObligations.id, item.id));
      }
    } else throw new FeeError("Unknown accounts action.");
    await tx.insert(feeAudit).values({ planId, adminId, action: String(body.action), reason,
      details: { before: { payable: summary.payable, collected: summary.collected, schedule: summary.schedule }, obligationId: body.obligationId, amount: body.amount, reference: body.reference, receivedAt: body.receivedAt, legacy: body.legacy } });
    return { success: true };
  });
}
export async function linkEnrollment(adminId: number, studentId: number, applicationRef: string, reason: string) {
  if (reason.trim().length < 10) throw new FeeError("Explain the enrollment link for the audit log.");
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`enrollment:${applicationRef}`}))`);
    const [student] = await tx.select().from(students).where(eq(students.id, studentId)).for("update");
    const [application] = await tx.select().from(applications).where(eq(applications.applicationId, applicationRef));
    if (!student || !application) throw new FeeError("Student or application not found.", 404);
    if (student.applicationId && student.applicationId !== applicationRef) throw new FeeError("This student already has an application link.", 409);
    const duplicates = await tx.select({ id: students.id }).from(students).where(and(eq(students.applicationId, applicationRef), sql`${students.id} <> ${studentId}`));
    if (duplicates.length || student.mobile?.replace(/\D/g, "") !== application.mobile.replace(/\D/g, "") || student.dob !== application.dob) throw new FeeError("Enrollment must have a unique application with matching mobile and date of birth.", 409);
    const existing = await findPlan(tx, { applicationId: application.id, studentId } as Awaited<ReturnType<typeof owner>>);
    if (existing?.studentId && existing.studentId !== studentId) throw new FeeError("Application fees are already linked to another student.", 409);
    await tx.update(students).set({ applicationId: applicationRef, courseId: application.courseId, universityId: application.universityId, updatedAt: new Date() }).where(eq(students.id, studentId));
    if (existing) await tx.update(feePlans).set({ studentId }).where(eq(feePlans.id, existing.id));
    await tx.insert(feeAudit).values({ adminId, planId: existing?.id || null, action: "link_enrollment", reason, details: { studentId, applicationId: application.id } });
    return { success: true };
  });
}

export async function resetApplicantAccess(adminId: number, applicationId: number, reason: string) {
  if (reason.trim().length < 10) throw new FeeError("Record how the applicant’s identity was verified.");
  const [application] = await db.select({ id: applications.id }).from(applications).where(eq(applications.id, applicationId));
  if (!application) throw new FeeError("Application not found.", 404);
  const recoveryCode = randomBytes(32).toString("hex");
  await db.transaction(async tx => {
    await tx.insert(feeAccess).values({ applicationId, recoveryHash: recoveryHash(recoveryCode) }).onConflictDoUpdate({ target: feeAccess.applicationId, set: { recoveryHash: recoveryHash(recoveryCode) } });
    await tx.insert(feeAudit).values({ adminId, action: "reset_applicant_access", reason, details: { applicationId } });
  });
  return { recoveryCode };
}

export async function assignStudentCourse(adminId: number, studentId: number, courseId: number, universityId: number, reason: string) {
  if (reason.trim().length < 10) throw new FeeError("Record the enrollment evidence for this course assignment.");
  return db.transaction(async tx => {
    const [student] = await tx.select().from(students).where(eq(students.id,studentId)).for("update");
    const [course] = await tx.select().from(courses).where(eq(courses.id,courseId));
    if (!student || !course?.enabled) throw new FeeError("Student or active course not found.",404);
    if (!Number.isSafeInteger(universityId) || universityId < 1) throw new FeeError("Select the student's university.");
    const [university] = await tx.select({id:universities.id,enabled:universities.enabled}).from(universities).where(eq(universities.id,universityId));
    if (!university?.enabled || (course.universityId && course.universityId !== universityId)) throw new FeeError("This university cannot be assigned to the selected course.");
    const plan = await tx.select({id:feePlans.id}).from(feePlans).where(eq(feePlans.studentId,studentId));
    if (student.applicationId || student.courseId || plan.length) throw new FeeError("An enrollment or fee plan already exists; course reassignment requires admissions review.",409);
    await tx.update(students).set({courseId,universityId,programName:course.name,updatedAt:new Date()}).where(eq(students.id,studentId));
    await tx.insert(feeAudit).values({adminId,action:"assign_student_course",reason,details:{studentId,courseId,universityId}});
    return {success:true};
  });
}
