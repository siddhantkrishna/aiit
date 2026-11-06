import { randomUUID } from "node:crypto";
import { and, desc, eq, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, courses, students, payments, feeConfigurations, feePlans, feeObligations, feeOrders, feeTransactions, feeReceipts, feeOfflineCredits, feeAudit, feeWebhooks } from "@/db/schema";
import { FeeError, fullFee, indiaDate, mayAccess, netPaid, obligationState, signatureValid } from "./rules";
import { FeeIdentity } from "./auth";
import { gateway } from "./provider";
import { feeForUniversity } from "./scope";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Store = typeof db | Tx;
export type Target = { studentId?: number; applicationId?: number };

export async function owner(store: Store, who: FeeIdentity, target: Target = {}) {
  const studentId = who.adminId ? target.studentId : who.studentId;
  const applicationId = who.adminId ? target.applicationId : who.applicationId;
  const [student] = studentId ? await store.select().from(students).where(eq(students.id, studentId)) : [];
  if (studentId && !student) throw new FeeError("Student not found.", 404);
  const [application] = applicationId
    ? await store.select().from(applications).where(eq(applications.id, applicationId))
    : student?.applicationId ? await store.select().from(applications).where(eq(applications.applicationId, student.applicationId)) : [];
  if (applicationId && !application) throw new FeeError("Application not found.", 404);
  const enrolled = student || (application ? (await store.select().from(students).where(eq(students.applicationId, application.applicationId)).limit(2)) : []);
  if (Array.isArray(enrolled) && enrolled.length > 1) throw new FeeError("Duplicate enrollment links require administrator review.", 409);
  const linkedStudent = Array.isArray(enrolled) ? enrolled[0] : enrolled;
  if (!application && !linkedStudent) throw new FeeError("Select a student or application.");
  if (application && linkedStudent && (application.mobile.replace(/\D/g, "") !== linkedStudent.mobile?.replace(/\D/g, "") || application.dob !== linkedStudent.dob)) throw new FeeError("Enrollment identity does not match the application. Ask an administrator to correct the link.", 409);
  const courseId = application?.courseId || linkedStudent?.courseId;
  const [course] = courseId ? await store.select().from(courses).where(eq(courses.id, courseId)) : [];
  const legacy = await store.select({ id: payments.id }).from(payments).where(or(
    linkedStudent ? eq(payments.studentId, linkedStudent.id) : undefined,
    application ? eq(payments.applicationId, application.id) : undefined,
  ));
  return {
    applicationId: application?.id ?? null, studentId: linkedStudent?.id ?? null,
    applicationRef: application?.applicationId || "", studentRef: linkedStudent?.studentId || "",
    name: `${application?.firstName || linkedStudent?.firstName || ""} ${application?.lastName || linkedStudent?.lastName || ""}`.trim(),
    courseId, course: course?.name || linkedStudent?.programName || "Course not assigned",
    universityId: application?.universityId ?? linkedStudent?.universityId ?? course?.universityId ?? null,
    historicalPaid: Math.round(Number(linkedStudent?.amountPaid || 0) * 100),
    needsReview: !!(legacy.length || Number(linkedStudent?.amountPaid) > 0 || application?.paymentScreenshotPath),
    mobile: linkedStudent?.mobile || application?.mobile || "", email: linkedStudent?.email || application?.email || "",
  };
}
export async function findPlan(store: Store, person: Awaited<ReturnType<typeof owner>>) {
  const plans = await store.select().from(feePlans).where(or(
    person.applicationId ? eq(feePlans.applicationId, person.applicationId) : undefined,
    person.studentId ? eq(feePlans.studentId, person.studentId) : undefined,
  ));
  if (plans.length > 1) throw new FeeError("Conflicting fee plans require accounts review.", 409);
  return plans[0] || null;
}
export async function planSummary(store: Store, plan: typeof feePlans.$inferSelect) {
  const obligations = await store.select().from(feeObligations).where(eq(feeObligations.planId, plan.id)).orderBy(feeObligations.semester);
  const orders = await store.select({ order: feeOrders }).from(feeOrders).innerJoin(feeObligations, eq(feeObligations.id, feeOrders.obligationId)).where(eq(feeObligations.planId, plan.id));
  const history = await store.select({ transaction: feeTransactions, receiptId: feeReceipts.id, obligationId: feeOrders.obligationId, razorpayOrderId: feeOrders.razorpayOrderId })
    .from(feeTransactions).innerJoin(feeOrders, eq(feeOrders.id, feeTransactions.orderId))
    .innerJoin(feeObligations, eq(feeObligations.id, feeOrders.obligationId)).leftJoin(feeReceipts, eq(feeReceipts.transactionId, feeTransactions.id))
    .where(eq(feeObligations.planId, plan.id)).orderBy(desc(feeTransactions.createdAt));
  const offline = await store.select({ credit: feeOfflineCredits }).from(feeOfflineCredits).innerJoin(feeObligations, eq(feeObligations.id, feeOfflineCredits.obligationId)).where(eq(feeObligations.planId, plan.id));
  const schedule = obligations.map(item => {
    const paid = netPaid(history.filter(h => h.obligationId === item.id).map(h => h.transaction)) + offline.filter(h => h.credit.obligationId === item.id).reduce((s, h) => s + h.credit.amount, 0);
    const order = orders.find(o => o.order.obligationId === item.id && o.order.status !== "paid")?.order;
    const status = obligationState(item.amount, paid, item.dueDate);
    return { ...item, paid, outstanding: Math.max(0, item.amount - paid), status,
      payable: (status === "Due" || status === "Overdue") && (!order || ["created", "attempted"].includes(order.status)) && !history.some(h => h.obligationId === item.id && h.transaction.status === "authorized") };
  });
  const payable = obligations.reduce((s, x) => s + x.amount, 0);
  const collected = schedule.reduce((s, x) => s + x.paid, 0);
  const captured = history.some(h => !!h.transaction.capturedAt) || offline.length > 0;
  return { ...plan, payable, collected, outstanding: Math.max(0, payable - collected), status: collected >= payable ? "PAID IN FULL" : collected > 0 ? "PARTIALLY PAID" : "PAYMENT PENDING", locked: orders.length > 0 || captured, schedule,
    history: history.map(h => ({ ...h.transaction, receiptId: h.receiptId, obligationId: h.obligationId, razorpayOrderId: h.razorpayOrderId })), offline: offline.map(h => h.credit) };
}
export async function portal(who: FeeIdentity, target: Target = {}) {
  return db.transaction(async tx => {
    const person = await owner(tx, who, target);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`fees:${person.applicationId ? `a${person.applicationId}` : `s${person.studentId}`}`}))`);
    let plan = await findPlan(tx, person);
    if (plan && person.studentId && !plan.studentId) [plan] = await tx.update(feePlans).set({ studentId: person.studentId }).where(eq(feePlans.id, plan.id)).returning();
    const configurations = person.courseId ? await tx.select().from(feeConfigurations).where(and(eq(feeConfigurations.courseId, person.courseId), lte(feeConfigurations.effectiveFrom, indiaDate()))).orderBy(desc(feeConfigurations.effectiveFrom), desc(feeConfigurations.id)) : [];
    const config = feeForUniversity(configurations, person.universityId);
    return { person, configuration: config || null, full: config ? fullFee(config.originalAmount) : null, plan: plan ? await planSummary(tx, plan) : null,
      checkoutConfigured: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET,
      testMode: !process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") };
  });
}
export async function selectPlan(who: FeeIdentity, kind: unknown, target: Target = {}) {
  if (kind !== "full" && kind !== "semester") throw new FeeError("Choose full or semester-wise payment.");
  return db.transaction(async tx => {
    const person = await owner(tx, who, target);
    if (!person.courseId) throw new FeeError("An administrator must assign a course first.", 409);
    if (!person.universityId) throw new FeeError("Select a university for this enrollment before choosing a payment plan.", 409);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`fees:${person.applicationId ? `a${person.applicationId}` : `s${person.studentId}`}`}))`);
    let plan = await findPlan(tx, person);
    if (plan && plan.kind === kind) return plan;
    if (plan && (await planSummary(tx, plan)).locked) throw new FeeError("A checkout order or payment already exists. Accounts must review any plan change.", 409);
    if (kind === "full" && person.needsReview) throw new FeeError("Historical payment activity requires a semester plan and an audited accounts review. Upfront discount is unavailable.", 409);
    const configurations = await tx.select().from(feeConfigurations).where(and(eq(feeConfigurations.courseId, person.courseId), lte(feeConfigurations.effectiveFrom, indiaDate()))).orderBy(desc(feeConfigurations.effectiveFrom), desc(feeConfigurations.id));
    const config = feeForUniversity(configurations, person.universityId);
    if (!config) throw new FeeError("Accounts must configure the fee and semester schedule for this university and course before checkout.", 409);
    const discount = kind === "full" ? fullFee(config.originalAmount).discount : 0;
    if (plan) {
      await tx.delete(feeObligations).where(eq(feeObligations.planId, plan.id));
      [plan] = await tx.update(feePlans).set({ kind, configurationId: config.id, originalAmount: config.originalAmount, discount }).where(eq(feePlans.id, plan.id)).returning();
    } else {
      [plan] = await tx.insert(feePlans).values({ applicationId: person.applicationId, studentId: person.studentId, courseId: person.courseId, configurationId: config.id, kind, originalAmount: config.originalAmount, discount }).returning();
    }
    const schedule = kind === "full" ? [{ semester: 0, amount: config.originalAmount - discount, dueDate: indiaDate() }] : config.schedule;
    await tx.insert(feeObligations).values(schedule.map(o => ({ ...o, planId: plan!.id })));
    return plan;
  });
}
export async function ownedPlan(tx: Store, who: FeeIdentity, obligationId: number) {
  const [row] = await tx.select({ obligation: feeObligations, plan: feePlans }).from(feeObligations).innerJoin(feePlans, eq(feePlans.id, feeObligations.planId)).where(eq(feeObligations.id, obligationId));
  if (!row) throw new FeeError("Payment obligation not found.", 404);
  // Resolve enrollment before comparing: newly enrolled students inherit applicant payments.
  const person = await owner(tx, who, { studentId: row.plan.studentId || undefined, applicationId: row.plan.applicationId || undefined });
  if (!mayAccess(row.plan, who) && !(who.studentId && person.applicationId !== null && person.applicationId === row.plan.applicationId)) throw new FeeError("Payment access denied.", 403);
  if (who.studentId && person.studentId !== who.studentId) throw new FeeError("Payment access denied.", 403);
  return { ...row, person };
}
export async function createOrder(who: FeeIdentity, obligationId: number) {
  const api = gateway();
  // Persist the reservation BEFORE contacting Razorpay. An uncertain request is never replaced with another order.
  const reserved = await db.transaction(async tx => {
    const row = await ownedPlan(tx, who, obligationId);
    await tx.select().from(feePlans).where(eq(feePlans.id, row.plan.id)).for("update");
    const summary = await planSummary(tx, row.plan);
    const item = summary.schedule.find(x => x.id === obligationId)!;
    if (row.person.needsReview && !row.plan.legacyReviewed) throw new FeeError("Accounts must review and migrate historical payments before checkout.", 409);
    if (!item.outstanding) throw new FeeError("This fee is already paid.", 409);
    if (!["Due", "Overdue"].includes(item.status)) throw new FeeError("This semester is not due yet.", 409);
    if (summary.schedule.some(o => o.semester < item.semester && o.outstanding > 0)) throw new FeeError("Pay the earlier due semester first.", 409);
    const [existing] = await tx.select().from(feeOrders).where(and(eq(feeOrders.obligationId, obligationId), ne(feeOrders.status, "paid")));
    if (existing) {
      if (existing.keyId !== process.env.RAZORPAY_KEY_ID) throw new FeeError("Checkout key changed. Accounts must reconcile the existing order.", 409);
      return { order: existing, fresh: false };
    }
    const [order] = await tx.insert(feeOrders).values({ id: randomUUID(), obligationId, keyId: process.env.RAZORPAY_KEY_ID!, amount: item.outstanding }).returning();
    return { order, fresh: true };
  });
  let order = reserved.order;
  if (reserved.fresh) {
    try {
      const remote = await api.orders.create({ amount: order.amount, currency: "INR", receipt: order.id, partial_payment: false });
      if (Number(remote.amount) !== order.amount || remote.currency !== "INR") throw new FeeError("Gateway order amount mismatch.", 502);
      [order] = await db.update(feeOrders).set({ razorpayOrderId: remote.id, status: remote.status }).where(eq(feeOrders.id, order.id)).returning();
    } catch (error) {
      await db.update(feeOrders).set({ status: "uncertain" }).where(eq(feeOrders.id, order.id));
      throw error;
    }
  } else if (!order.razorpayOrderId) {
    throw new FeeError("Order confirmation is pending. Ask accounts to reconcile this order before retrying.", 409);
  } else {
    await reconcileOrder(order.id);
    const summary = await db.transaction(async tx => {
      const row = await ownedPlan(tx, who, obligationId);
      return planSummary(tx, row.plan);
    });
    const [updatedOrder] = await db.select().from(feeOrders).where(eq(feeOrders.id, order.id));
    if (updatedOrder.status === "paid") throw new FeeError("This checkout has completed. Refresh fees to see the current balance before starting another payment.", 409);
    if (!summary.schedule.find(x => x.id === obligationId)?.payable) throw new FeeError("Checkout is already paid or awaiting accounts review. Refresh your payment history.", 409);
  }
  return { id: order.id, orderId: order.razorpayOrderId, keyId: order.keyId, amount: order.amount, currency: "INR" };
}

export async function reconcileOrder(internalId: string) {
  const api = gateway();
  return db.transaction(async tx => {
    const [order] = await tx.select().from(feeOrders).where(eq(feeOrders.id, internalId)).for("update");
    if (!order) throw new FeeError("Order not found.", 404);
    if (order.keyId !== process.env.RAZORPAY_KEY_ID) throw new FeeError("Reconcile using the original gateway account and mode.", 409);
    let remoteId = order.razorpayOrderId;
    if (!remoteId) {
      // Receipt is unique. Recover an order whose creation response was lost, without creating another.
      const result = await api.orders.all({ receipt: order.id, count: 100 });
      const matches = result.items.filter(o => o.receipt === order.id);
      if (matches.length !== 1) throw new FeeError("The gateway order is not confirmed. Keep this reservation and contact Razorpay support; do not create a replacement.", 409);
      remoteId = matches[0].id;
    }
    const remote = await api.orders.fetch(remoteId);
    if (remote.receipt !== order.id || Number(remote.amount) !== order.amount || remote.currency !== "INR" || remote.partial_payment) throw new FeeError("Provider order does not match the fee obligation.", 409);
    const paymentList = await api.orders.fetchPayments(remoteId);
    // Serialize all ledger credits and adjustments on the plan.
    const [obligation] = await tx.select().from(feeObligations).where(eq(feeObligations.id, order.obligationId));
    const [plan] = await tx.select().from(feePlans).where(eq(feePlans.id, obligation.planId)).for("update");
    for (const payment of paymentList.items) {
      if (payment.order_id !== remoteId || payment.currency !== "INR" || Number(payment.amount) !== order.amount) throw new FeeError("Provider payment does not match the fee obligation.", 409);
      const [prior] = await tx.select().from(feeTransactions).where(eq(feeTransactions.razorpayPaymentId, payment.id));
      const captured = payment.status === "captured" || payment.status === "refunded";
      if (prior?.capturedAt && !captured) continue;
      let refunded = prior?.refunded || 0;
      let refundStatus = prior?.refundStatus || [];
      if (captured) {
        const refunds = [];
        for (let skip = 0; ; skip += 100) {
          const page = await api.payments.fetchMultipleRefund(payment.id, { count: 100, skip });
          refunds.push(...page.items);
          if (page.items.length < 100) break;
        }
        refundStatus = refunds.map(r => ({ id: r.id, status: r.status, amount: Number(r.amount) }));
        refunded = Math.max(refunded, refunds.filter(r => r.status === "processed").reduce((s, r) => s + Number(r.amount), 0));
      }
      if (refunded > order.amount) throw new FeeError("Refund amount exceeds the captured payment.", 409);
      if (captured && !prior?.capturedAt) {
        const summary = await planSummary(tx, plan);
        const outstanding = summary.schedule.find(o => o.id === obligation.id)!.outstanding;
        if (order.amount > outstanding) throw new FeeError("Capture exceeds the outstanding fee. Accounts must investigate before crediting.", 409);
      }
      const capturedAt = prior?.capturedAt || (captured ? new Date() : null);
      const values = { orderId: order.id, razorpayPaymentId: payment.id, amount: order.amount, refunded,
        gatewayFee: payment.fee == null ? null : Number(payment.fee), gatewayTax: payment.tax == null ? null : Number(payment.tax), currency: "INR",
        status: captured ? (refunded === order.amount ? "refunded" : "captured") : payment.status,
        method: payment.method || null, failureCode: payment.error_code || null, refundStatus, capturedAt, updatedAt: new Date() };
      const [transaction] = await tx.insert(feeTransactions).values(values).onConflictDoUpdate({ target: feeTransactions.razorpayPaymentId, set: values }).returning();
      if (capturedAt) {
        const person = await owner(tx, { adminId: 1 }, { applicationId: plan.applicationId || undefined, studentId: plan.studentId || undefined });
        const summary = await planSummary(tx, plan);
        await tx.insert(feeReceipts).values({ id: `AIIT-${capturedAt.getFullYear()}-${String(transaction.id).padStart(8, "0")}`, transactionId: transaction.id,
          snapshot: { name: person.name, studentId: person.studentRef, applicationId: person.applicationRef, course: person.course, date: capturedAt.toISOString(), original: plan.originalAmount, discount: plan.discount,
            amount: order.amount, plan: plan.kind, semester: obligation.semester, method: payment.method || "", paymentId: payment.id, remaining: summary.outstanding } }).onConflictDoNothing();
      }
    }
    await tx.update(feeOrders).set({ razorpayOrderId: remoteId, status: remote.status, reconciledAt: new Date() }).where(eq(feeOrders.id, order.id));
    return { success: true };
  });
}
export async function verifyCheckout(who: FeeIdentity, input: { id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown }) {
  if (typeof input.id !== "string" || typeof input.razorpay_payment_id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(input.razorpay_payment_id)) throw new FeeError("Invalid payment response.");
  const [order] = await db.select().from(feeOrders).where(eq(feeOrders.id, input.id));
  if (!order?.razorpayOrderId) throw new FeeError("Order not found.", 404);
  await ownedPlan(db, who, order.obligationId);
  if (!signatureValid(`${order.razorpayOrderId}|${input.razorpay_payment_id}`, typeof input.razorpay_signature === "string" ? input.razorpay_signature : null, process.env.RAZORPAY_KEY_SECRET)) throw new FeeError("Invalid payment signature.", 400);
  const payment = await gateway().payments.fetch(input.razorpay_payment_id);
  if (payment.order_id !== order.razorpayOrderId) throw new FeeError("Payment belongs to a different order.", 403);
  await reconcileOrder(order.id);
  const [record] = await db.select({ capturedAt: feeTransactions.capturedAt }).from(feeTransactions).where(eq(feeTransactions.razorpayPaymentId, payment.id));
  return { success: !!record?.capturedAt, pending: !record?.capturedAt };
}
export async function orderDetails(who: FeeIdentity, orderId: string) {
  const [order] = await db.select().from(feeOrders).where(eq(feeOrders.id, orderId));
  if (!order) throw new FeeError("Order not found.", 404);
  const row = await ownedPlan(db, who, order.obligationId);
  const summary = await planSummary(db, row.plan);
  const webhooks = who.adminId ? await db.select().from(feeWebhooks).where(eq(feeWebhooks.orderId, orderId)).orderBy(desc(feeWebhooks.createdAt)) : [];
  const audit = who.adminId ? await db.select().from(feeAudit).where(eq(feeAudit.planId, row.plan.id)).orderBy(desc(feeAudit.createdAt)) : [];
  return { order, person: row.person, plan: summary, webhooks, audit };
}
