import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
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
          ilike(payments.receiptId, `%${search}%`),
          ilike(payments.receiptNumber, `%${search}%`),
          ilike(payments.referenceNumber, `%${search}%`),
          ilike(payments.paymentType, `%${search}%`),
          ilike(payments.paymentMode, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(eq(payments.paymentStatus, status));
    }

    const rows = await db
      .select()
      .from(payments)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(payments.paymentDate));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load payments:", error);

    return NextResponse.json(
      { error: "Failed to load payments." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "A valid payment amount is required." },
        { status: 400 },
      );
    }

    const receiptId =
      String(body.receiptId || "").trim() ||
      `RCT-${Date.now().toString().slice(-8)}`;

    const [payment] = await db
      .insert(payments)
      .values({
        receiptId,
        studentId: body.studentId
          ? Number(body.studentId)
          : null,
        applicationId: body.applicationId
          ? Number(body.applicationId)
          : null,
        centreId: body.centreId
          ? Number(body.centreId)
          : null,

        paymentDate:
          body.paymentDate || new Date().toISOString().slice(0, 10),

        amount: String(amount),

        paymentType:
          String(body.paymentType || "").trim() || null,

        paymentMode:
          String(body.paymentMode || "").trim() || null,

        referenceNumber:
          String(body.referenceNumber || "").trim() || null,

        receivedBy:
          body.receivedBy ? Number(body.receivedBy) : null,

        proofPath:
          String(body.proofPath || "").trim() || null,

        paymentStatus:
          String(body.paymentStatus || "RECEIVED"),

        receiptNumber:
          String(body.receiptNumber || "").trim() || null,

        notes:
          String(body.notes || "").trim() || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        payment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create payment:", error);

    return NextResponse.json(
      { error: "Failed to create payment." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";