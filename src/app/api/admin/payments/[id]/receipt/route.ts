import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, students, applications, centres } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { id } from "@/lib/validation";
import { receiptPdf } from "@/lib/receipt-pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = id.safeParse((await params).id);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    const [record] = await db.select({ payment: payments, studentCode: students.studentId, applicationCode: applications.applicationId, centre: centres.name }).from(payments)
      .leftJoin(students, eq(payments.studentId, students.id)).leftJoin(applications, eq(payments.applicationId, applications.id)).leftJoin(centres, eq(payments.centreId, centres.id)).where(eq(payments.id, parsed.data));
    if (!record) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (record.payment.paymentStatus !== "VERIFIED") return NextResponse.json({ error: "Receipts are available only for verified payments." }, { status: 409 });
    const pdf = receiptPdf({ ...record.payment, studentCode: record.studentCode || record.applicationCode || "Legacy record", centre: record.centre });
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="AIIT-receipt-${record.payment.id}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to generate receipt" }, { status: 500 }); }
}
export const dynamic = "force-dynamic";
