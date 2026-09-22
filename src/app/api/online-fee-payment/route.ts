import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, students } from "@/db/schema";
import { getStudentFromRequest } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  try {
    const sessionId = getStudentFromRequest(req);
    if (!sessionId) return NextResponse.json({ error: "Student login required." }, { status: 401 });

    const [student] = await db.select({
      id: students.id, studentId: students.studentId, firstName: students.firstName, lastName: students.lastName,
      programName: students.programName, amountPending: students.amountPending, totalFee: students.totalFee, amountPaid: students.amountPaid,
    }).from(students).where(eq(students.id, Number(sessionId)));
    if (!student) return NextResponse.json({ error: "Student account not found." }, { status: 404 });

    const history = await db.select({
      receiptId: payments.receiptId, paymentDate: payments.paymentDate, amount: payments.amount,
      paymentMode: payments.paymentMode, referenceNumber: payments.referenceNumber, paymentStatus: payments.paymentStatus,
    }).from(payments).where(eq(payments.studentId, student.id)).orderBy(desc(payments.createdAt)).limit(10);

    return NextResponse.json({
      student,
      history,
      upiId: process.env.NEXT_PUBLIC_AIIT_UPI_ID || process.env.AIIT_UPI_ID || null,
      payeeName: process.env.AIIT_PAYMENT_NAME || "AIIT College",
    });
  } catch (error) {
    console.error("Failed to load fee payment portal:", error);
    return NextResponse.json({ error: "Unable to load fee payment portal." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = getStudentFromRequest(req);
    if (!sessionId) return NextResponse.json({ error: "Student login required." }, { status: 401 });

    const body = await req.json();
    const amount = Number(body.amount);
    const referenceNumber = String(body.referenceNumber || "").trim().slice(0, 255);

    const [student] = await db.select({ id: students.id, amountPending: students.amountPending }).from(students).where(eq(students.id, Number(sessionId)));
    if (!student) return NextResponse.json({ error: "Student account not found." }, { status: 404 });

    const pending = Number(student.amountPending || 0);
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    if (amount > pending && pending > 0) return NextResponse.json({ error: `Payment cannot exceed the current pending fee of ₹${pending.toLocaleString("en-IN")}.` }, { status: 400 });
    if (!referenceNumber) return NextResponse.json({ error: "Enter the UPI transaction/reference number after payment." }, { status: 400 });

    const receiptId = `FEE-${Date.now().toString().slice(-10)}`;
    const [payment] = await db.insert(payments).values({
      receiptId, studentId: student.id, paymentDate: new Date().toISOString().slice(0, 10), amount: String(amount),
      paymentType: "STUDENT_FEE", paymentMode: "UPI", referenceNumber, paymentStatus: "PENDING", notes: "Online fee payment submitted by student.",
    }).returning();

    return NextResponse.json({ success: true, receiptId: payment.receiptId, message: "Payment record submitted for verification." }, { status: 201 });
  } catch (error) {
    console.error("Failed to create online fee payment:", error);
    return NextResponse.json({ error: "Unable to submit payment right now." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
