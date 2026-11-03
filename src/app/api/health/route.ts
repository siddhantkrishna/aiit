import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: result.rows.length > 0 ? "connected" : "error",
    });
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503 }
    );
  }
}

export const dynamic = "force-dynamic";
