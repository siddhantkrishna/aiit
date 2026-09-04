import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountingTransactions } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(
            accountingTransactions.transactionCode,
            `%${search}%`,
          ),
          ilike(
            accountingTransactions.category,
            `%${search}%`,
          ),
          ilike(
            accountingTransactions.description,
            `%${search}%`,
          ),
          ilike(
            accountingTransactions.paymentMode,
            `%${search}%`,
          ),
          ilike(
            accountingTransactions.referenceNumber,
            `%${search}%`,
          ),
        ),
      );
    }

    if (type && type !== "ALL") {
      conditions.push(
        eq(
          accountingTransactions.transactionType,
          type,
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(
        eq(
          accountingTransactions.status,
          status,
        ),
      );
    }

    const rows = await db
      .select()
      .from(accountingTransactions)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(
        desc(accountingTransactions.transactionDate),
        desc(accountingTransactions.createdAt),
      );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(
      "Failed to load accounting transactions:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load accounting transactions.",
      },
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
        {
          error: "A valid amount is required.",
        },
        { status: 400 },
      );
    }

    const transactionCode =
      String(
        body.transactionCode || "",
      ).trim() ||
      `TXN-${Date.now().toString().slice(-8)}`;

    const transactionType = String(
      body.transactionType || "",
    ).trim();

    const category = String(
      body.category || "",
    ).trim();

    if (!transactionType || !category) {
      return NextResponse.json(
        {
          error:
            "Transaction type and category are required.",
        },
        { status: 400 },
      );
    }

    const [transaction] = await db
      .insert(accountingTransactions)
      .values({
        transactionCode,

        transactionDate:
          body.transactionDate ||
          new Date().toISOString().slice(0, 10),

        centreId: body.centreId
          ? Number(body.centreId)
          : null,

        transactionType,

        category,

        description:
          String(
            body.description || "",
          ).trim() || null,

        amount: String(amount),

        paymentMode:
          String(
            body.paymentMode || "",
          ).trim() || null,

        referenceNumber:
          String(
            body.referenceNumber || "",
          ).trim() || null,

        relatedStudentId:
          body.relatedStudentId
            ? Number(body.relatedStudentId)
            : null,

        relatedPaymentId:
          body.relatedPaymentId
            ? Number(body.relatedPaymentId)
            : null,

        relatedExpenseId:
          body.relatedExpenseId
            ? Number(body.relatedExpenseId)
            : null,

        recordedBy:
          body.recordedBy
            ? Number(body.recordedBy)
            : null,

        status:
          String(body.status || "POSTED"),

        notes:
          String(body.notes || "").trim() ||
          null,

        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        transaction,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create accounting transaction:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create accounting transaction.",
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";