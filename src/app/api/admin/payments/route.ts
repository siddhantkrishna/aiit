import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, students, accountingTransactions } from "@/db/schema";
import { desc, eq, ilike, or, and, sql, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { paymentSchema, id } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";
import { adjustBalance, paise } from "@/lib/payment-balance";
import { z } from "zod";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const query = req.nextUrl.searchParams;
    const conditions = [];
    const search = query.get("search")?.trim();
    if (search) conditions.push(or(ilike(payments.receiptId, `%${search}%`), ilike(payments.referenceNumber, `%${search}%`)));
    if (query.get("status") && query.get("status") !== "ALL") conditions.push(eq(payments.paymentStatus, query.get("status")!));
    if (query.get("studentId")) conditions.push(eq(payments.studentId, Number(query.get("studentId"))));
    const rows = await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.paymentDate));
    return NextResponse.json(rows.map(({ proofPath, ...row }) => ({ ...row, hasProof: !!proofPath })));
  } catch { return NextResponse.json({ error: "Unable to load payments." }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = paymentSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const value = parsed.data;
    const referenceError = await invalidReference(value);
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    if (value.applicationId && value.studentId) {
      const [student] = await db.select({ applicationId: students.applicationId }).from(students).where(eq(students.id, value.studentId));
      if (student?.applicationId !== value.applicationId) return NextResponse.json({ error: "Application and student do not match." }, { status: 400 });
    }
    if (!value.studentId && value.applicationId) {
      const matches = await db.select({ id: students.id }).from(students).where(eq(students.applicationId, value.applicationId));
      if (matches.length > 1) return NextResponse.json({ error: "Duplicate students require review." }, { status: 409 });
      value.studentId = matches[0]?.id || null;
    }
    const [payment] = await db.insert(payments).values({ ...value, receiptId: `RCT-${randomUUID()}`, receivedBy: admin.id, paymentStatus: "PENDING" }).returning();
    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to record payment." }, { status: 400 }); }
}

export async function PUT(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = z.object({ id, paymentStatus: z.enum(["VERIFIED", "REJECTED", "REFUNDED"]) }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid payment and verification status." }, { status: 400 });
    const { id: paymentId, paymentStatus } = parsed.data;
    const result = await db.transaction(async tx => {
      const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId)).for("update");
      if (!payment) return { error: "Payment not found.", status: 404 };
      if (payment.paymentStatus === paymentStatus) return { success: true };
      if (payment.paymentStatus === "REFUNDED") return { error: "A refunded payment cannot be re-verified. Record a new payment.", status: 409 };
      if (paymentStatus === "REFUNDED" && payment.paymentStatus !== "VERIFIED") return { error: "Only verified payments can be refunded.", status: 400 };
      if (paymentStatus === "VERIFIED" && payment.paymentMode !== "CASH") {
        const reference = payment.referenceNumber?.trim();
        if (!reference) return { error: "A bank/UPI reference is required before verification.", status: 400 };
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`payment-ref:${reference.toLowerCase()}`}, 0))`);
        const [duplicate] = await tx.select({ id: payments.id }).from(payments).where(and(ne(payments.id, paymentId), eq(payments.paymentStatus, "VERIFIED"), sql`lower(trim(reference_number)) = ${reference.toLowerCase()}`));
        if (duplicate) return { error: "This transaction reference is already verified on another payment.", status: 409 };
      }
      const delta = (paymentStatus === "VERIFIED" ? 1 : 0) - (payment.paymentStatus === "VERIFIED" ? 1 : 0);
      if (payment.studentId && delta) await adjustBalance(tx, payment.studentId, delta * paise(payment.amount));
      const ledger = await tx.select().from(accountingTransactions).where(eq(accountingTransactions.relatedPaymentId, paymentId));
      if (ledger.length > 1) throw new Error("Duplicate accounting entries require reconciliation");
      if (paymentStatus === "VERIFIED") {
        const values = { transactionDate: payment.paymentDate, centreId: payment.centreId, transactionType: "INCOME", category: payment.paymentType || "STUDENT_PAYMENT", amount: payment.amount,
          paymentMode: payment.paymentMode, referenceNumber: payment.referenceNumber, relatedStudentId: payment.studentId, relatedPaymentId: paymentId, recordedBy: admin.id, status: "POSTED", updatedAt: new Date() };
        if (ledger[0]) await tx.update(accountingTransactions).set(values).where(eq(accountingTransactions.id, ledger[0].id));
        else await tx.insert(accountingTransactions).values({ ...values, transactionCode: `PAY-${payment.receiptId}` });
      } else if (ledger[0]) await tx.update(accountingTransactions).set({ status: "VOID", updatedAt: new Date(), notes: `Payment ${paymentStatus.toLowerCase()} by admin #${admin.id}` }).where(eq(accountingTransactions.id, ledger[0].id));
      await tx.update(payments).set({ paymentStatus, verifiedBy: admin.id, verifiedAt: new Date(), notes: `${payment.notes || ""}\n${new Date().toISOString()} - ${payment.paymentStatus} -> ${paymentStatus} by admin #${admin.id}`.trim(), receiptNumber: payment.receiptNumber || payment.receiptId }).where(eq(payments.id, paymentId));
      return { success: true };
    });
    return NextResponse.json(result, { status: "status" in result ? result.status : 200 });
  } catch { return NextResponse.json({ error: "Unable to verify payment. Check balances and duplicate accounting entries." }, { status: 409 }); }
}
export const dynamic = "force-dynamic";
