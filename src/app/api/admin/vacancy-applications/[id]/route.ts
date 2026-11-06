import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { signedDocumentUrl } from "@/lib/document-access";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const result = await db
      .select({ application: vacancyApplications, vacancy: vacancies })
      .from(vacancyApplications)
      .leftJoin(vacancies, eq(vacancyApplications.vacancyId, vacancies.id))
      .where(eq(vacancyApplications.applicationId, id));
    if (!result[0]) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({...result[0],application:{...result[0].application,resumePath:await signedDocumentUrl(result[0].application.resumePath)}}, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Failed to load vacancy application details.");
    return NextResponse.json({ error: "Failed to load application." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
