import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents, applicationStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { requirePrivateBucket, uploadPrivateFile } from "@/lib/private-storage";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let path: string | null = null;
  try {
    const id = (await params).id;
    const [app] = await db.select().from(applications).where(/^\d+$/.test(id) ? eq(applications.id, Number(id)) : eq(applications.applicationId, id));
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const form = await req.formData();
    const docType = String(form.get("docType")); const file = form.get("file");
    if (!["photo", "aadhaar", "tenthMarksheet", "twelfthMarksheet", "gradMarksheet", "otherDoc"].includes(docType) || !(file instanceof File)) return NextResponse.json({ error: "Choose a document type and file" }, { status: 400 });
    await requirePrivateBucket(); path = await uploadPrivateFile(`applications/${app.applicationId}`, file, docType === "photo");
    const filePath = path;
    await db.transaction(async tx => {
      await tx.insert(documents).values({ applicationId: app.applicationId, docType, fileName: file.name.slice(0, 500), filePath, fileSize: file.size });
      await tx.update(applications).set({ documentStatus: "PENDING", updatedAt: new Date() }).where(eq(applications.id, app.id));
      await tx.insert(applicationStatusHistory).values({ applicationId: app.id, oldStatus: app.applicationStatus, newStatus: app.applicationStatus || app.status, changedBy: admin.id, notes: `Added ${docType}; document review pending` });
    });
    return NextResponse.json({ success: true });
  } catch {
    if (path) { const { error } = await supabase.storage.from("documents").remove([path]); if (error) console.error("Document cleanup requires review."); }
    return NextResponse.json({ error: "Upload failed. Check private storage and file type/size." }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
