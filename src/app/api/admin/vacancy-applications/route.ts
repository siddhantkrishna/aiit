import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vacancyApplications } from "@/db/schema";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json((await db.select().from(vacancyApplications).orderBy(desc(vacancyApplications.createdAt))).map(({resumePath, ...row}) => ({...row, hasResume: !!resumePath})));
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = String(body.id || ""); const status = String(body.status || "");
  if (!id || !["pending","reviewed","shortlisted","rejected","hired"].includes(status)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const result = await db.update(vacancyApplications).set({ status, updatedAt: new Date() }).where(eq(vacancyApplications.applicationId, id)).returning();
  return NextResponse.json({ application: result[0] || null });
}
