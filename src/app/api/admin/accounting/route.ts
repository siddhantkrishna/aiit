import { randomUUID } from "node:crypto";
import { accountingSchema, id } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountingTransactions } from "@/db/schema";
import { desc, eq, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          ? and(...conditions)
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

export async function POST(req: NextRequest) { return save(req, false); }
export async function PUT(req: NextRequest) { return save(req, true); }

async function save(req: NextRequest, updating: boolean) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (updating && !id.safeParse(body.id).success) return NextResponse.json({ error: "Valid record ID required." }, { status: 400 });
    const [existing] = updating ? await db.select().from(accountingTransactions).where(eq(accountingTransactions.id, Number(body.id))) : [];
    if (updating && !existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    if (existing?.relatedPaymentId) return NextResponse.json({ error: "Use payment verification to change payment-linked entries." }, { status: 409 });
    const parsed = accountingSchema.safeParse({ ...existing, ...body });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const referenceError = await invalidReference(parsed.data);
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const values = { ...parsed.data, updatedAt: new Date(), recordedBy: admin.id };
    const [record] = updating
      ? await db.update(accountingTransactions).set(values).where(eq(accountingTransactions.id, Number(body.id))).returning()
      : await db.insert(accountingTransactions).values({ ...values, transactionCode: `TXN-${randomUUID()}` }).returning();
    return NextResponse.json({ success: true, transaction: record }, { status: updating ? 200 : 201 });
  } catch { return NextResponse.json({ error: "Unable to save accounting." }, { status: 400 }); }
}
export const dynamic = "force-dynamic";
