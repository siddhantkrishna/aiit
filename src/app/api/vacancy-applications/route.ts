import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVacancyApplicationId } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const vacancyId = Number(formData.get("vacancyId"));
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const mobile = String(formData.get("mobile") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const qualification = String(formData.get("qualification") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const declaration = formData.get("declaration") === "true";
    const resume = formData.get("resume");

    if (!Number.isInteger(vacancyId) || vacancyId < 1 || !firstName || !mobile || !email || !qualification || !experience) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    if (!declaration) return NextResponse.json({ error: "Please accept the declaration." }, { status: 400 });
    if (!(resume instanceof File) || resume.size === 0) return NextResponse.json({ error: "Resume is required." }, { status: 400 });
    if (resume.size > MAX_FILE_SIZE || !ALLOWED_RESUME_TYPES.includes(resume.type)) {
      return NextResponse.json({ error: "Resume must be PDF, DOC, or DOCX and under 5MB." }, { status: 400 });
    }

    const [vacancy] = await db.select().from(vacancies).where(eq(vacancies.id, vacancyId));
    if (!vacancy || !vacancy.enabled) return NextResponse.json({ error: "This vacancy is no longer available." }, { status: 404 });

    const applicationId = generateVacancyApplicationId();
    const extension = resume.name.split(".").pop()?.toLowerCase() || "pdf";
    const objectPath = `vacancies/${applicationId}/resume.${extension}`;
    const buffer = Buffer.from(await resume.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("documents").upload(objectPath, buffer, {
      contentType: resume.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload resume." }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from("documents").getPublicUrl(objectPath);
    const [application] = await db.insert(vacancyApplications).values({
      applicationId,
      vacancyId,
      firstName,
      lastName,
      mobile,
      email,
      address: String(formData.get("address") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      qualification,
      experience,
      resumePath: publicUrl.publicUrl,
      status: "pending",
      declaration: true,
    }).returning();

    return NextResponse.json({ success: true, applicationId, application });
  } catch (error) {
    console.error("Failed to create vacancy application:", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
