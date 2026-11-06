import { randomUUID } from "node:crypto";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, courses, feeAudit, feeOfflineCredits, feeOrders, feePlans, offlineReceipts, offlineReceiptNotifications, staff, students } from "@/db/schema";
import { owner, findPlan, planSummary } from "./service";
import { FeeError, indiaDate } from "./rules";
import { validateOfflineInput, mobile, validMobile, validEmail } from "./offline-rules";

type Target = { studentId?: number; applicationId?: number };
export async function searchReceivingPeople(search: string) {
  const query = search.trim();
  if (query.length < 2) return [];
  const term = `%${query.replace(/[%_]/g,"\\$&")}%`;
  const [s, a] = await Promise.all([
    db.select({ id: students.id, ref: students.studentId, firstName: students.firstName, lastName: students.lastName, applicationRef: students.applicationId, courseId: students.courseId, course: courses.name, mobile: students.mobile, email: students.email })
      .from(students).leftJoin(courses, eq(courses.id, students.courseId))
      .where(or(ilike(students.studentId, term), ilike(students.firstName, term), ilike(students.lastName, term), ilike(students.mobile, term), ilike(students.applicationId, term)))
      .orderBy(desc(students.createdAt)).limit(12),
    db.select({ id: applications.id, ref: applications.applicationId, firstName: applications.firstName, lastName: applications.lastName, courseId: applications.courseId, course: courses.name, mobile: applications.mobile, email: applications.email })
      .from(applications).leftJoin(courses, eq(courses.id, applications.courseId))
      .where(or(ilike(applications.applicationId, term), ilike(applications.firstName, term), ilike(applications.lastName, term), ilike(applications.mobile, term)))
      .orderBy(desc(applications.createdAt)).limit(12),
  ]);
  const linkedRefs = new Set(s.map(student => student.applicationRef).filter(Boolean));
  return [
    ...s.map(row => ({ ...row, type: "student" as const, name: [row.firstName,row.lastName].filter(Boolean).join(" ") })),
    ...a.filter(row => !linkedRefs.has(row.ref)).map(row => ({ ...row, type: "application" as const, name: [row.firstName,row.lastName].filter(Boolean).join(" ") })),
  ].slice(0,20);
}
export async function receivingOptions() {
  return db.select({id:staff.id,employeeId:staff.employeeId,name:staff.name,role:staff.role,department:staff.department,centreId:staff.centreId,mobile:staff.mobile,email:staff.email,status:staff.status}).from(staff).where(eq(staff.status,"ACTIVE")).orderBy(staff.name);
}
export async function recordOfflinePayment(adminId: number, body: Record<string,unknown>) {
  const input = validateOfflineInput(body);
  const target: Target = input.studentId ? { studentId:input.studentId } : { applicationId:input.applicationId };
  const receipt = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.requestKey}))`);
    const [duplicate] = await tx.select().from(offlineReceipts).where(eq(offlineReceipts.requestKey,input.requestKey));
    if (duplicate) return { receipt: duplicate, duplicate: true };
    const [receiver] = await tx.select().from(staff).where(eq(staff.id,input.receiverStaffId));
    if (!receiver || receiver.status !== "ACTIVE" || receiver.employeeId.startsWith("DEMO-")) throw new FeeError("Select a real active staff member. Demo staff cannot receive actual money.");
    const person = await owner(tx,{adminId},target);
    if (!person.name) throw new FeeError("A student or applicant name is required.",409);
    const [application] = person.applicationId ? await tx.select().from(applications).where(eq(applications.id,person.applicationId)) : [];
    const [student] = person.studentId ? await tx.select().from(students).where(eq(students.id,person.studentId)) : [];
    const [course] = person.courseId ? await tx.select().from(courses).where(eq(courses.id,person.courseId)) : [];
    if (input.purposeType === "TUITION" && !course) throw new FeeError("Tuition needs a valid assigned course.",409);
    if (receiver.centreId && (application?.centreId || student?.centreId) && receiver.centreId !== (application?.centreId || student?.centreId)) throw new FeeError("Receiving staff belongs to another centre.",403);
    let creditId: number | null = null;
    let feePlanId: number | null = null;
    if (input.purposeType === "TUITION") {
      const plan = await findPlan(tx,person);
      if (!plan) throw new FeeError("Select a semester fee plan first in the student/application profile.",409);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`offline-plan:${plan.id}`}))`);
      const [locked] = await tx.select().from(feePlans).where(eq(feePlans.id,plan.id)).for("update");
      if (!locked || locked.kind !== "semester") throw new FeeError("Offline tuition uses the regular semester plan; no upfront gateway discount applies.",409);
      const summary = await planSummary(tx,locked);
      const obligation = summary.schedule.find(item => item.id === input.obligationId);
      if (!obligation || input.amountPaise > obligation.outstanding || obligation.outstanding <= 0) throw new FeeError("Amount exceeds the outstanding selected semester fee.",409);
      const hasOrder = await tx.select({id:feeOrders.id}).from(feeOrders).where(eq(feeOrders.obligationId,obligation.id));
      if (hasOrder.length) throw new FeeError("A gateway order exists for this installment. Reconcile it before collecting offline.",409);
      const [credit] = await tx.insert(feeOfflineCredits).values({
        obligationId:obligation.id, amount:input.amountPaise, reference:`AIIT-OFF-${input.requestKey}`,
        reason:input.notes, adminId, receivedAt:indiaDate(), legacy:false
      }).returning({id:feeOfflineCredits.id});
      creditId=credit.id; feePlanId=plan.id;
    }
    const receiptNo = `AIIT-OFF-${indiaDate().replace(/-/g,"")}-${randomUUID().slice(0,12).toUpperCase()}`;
    const [created] = await tx.insert(offlineReceipts).values({
      receiptNo,requestKey:input.requestKey,applicationId:person.applicationId,studentId:person.studentId,
      courseId:person.courseId,centreId:application?.centreId || student?.centreId || receiver.centreId,
      feeCreditId:creditId,purposeType:input.purposeType,purposeName:input.purposeName,
      studentName:person.name,fatherName:application?.fatherName || null,motherName:application?.motherName || null,
      studentMobile:person.mobile || null,studentEmail:person.email || null,
      payerName:input.payerName,payerRelation:input.relation,payerMobile:input.payerMobile,payerEmail:input.payerEmail,
      receiverStaffId:receiver.id,receiverName:receiver.name,receiverRole:receiver.role,receiverDepartment:receiver.department,
      receiverMobile:receiver.mobile,receiverEmail:receiver.email,receiverFatherName:input.receiverFatherName,receiverMotherName:input.receiverMotherName,
      recordedByAdminId:adminId,amountPaise:input.amountPaise,paymentMethod:input.method,
      paymentReference:input.paymentReference,notes:input.notes,
    }).returning();
    const recipients = [
      { channel:"SMS",recipientType:"PAYER",destination:input.payerMobile },
      ...(input.payerEmail ? [{channel:"EMAIL",recipientType:"PAYER",destination:input.payerEmail}] : []),
      ...(person.mobile && validMobile(mobile(person.mobile)) ? [{channel:"SMS",recipientType:"STUDENT",destination:mobile(person.mobile)}] : []),
      ...(person.email && validEmail(person.email) ? [{channel:"EMAIL",recipientType:"STUDENT",destination:person.email.toLowerCase()}] : []),
    ];
    const dedupe = new Set<string>();
    for (const item of recipients) {
      const key=`${item.channel}:${item.destination}`;
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      await tx.insert(offlineReceiptNotifications).values({receiptId:created.id,...item});
    }
    await tx.insert(feeAudit).values({
      adminId,planId:feePlanId,action:"offline_receipt",reason:input.notes,
      details:{receiptNo,amountPaise:input.amountPaise,purposeType:input.purposeType,staffId:receiver.id,applicationId:person.applicationId,studentId:person.studentId,paymentMethod:input.method,staffIdentityVerification:"ADMIN_SESSION_ONLY_NO_BIOMETRIC"}
    });
    return {receipt:created,duplicate:false};
  });
  return receipt;
}
export async function offlineList(search = "") {
  const q=search.trim();
  const rows=await db.select().from(offlineReceipts)
    .where(q ? or(ilike(offlineReceipts.receiptNo,`%${q}%`),ilike(offlineReceipts.studentName,`%${q}%`),ilike(offlineReceipts.payerName,`%${q}%`)) : undefined)
    .orderBy(desc(offlineReceipts.receivedAt)).limit(100);
  const totals=await db.execute(sql`select coalesce(sum(amount_paise),0)::bigint as all_time,coalesce(sum(amount_paise) filter(where (received_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date),0)::bigint as today,count(*)::integer as records from offline_receipts`);
  return { rows, summary:totals.rows[0] };
}
