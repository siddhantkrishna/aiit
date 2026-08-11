import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.applicationId, id));

    if (app.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.applicationId, id));

    return NextResponse.json({
      application: app[0],
      documents: docs,
    });
  } catch (error) {
    console.error("Error fetching application:", error);

    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!["pending", "approved", "rejected"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(applications)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(applications.applicationId, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating application:", error);

    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .delete(documents)
      .where(eq(documents.applicationId, id));

    await db
      .delete(applications)
      .where(eq(applications.applicationId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);

    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";