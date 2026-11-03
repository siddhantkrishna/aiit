import { randomUUID } from "node:crypto";
import { leadSchema, id } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc, eq, ilike, or, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const conditions = [];
    if (searchParams.get("overdue") === "1") conditions.push(sql`next_follow_up_at < now() at time zone 'UTC' and status not in ('ADMITTED', 'CLOSED', 'CONVERTED', 'LOST')`);

    if (search) {
      conditions.push(
        or(
          ilike(leads.name, `%${search}%`),
          ilike(leads.mobile, `%${search}%`),
          ilike(leads.email, `%${search}%`),
          ilike(leads.leadId, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(eq(leads.status, status));
    }

    const rows = await db
      .select()
      .from(leads)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined,
      )
      .orderBy(desc(leads.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load leads:", error);

    return NextResponse.json(
      { error: "Failed to load leads." },
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
    const [existing] = updating ? await db.select().from(leads).where(eq(leads.id, Number(body.id))) : [];
    if (updating && !existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    const parsed = leadSchema.safeParse({ ...existing, ...body });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const referenceError = await invalidReference(parsed.data);
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const values = { ...parsed.data, updatedAt: new Date() };
    const [record] = updating
      ? await db.update(leads).set(values).where(eq(leads.id, Number(body.id))).returning()
      : await db.insert(leads).values({ ...values, leadId: `LEAD-${randomUUID()}` }).returning();
    return NextResponse.json({ success: true, lead: record }, { status: updating ? 200 : 201 });
  } catch { return NextResponse.json({ error: "Unable to save leads." }, { status: 400 }); }
}
export const dynamic = "force-dynamic";
