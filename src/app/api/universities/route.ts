import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { universities } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(universities).orderBy(desc(universities.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Error fetching universities:", error);
    return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newUni = await db.insert(universities).values({
      name: body.name,
      shortName: body.shortName,
      location: body.location,
      description: body.description,
      website: body.website,
      enabled: body.enabled ?? true,
    }).returning();
    return NextResponse.json(newUni[0]);
  } catch (error) {
    console.error("Error creating university:", error);
    return NextResponse.json({ error: "Failed to create university" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
