import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { db } from "@/db";
import { universities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    sameOrigin(req);
    adminIdentity(req);
    const { id } = await params;
    const body = await req.json();
    const updated = await db
      .update(universities)
      .set({
        name: body.name,
        shortName: body.shortName,
        location: body.location,
        description: body.description,
        website: body.website,
        enabled: body.enabled,
      })
      .where(eq(universities.id, parseInt(id)))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating university:", error);
    return feeResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    sameOrigin(req);
    adminIdentity(req);
    const { id } = await params;
    await db.delete(universities).where(eq(universities.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting university:", error);
    return feeResponse(error);
  }
}

export const dynamic = "force-dynamic";
