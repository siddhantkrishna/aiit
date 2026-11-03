import { universitySchema } from "@/lib/validation";
import { publicUniversity } from "@/lib/catalogue";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { universities } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const all = await db.select().from(universities).where(requireAdmin(req) ? undefined : publicUniversity).orderBy(desc(universities.createdAt));
    return NextResponse.json(requireAdmin(req) ? all : all.map(row => ({ id: row.id, name: row.name, shortName: row.shortName, location: row.location, description: row.description, website: row.website, enabled: row.enabled })));
  } catch (error) {
    console.error("Error fetching universities:", error);
    return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = universitySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const newUni = await db.insert(universities).values({ ...parsed.data, lastVerifiedAt: parsed.data.authorizationStatus === "VERIFIED" ? new Date() : null }).returning();
    return NextResponse.json(newUni[0]);
  } catch (error) {
    console.error("Error creating university:", error);
    return NextResponse.json({ error: "Failed to create university" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
