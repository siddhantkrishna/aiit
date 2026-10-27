import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";

const JWT_SECRET = process.env.JWT_SECRET;
const VALID_STATUSES = ["pending", "reviewed", "shortlisted", "rejected", "hired"];

function authorized(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !JWT_SECRET) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: vacancyApplications.id,
        applicationId: vacancyApplications.applicationId,
        firstName: vacancyApplications.firstName,
        lastName: vacancyApplications.lastName,
        mobile: vacancyApplications.mobile,
        email: vacancyApplications.email,
        vacancyTitle: vacancies.title,
        resumePath: vacancyApplications.resumePath,
        status: vacancyApplications.status,
        createdAt: vacancyApplications.createdAt,
      })
      .from(vacancyApplications)
      .leftJoin(vacancies, eq(vacancyApplications.vacancyId, vacancies.id))
      .orderBy(desc(vacancyApplications.createdAt));
    return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Failed to load vacancy applications.");
    return NextResponse.json({ error: "Failed to load vacancy applications." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = typeof body?.status === "string" ? body.status : "";
    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const result = await db
      .update(vacancyApplications)
      .set({ status, updatedAt: new Date() })
      .where(eq(vacancyApplications.applicationId, id))
      .returning();
    if (!result[0]) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ application: result[0] });
  } catch {
    console.error("Failed to update vacancy application status.");
    return NextResponse.json({ error: "Could not update the application." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
