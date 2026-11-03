import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leadSchema } from "@/lib/validation";
import { invalidReference } from "@/lib/record-validation";
import { randomUUID } from "node:crypto";
import { leads } from "@/db/schema";

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = clean(body.name, 120);
    const mobile = clean(body.mobile, 15);

    if (!name || mobile.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid name and 10-digit mobile number." }, { status: 400 });
    }

    const parsed = leadSchema.safeParse({ ...body, nextFollowUpAt: null, assignedTo: null, status: "NEW", priority: "NORMAL" });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const error = await invalidReference({ interestedCourseId: parsed.data.interestedCourseId, preferredUniversityId: parsed.data.preferredUniversityId });
    if (error) return NextResponse.json({ error }, { status: 400 });
    const branch = clean(body.branch, 50).toUpperCase();
    const leadId = `ENQ-${randomUUID()}`;
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
      source: branch === "TAMNAR" ? "TAMNAR_INQUIRY" : "ONLINE_INQUIRY",
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
