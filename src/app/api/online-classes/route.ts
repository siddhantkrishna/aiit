import { NextRequest, NextResponse } from "next/server";
import { asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { onlineClasses } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const includePast = req.nextUrl.searchParams.get("includePast") === "true";
    const rows = await db
      .select()
      .from(onlineClasses)
      .where(
        includePast
          ? eq(onlineClasses.enabled, true)
          : gte(onlineClasses.scheduledAt, new Date()),
      )
      .orderBy(asc(onlineClasses.scheduledAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load online classes:", error);
    return NextResponse.json({ error: "Failed to load online classes." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
