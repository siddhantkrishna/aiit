import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_STATUSES = [
  "RECEIVED",
  "UNDER REVIEW",
  "DOCUMENTS PENDING",
  "VERIFIED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const byNumericId = Number(id);

    const app = Number.isNaN(byNumericId)
      ? await db
          .select()
          .from(applications)
          .where(eq(applications.applicationId, id))
      : await db
          .select()
          .from(applications)
          .where(eq(applications.id, byNumericId));

    if (app.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const application = app[0];

    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.applicationId, application.applicationId));

    return NextResponse.json({
      application,
      documents: docs,
    });
  } catch (error) {
    console.error("Error fetching application:", error);

    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const newStatus = String(
      body.applicationStatus || body.status || "",
    ).trim();

    if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid application status" },
        { status: 400 },
      );
    }

    const byNumericId = Number(id);

    const updated = Number.isNaN(byNumericId)
      ? await db
          .update(applications)
          .set({
            status:
              newStatus === "APPROVED"
                ? "approved"
                : newStatus === "REJECTED"
                  ? "rejected"
                  : newStatus === "CANCELLED"
                    ? "rejected"
                    : "pending",
            updatedAt: new Date(),
          })
          .where(eq(applications.applicationId, id))
          .returning()
      : await db
          .update(applications)
          .set({
            status:
              newStatus === "APPROVED"
                ? "approved"
                : newStatus === "REJECTED"
                  ? "rejected"
                  : newStatus === "CANCELLED"
                    ? "rejected"
                    : "pending",
            updatedAt: new Date(),
          })
          .where(eq(applications.id, byNumericId))
          .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      application: updated[0],
    });
  } catch (error) {
    console.error("Error updating application:", error);

    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const byNumericId = Number(id);

    const target = Number.isNaN(byNumericId)
      ? await db
          .select({
            id: applications.id,
            applicationId: applications.applicationId,
          })
          .from(applications)
          .where(eq(applications.applicationId, id))
      : await db
          .select({
            id: applications.id,
            applicationId: applications.applicationId,
          })
          .from(applications)
          .where(eq(applications.id, byNumericId));

    if (target.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const application = target[0];

    await db
      .delete(documents)
      .where(eq(documents.applicationId, application.applicationId));

    await db
      .delete(applications)
      .where(eq(applications.id, application.id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting application:", error);

    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";