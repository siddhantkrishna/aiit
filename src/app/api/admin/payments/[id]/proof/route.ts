import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { id } from "@/lib/validation";
import { signDocument } from "@/lib/private-storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = id.safeParse((await params).id);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    const [record] = await db.select({ proof: payments.proofPath, applicationProof: applications.paymentScreenshotPath }).from(payments).leftJoin(applications, eq(payments.applicationId, applications.id)).where(eq(payments.id, parsed.data));
    const url = await signDocument(record?.proof || record?.applicationProof || null);
    if (!url) return NextResponse.json({ error: "No payment proof uploaded." }, { status: 404 });
    return NextResponse.redirect(url);
  } catch { return NextResponse.json({ error: "Unable to open secure proof." }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
