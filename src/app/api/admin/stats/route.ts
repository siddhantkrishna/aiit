import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";

export async function GET() {
  try {
    const total = await db.select({ count: sql<number>`count(*)` }).from(applications);
    const pending = await db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, "pending"));
    const approved = await db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, "approved"));
    const rejected = await db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, "rejected"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayApps = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(gte(applications.createdAt, today));

    return NextResponse.json({
      total: Number(total[0].count),
      pending: Number(pending[0].count),
      approved: Number(approved[0].count),
      rejected: Number(rejected[0].count),
      today: Number(todayApps[0].count),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
