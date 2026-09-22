import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = clean(body.name, 120);
    const mobile = clean(body.mobile, 15).replace(/\D/g, "").slice(0, 10);

    if (!name || mobile.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid name and 10-digit mobile number." }, { status: 400 });
    }

    const leadId = `ENQ-${Date.now().toString().slice(-8)}`;
    const [lead] = await db.insert(leads).values({
      leadId,
      name,
      mobile,
      whatsapp: clean(body.whatsapp, 15).replace(/\D/g, "").slice(0, 10) || null,
      email: clean(body.email, 160) || null,
      location: clean(body.location, 160) || null,
      qualification: clean(body.qualification, 500) || null,
      interestedCourseId: body.interestedCourseId ? Number(body.interestedCourseId) : null,
      preferredUniversityId: body.preferredUniversityId ? Number(body.preferredUniversityId) : null,
      source: "ONLINE_INQUIRY",
      status: "NEW",
      priority: "NORMAL",
      notes: clean(body.message, 1200) || null,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ success: true, inquiryId: leadId, leadId: lead.leadId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create online inquiry:", error);
    return NextResponse.json({ error: "Unable to submit your inquiry right now." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
