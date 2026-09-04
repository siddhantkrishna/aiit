import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(
            marketingCampaigns.campaignCode,
            `%${search}%`,
          ),
          ilike(
            marketingCampaigns.campaignName,
            `%${search}%`,
          ),
          ilike(
            marketingCampaigns.campaignType,
            `%${search}%`,
          ),
          ilike(
            marketingCampaigns.objective,
            `%${search}%`,
          ),
          ilike(
            marketingCampaigns.targetAudience,
            `%${search}%`,
          ),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(
        eq(marketingCampaigns.status, status),
      );
    }

    const rows = await db
      .select()
      .from(marketingCampaigns)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(
        desc(marketingCampaigns.createdAt),
      );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(
      "Failed to load marketing campaigns:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load marketing campaigns.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const campaignName = String(
      body.campaignName || "",
    ).trim();

    if (!campaignName) {
      return NextResponse.json(
        {
          error: "Campaign name is required.",
        },
        { status: 400 },
      );
    }

    const campaignCode =
      String(body.campaignCode || "").trim() ||
      `CMP-${Date.now().toString().slice(-8)}`;

    const [campaign] = await db
      .insert(marketingCampaigns)
      .values({
        campaignCode,
        campaignName,

        campaignType:
          String(
            body.campaignType || "",
          ).trim() || null,

        centreId: body.centreId
          ? Number(body.centreId)
          : null,

        objective:
          String(body.objective || "").trim() ||
          null,

        targetAudience:
          String(
            body.targetAudience || "",
          ).trim() || null,

        startDate:
          body.startDate || null,

        endDate:
          body.endDate || null,

        budget:
          body.budget != null
            ? String(body.budget)
            : "0",

        status:
          String(body.status || "PLANNED"),

        leadsGenerated:
          Number(body.leadsGenerated || 0),

        applicationsGenerated:
          Number(
            body.applicationsGenerated || 0,
          ),

        admissionsGenerated:
          Number(
            body.admissionsGenerated || 0,
          ),

        revenueGenerated:
          body.revenueGenerated != null
            ? String(body.revenueGenerated)
            : "0",

        notes:
          String(body.notes || "").trim() ||
          null,

        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        campaign,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create marketing campaign:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create marketing campaign.",
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";