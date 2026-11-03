import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, studentDocuments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { id } from "@/lib/validation";
import { requirePrivateBucket, uploadPrivateFile } from "@/lib/private-storage";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let path: string | null = null;
  try {
    const parsed = id.safeParse((await params).id);
    if (!parsed.success) return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, parsed.data));
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    const form = await req.formData(); const docType = String(form.get("docType")); const file = form.get("file");
    if (!["ADMIT_CARD", "EXAM_FORM", "RESULT", "CERTIFICATE", "UNIVERSITY_DOCUMENT", "SUPPORTING"].includes(docType) || !(file instanceof File)) return NextResponse.json({ error: "Choose a document type and file" }, { status: 400 });
    await requirePrivateBucket(); path = await uploadPrivateFile(`students/${student.id}`, file);
    const filePath = path;
    await db.transaction(async tx => {
      await tx.insert(studentDocuments).values({ studentId: student.id, documentId: randomUUID(), documentType: docType, fileName: file.name.slice(0, 500), storagePath: filePath, uploadedBy: admin.id, uploadedAt: new Date(), verificationStatus: "PENDING" });
      if (docType === "ADMIT_CARD") await tx.update(students).set({ admitCardPath: filePath, updatedAt: new Date() }).where(eq(students.id, student.id));
    });
    return NextResponse.json({ success: true });
  } catch {
    if (path) { const { error } = await supabase.storage.from("documents").remove([path]); if (error) console.error("Student document cleanup requires review."); }
    return NextResponse.json({ error: "Upload failed. Check private storage and file type/size." }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const studentId = id.safeParse((await params).id);
    const body = await req.json();
    if (!studentId.success || !id.safeParse(body.documentId).success || !["PENDING", "VERIFIED", "REJECTED"].includes(body.verificationStatus)) return NextResponse.json({ error: "Choose a document and verification status." }, { status: 400 });
    const [document] = await db.update(studentDocuments).set({ verificationStatus: body.verificationStatus, verifiedBy: admin.id, verifiedAt: new Date(), updatedAt: new Date() }).where(and(eq(studentDocuments.id, Number(body.documentId)), eq(studentDocuments.studentId, studentId.data))).returning({ id: studentDocuments.id });
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unable to update document verification." }, { status: 400 }); }
}
