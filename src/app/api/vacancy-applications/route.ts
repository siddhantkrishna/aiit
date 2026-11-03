import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVacancyApplicationId } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { requirePrivateBucket, uploadPrivateFile } from "@/lib/private-storage";
import { mobile as validMobile } from "@/lib/validation";
import { z } from "zod";

const MAX_FILE_SIZE = 3 * 1024 * 1024;
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
    if (!validMobile.safeParse(mobile).success || !z.email().safeParse(email).success || firstName.length > 255 || lastName.length > 255 || qualification.length > 4000 || experience.length > 4000) return NextResponse.json({ error: "Invalid applicant details." }, { status: 400 });
    if (!declaration) return NextResponse.json({ error: "Please accept the declaration." }, { status: 400 });
    if (!(resume instanceof File) || resume.size === 0) return NextResponse.json({ error: "Resume is required." }, { status: 400 });
    if (resume.size > MAX_FILE_SIZE || !ALLOWED_RESUME_TYPES.includes(resume.type)) {
      return NextResponse.json({ error: "Resume must be PDF, DOC or DOCX and under 3MB." }, { status: 400 });
    }

    const [vacancy] = await db.select().from(vacancies).where(eq(vacancies.id, vacancyId));
    if (!vacancy || !vacancy.enabled) return NextResponse.json({ error: "This vacancy is no longer available." }, { status: 404 });

    const applicationId = generateVacancyApplicationId();
    await requirePrivateBucket();
    const objectPath = await uploadPrivateFile(`vacancies/${applicationId}`, resume, false, true);
    try {
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
      resumePath: objectPath,
      status: "pending",
      declaration: true,
    }).returning();

    return NextResponse.json({ success: true, applicationId: application.applicationId });
    } catch (error) {
      const { error: cleanupError } = await supabase.storage.from("documents").remove([objectPath]);
      if (cleanupError) console.error("Resume cleanup requires review.");
      throw error;
    }
  } catch (error) {
    console.error("Failed to create vacancy application:", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
