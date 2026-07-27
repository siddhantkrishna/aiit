import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

// Track if seeded to avoid re-seeding on every health check
let seeded = false;

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    
    // Auto-seed on first health check
    if (!seeded) {
      try {
        await seedDatabase();
        seeded = true;
      } catch (seedErr) {
        console.log("Seed skipped or already done:", seedErr);
        seeded = true;
      }
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: result.rows.length > 0 ? "connected" : "error",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
