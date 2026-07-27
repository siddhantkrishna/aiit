import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, courses } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const applicationId = searchParams.get("applicationId");
    const mobile = searchParams.get("mobile");

    if (!applicationId && !mobile) {
      return NextResponse.json(
        { error: "Please provide applicationId or mobile" },
        { status: 400 }
      );
    }

    const conditions = [];
    if (applicationId) {
      conditions.push(eq(applications.applicationId, applicationId));
    }
    if (mobile) {
      conditions.push(eq(applications.mobile, mobile));
    }

    const results = await db
      .select()
      .from(applications)
      .where(or(...conditions));

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No application found" },
        { status: 404 }
      );
    }

    // Get course names for results
    const enriched = await Promise.all(
      results.map(async (app) => {
        const course = await db
          .select()
          .from(courses)
          .where(eq(courses.id, app.courseId));
        return {
          applicationId: app.applicationId,
          name: `${app.firstName} ${app.lastName || ""}`.trim(),
          course: course[0]?.name || "N/A",
          status: app.status,
          submittedAt: app.createdAt,
          updatedAt: app.updatedAt,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error checking status:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
