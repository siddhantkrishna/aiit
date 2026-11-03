import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVacancyApplicationId } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { requirePrivateBucket, uploadPrivateFile, validateUpload } from "@/lib/private-storage";
import { mobile as validMobile } from "@/lib/validation";
import { z } from "zod";

export async function POST(req: NextRequest) {
  let resumePath: string | null = null;
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
    // A blank optional file can parse as an empty File or an empty string.
    const hasResume = resume instanceof File && resume.name.length > 0;
    if (resume !== null && resume !== "" && !(resume instanceof File)) return NextResponse.json({ error: "Invalid resume upload." }, { status: 400 });
    if (hasResume) {
      try { await validateUpload(resume, false, true); }
      catch { return NextResponse.json({ error: "Resume must be a valid PDF, Word, TXT, RTF, ODT, PNG, JPG, JPEG or WEBP file under 3MB." }, { status: 400 }); }
    }
    const [vacancy] = await db.select().from(vacancies).where(eq(vacancies.id, vacancyId));
    if (!vacancy || !vacancy.enabled) return NextResponse.json({ error: "This vacancy is no longer available." }, { status: 404 });

    const applicationId = generateVacancyApplicationId();
    if (hasResume) {
      await requirePrivateBucket();
      resumePath = await uploadPrivateFile(`vacancies/${applicationId}`, resume, false, true);
    }
    await db.insert(vacancyApplications).values({
      applicationId, vacancyId, firstName, lastName, mobile, email,
      address: String(formData.get("address") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      qualification, experience, resumePath, status: "pending", declaration: true,
    });
    return NextResponse.json({ success: true, applicationId }, { status: 201 });
  } catch {
    if (resumePath) {
      const { error } = await supabase.storage.from("documents").remove([resumePath]);
      if (error) console.error("Resume cleanup requires review.");
    }
    console.error("Failed to create vacancy application.");
    return NextResponse.json({ error: "Failed to submit application. Check private storage setup or retry." }, { status: 503 });
  }
}
export const dynamic = "force-dynamic";
