import { NextResponse } from "next/server";
import { db } from "@/db";
import { centres } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    return NextResponse.json(await db.select({ id: centres.id, name: centres.name }).from(centres).where(eq(centres.status, "ACTIVE")));
  } catch { return NextResponse.json({ error: "Unable to load centres." }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
