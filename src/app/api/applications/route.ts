import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, courses, documents, feeAccess, universities } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { generateApplicationId } from "@/lib/utils";
import { sameOrigin, applicantCookie, feeResponse } from "@/lib/fees/auth";
import { FeeError, recoveryHash, validDate, indiaDate } from "@/lib/fees/rules";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const ADMISSION_DOCUMENTS = [
  { key: "photo", label: "Passport Photo", required: false },
  { key: "aadhaar", label: "Aadhaar Card", required: false },
  { key: "tenthMarksheet", label: "10th Marksheet", required: false },
  { key: "twelfthMarksheet", label: "12th Marksheet", required: false },
  { key: "gradMarksheet", label: "Graduation Marksheet", required: false },
  { key: "otherDoc", label: "Other Document", required: false },
] as const;

function getFileExtension(file: File) {
  const original = file.name.split(".").pop()?.toLowerCase();
  if (original && /^[a-z0-9]{1,8}$/.test(original)) return original;

  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

async function uploadAdmissionDocuments(
  applicationId: string,
  formData: FormData,
) {
  const uploaded: string[] = [];
  const rows: Array<{
    applicationId: string;
    docType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
  }> = [];

  try {
    for (const definition of ADMISSION_DOCUMENTS) {
      const value = formData.get(definition.key);
      if (!(value instanceof File) || value.size === 0) continue;

      if (value.size > MAX_DOCUMENT_FILE_SIZE) {
        throw new Error(`${definition.label} must be less than 5MB.`);
      }

      if (!ALLOWED_DOCUMENT_TYPES.includes(value.type)) {
        throw new Error(`${definition.label} must be JPG, PNG, WebP, or PDF.`);
      }

      const extension = getFileExtension(value);
      const objectPath = `applications/${applicationId}/${definition.key}.${extension}`;
      const buffer = Buffer.from(await value.arrayBuffer());

      const { error } = await supabase.storage.from("documents").upload(objectPath, buffer, {
        contentType: value.type,
        upsert: true,
      });

      if (error) {
        throw new Error(`Failed to upload ${definition.label.toLowerCase()}.`);
      }

      uploaded.push(objectPath);
      const { data } = supabase.storage.from("documents").getPublicUrl(objectPath);

      rows.push({
        applicationId,
        docType: definition.key,
        fileName: value.name,
        filePath: data.publicUrl,
        fileSize: value.size,
      });
    }

    if (rows.length > 0) {
      await db.insert(documents).values(rows);
    }

    return { rows };
  } catch (error) {
    if (uploaded.length > 0) {
      await supabase.storage.from("documents").remove(uploaded).catch(() => undefined);
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching applications:", error);

    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const multipart = req.headers.get("content-type")?.includes("multipart/form-data");
    const form = multipart ? await req.formData() : null;
    const body = form ? Object.fromEntries(form.entries()) : await req.json();
    if (body.paymentScreenshot) return NextResponse.json({ error: "Screenshot payment submissions are retired. Resume secure checkout instead." }, { status: 410 });
    const text = (key: string) => String(body[key] ?? "").trim();
    const recoveryCode = text("submissionKey");
    if (!/^[a-f0-9]{64}$/.test(recoveryCode)) throw new FeeError("Refresh the form before submitting.");
    const hash = recoveryHash(recoveryCode);
    const existing = await db.select({ application: applications }).from(feeAccess).innerJoin(applications, eq(applications.id, feeAccess.applicationId)).where(eq(feeAccess.recoveryHash, hash));
    if (existing[0]) {
      const response = NextResponse.json({ success: true, applicationId: existing[0].application.applicationId, recoveryCode });
      applicantCookie(response, existing[0].application.id); return response;
    }
    const courseId = Number(body.courseId);
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!course?.enabled) throw new FeeError("Selected course is not available.");
    const universityId = text("universityId") ? Number(body.universityId) : course.universityId;
    if (universityId) {
      const [university] = await db.select({ id: universities.id }).from(universities).where(eq(universities.id, universityId));
      if (!university) throw new FeeError("Selected university is not available.");
      if (course.universityId && course.universityId !== universityId) throw new FeeError("Select the university associated with this course.");
    }
    for (const key of ["firstName", "fatherName", "motherName", "gender", "address", "city", "state", "pinCode"]) {
      if (!text(key)) throw new FeeError("Please complete all required fields.");
    }
    if (!validDate(text("dob")) || text("dob") >= indiaDate() || !/^\d{10}$/.test(text("mobile")) || !/^\d{6}$/.test(text("pinCode"))) throw new FeeError("Enter a valid date of birth, 10-digit mobile and 6-digit PIN code.");
    if (body.declaration !== true && body.declaration !== "true") throw new FeeError("Please accept the declaration.");
    const application = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${hash}))`);
      const [prior] = await tx.select({ application: applications }).from(feeAccess).innerJoin(applications, eq(applications.id, feeAccess.applicationId)).where(eq(feeAccess.recoveryHash, hash));
      if (prior) return prior.application;
      const [saved] = await tx.insert(applications).values({
        applicationId: generateApplicationId(), courseId, universityId, studyMode: text("studyMode") || null,
        firstName: text("firstName"), lastName: text("lastName"), fatherName: text("fatherName"), motherName: text("motherName"),
        dob: text("dob"), gender: text("gender"), mobile: text("mobile"), email: text("email"), address: text("address"), city: text("city"), state: text("state"), pinCode: text("pinCode"),
        tenthBoard: text("tenthBoard") || null, tenthYear: text("tenthYear") || null, tenthPercentage: text("tenthPercentage") || null,
        twelfthBoard: text("twelfthBoard") || null, twelfthYear: text("twelfthYear") || null, twelfthPercentage: text("twelfthPercentage") || null,
        gradUniversity: text("gradUniversity") || null, gradYear: text("gradYear") || null, gradPercentage: text("gradPercentage") || null, declaration: true, status: "pending",
      }).returning();
      await tx.insert(feeAccess).values({ applicationId: saved.id, recoveryHash: hash });
      return saved;
    });
    let warning = "";
    if (form) {
      try { await uploadAdmissionDocuments(application.applicationId, form); }
      catch { warning = "Your application is saved, but some documents could not be uploaded. Contact admissions with your Application ID to provide them."; }
    }
    const response = NextResponse.json({ success: true, applicationId: application.applicationId, recoveryCode, warning }, { status: 201 });
    applicantCookie(response, application.id); return response;
  } catch (error) { return feeResponse(error); }
}
export const dynamic = "force-dynamic";
