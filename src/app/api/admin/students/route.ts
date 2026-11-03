import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { and, desc, eq, ilike, or, sql, getTableColumns, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { studentUpdateSchema, id, date, mobile, money } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";
import { paise, rupees } from "@/lib/payment-balance";
import { z } from "zod";

const publicColumns = { ...getTableColumns(students) };
delete (publicColumns as Partial<typeof publicColumns>).accessCodeHash;

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const query = req.nextUrl.searchParams;
    const conditions = [];
    if (query.get("universityPending") === "1") conditions.push(sql`university_id is not null and student_status = 'ACTIVE' and university_status is distinct from 'COMPLETED'`);
    const search = query.get("search")?.trim();
    if (search) conditions.push(or(ilike(students.studentId, `%${search}%`), ilike(students.firstName, `%${search}%`), ilike(students.mobile, `%${search}%`), ilike(students.programName, `%${search}%`)));
    if (query.get("status") && query.get("status") !== "ALL") conditions.push(eq(students.studentStatus, query.get("status")!));
    return NextResponse.json(await db.select(publicColumns).from(students).where(and(...conditions)).orderBy(desc(students.createdAt)));
  } catch { return NextResponse.json({ error: "Unable to load students." }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = studentUpdateSchema.extend({ firstName: z.string().trim().min(1).max(255), mobile, dob: date, courseId: id, centreId: id, totalFee: money.default("0"), qualification: z.string().max(2000).optional(), admissionDate: date }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const value = parsed.data;
    const referenceError = await invalidReference(value);
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const student = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${value.mobile}:${value.dob}:${value.courseId}`}, 0))`);
      const [existing] = await tx.select({ id: students.id }).from(students).where(and(eq(students.mobile, value.mobile), eq(students.dob, value.dob), eq(students.courseId, value.courseId)));
      if (existing) return null;
      const [record] = await tx.insert(students).values({ ...value, studentId: `STU-${randomUUID()}`, amountPaid: "0", amountPending: value.totalFee }).returning(publicColumns);
      return record;
    });
    if (!student) return NextResponse.json({ error: "Matching student already exists. Update the existing record." }, { status: 409 });
    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create student." }, { status: 400 }); }
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!id.safeParse(body.id).success) return NextResponse.json({ error: "Valid student ID required." }, { status: 400 });
    if (body.action === "issue-access-code") {
      const code = randomBytes(24).toString("base64url");
      const [student] = await db.update(students).set({ accessCodeHash: await bcrypt.hash(code, 12), updatedAt: new Date() }).where(eq(students.id, Number(body.id))).returning({ id: students.id });
      if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });
      return NextResponse.json({ success: true, accessCode: code }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const parsed = studentUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const referenceError = await invalidReference(parsed.data);
    if (referenceError) return NextResponse.json({ error: referenceError }, { status: 400 });
    const student = await db.transaction(async tx => {
      const [current] = await tx.select().from(students).where(eq(students.id, Number(body.id))).for("update");
      if (!current) return null;
      if (parsed.data.mobile && parsed.data.mobile !== current.mobile && current.dob && current.courseId) {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${parsed.data.mobile}:${current.dob}:${current.courseId}`}, 0))`);
        const [duplicate] = await tx.select({ id: students.id }).from(students).where(and(ne(students.id, current.id), eq(students.mobile, parsed.data.mobile), eq(students.dob, current.dob), eq(students.courseId, current.courseId)));
        if (duplicate) throw new Error("Duplicate identity");
      }
      const totalFee = parsed.data.totalFee ?? current.totalFee ?? "0";
      const pending = Math.max(0, paise(totalFee) - paise(current.amountPaid || "0"));
      const [updated] = await tx.update(students).set({ ...parsed.data, totalFee, amountPending: rupees(pending), paymentStatus: pending ? "PENDING" : "PAID", updatedAt: new Date() }).where(eq(students.id, current.id)).returning(publicColumns);
      return updated;
    });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });
    return NextResponse.json({ success: true, student });
  } catch { return NextResponse.json({ error: "Unable to update student." }, { status: 400 }); }
}
export const dynamic = "force-dynamic";
