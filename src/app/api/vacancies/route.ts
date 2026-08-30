import { NextResponse } from "next/server";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(vacancies)
      .where(eq(vacancies.enabled, true))
      .orderBy(asc(vacancies.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch vacancies:", error);
    return NextResponse.json({ error: "Failed to fetch vacancies." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
