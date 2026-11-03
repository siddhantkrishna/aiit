import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, applicationStatusHistory, courses, universities, centres, documents } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { generateApplicationId } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin-auth";
import { applicationSchema } from "@/lib/validation";
import { requirePrivateBucket, uploadPrivateFile, validateUpload } from "@/lib/private-storage";
import jwt from "jsonwebtoken";

const documentTypes = ["photo", "aadhaar", "tenthMarksheet", "twelfthMarksheet", "gradMarksheet", "otherDoc"];

function ownsApplication(req: NextRequest, applicationId: string) {
  if (requireAdmin(req)) return true;
  const token = req.cookies.get("application_upload")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    const claims = jwt.verify(token, secret, { algorithms: ["HS256"], audience: "aiit-application-upload", issuer: "aiit" });
    return typeof claims !== "string" && claims.applicationId === applicationId;
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Document access is granted only by the authorized detail endpoint.
    const rows = await db.select().from(applications).orderBy(desc(applications.createdAt));
    return NextResponse.json(rows.map(({ paymentScreenshotPath, ...row }) => ({ ...row, hasPaymentScreenshot: !!paymentScreenshotPath })));
  } catch {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const uploaded: string[] = [];
  try {
    if (!process.env.JWT_SECRET) return NextResponse.json({ error: "Submission temporarily unavailable." }, { status: 503 });
    const multipart = req.headers.get("content-type")?.includes("multipart/form-data");
    const form = multipart ? await req.formData() : null;
    const body = form ? Object.fromEntries(form.entries()) : await req.json();
    if (body.applicationId) {
      if (!ownsApplication(req, String(body.applicationId))) return NextResponse.json({ error: "Application upload authorization required. Contact AIIT for assistance." }, { status: 403 });
      const [existing] = await db.select({ id: applications.id }).from(applications).where(eq(applications.applicationId, String(body.applicationId)));
      if (!existing) return NextResponse.json({ error: "Application not found." }, { status: 404 });
      if (!(body.paymentScreenshot instanceof File)) return NextResponse.json({ error: "Select a screenshot." }, { status: 400 });
      await requirePrivateBucket();
      const path = await uploadPrivateFile(`applications/${body.applicationId}`, body.paymentScreenshot, true);
      uploaded.push(path);
      await db.update(applications).set({ paymentScreenshotPath: path, paymentScreenshotUploadedAt: new Date(), updatedAt: new Date() }).where(eq(applications.id, existing.id));
      return NextResponse.json({ success: true, applicationId: body.applicationId, message: "Screenshot submitted for manual verification." });
    }
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const value = parsed.data;
    const [course] = await db.select().from(courses).where(and(eq(courses.id, value.courseId), eq(courses.enabled, true), eq(courses.verificationStatus, "VERIFIED")));
    if (!course || value.studyMode !== course.studyMode || value.universityId !== course.universityId) return NextResponse.json({ error: "Choose the verified course, university and study mode shown in the catalogue." }, { status: 400 });
    if (value.universityId) {
      const [university] = await db.select({ id: universities.id }).from(universities).where(and(eq(universities.id, value.universityId), eq(universities.enabled, true), eq(universities.authorizationStatus, "VERIFIED")));
      if (!university) return NextResponse.json({ error: "University authorization is not verified." }, { status: 400 });
    }
    const [centre] = await db.select().from(centres).where(and(eq(centres.id, value.centreId), eq(centres.status, "ACTIVE")));
    if (!centre) return NextResponse.json({ error: "Select an active AIIT centre." }, { status: 400 });
    const files = documentTypes.flatMap(key => body[key] instanceof File && body[key].size ? [{ key, file: body[key] as File }] : []);
    if (files.reduce((size, item) => size + item.file.size, 0) > 4 * 1024 * 1024) return NextResponse.json({ error: "Keep combined uploads below 4MB. Compress scans before submitting." }, { status: 413 });
    const requiredDocuments = ["photo", "aadhaar", "tenthMarksheet"];
    if (["12th", "Graduate", "Postgraduate"].includes(value.qualification)) requiredDocuments.push("twelfthMarksheet");
    if (["Graduate", "Postgraduate"].includes(value.qualification)) requiredDocuments.push("gradMarksheet");
    for (const required of requiredDocuments) {
      if (!files.some(f => f.key === required)) return NextResponse.json({ error: `Upload ${required} for the selected qualification.` }, { status: 400 });
    }
    for (const { key, file } of files) await validateUpload(file, key === "photo");
    await requirePrivateBucket();
    const applicationId = generateApplicationId();
    const docs: (typeof documents.$inferInsert)[] = [];
    for (const { key, file } of files) {
      const path = await uploadPrivateFile(`applications/${applicationId}`, file, key === "photo");
      uploaded.push(path);
      docs.push({ applicationId, docType: key, fileName: file.name.slice(0, 500), filePath: path, fileSize: file.size });
    }
    await db.transaction(async tx => {
      const [application] = await tx.insert(applications).values({ ...value, applicationId, status: "pending", applicationStatus: "RECEIVED", documentStatus: "PENDING", verificationStatus: "PENDING" }).returning({ id: applications.id });
      await tx.insert(documents).values(docs);
      await tx.insert(applicationStatusHistory).values({ applicationId: application.id, newStatus: "RECEIVED", notes: "Application submitted" });
    });
    const response = NextResponse.json({ success: true, applicationId, status: "pending" }, { status: 201 });
    response.cookies.set("application_upload", jwt.sign({ applicationId }, process.env.JWT_SECRET, { algorithm: "HS256", audience: "aiit-application-upload", issuer: "aiit", expiresIn: "2h" }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7200, path: "/api/applications",
    });
    return response;
  } catch (error) {
    if (uploaded.length) {
      const { error: cleanupError } = await supabase.storage.from("documents").remove(uploaded);
      if (cleanupError) console.error("Admission upload cleanup requires review.");
    }
    if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    console.error("Application submission failed.");
    return NextResponse.json({ error: "Unable to submit. Please retry or contact AIIT; retain your documents." }, { status: 503 });
  }
}
export const dynamic = "force-dynamic";
