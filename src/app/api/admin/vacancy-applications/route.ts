import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vacancyApplications } from "@/db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "aiit-college-admin-secret-2025";

function authorized(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try { jwt.verify(token, JWT_SECRET); return true; } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(vacancyApplications).orderBy(desc(vacancyApplications.createdAt)));
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = String(body.id || ""); const status = String(body.status || "");
  if (!id || !["pending","reviewed","shortlisted","rejected","hired"].includes(status)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const result = await db.update(vacancyApplications).set({ status, updatedAt: new Date() }).where(eq(vacancyApplications.applicationId, id)).returning();
  return NextResponse.json({ application: result[0] || null });
}
