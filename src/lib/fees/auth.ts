import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feeAccess } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { getStudentFromRequest } from "@/lib/student-auth";
import { FeeError, recoveryHash } from "./rules";

export type FeeIdentity = { adminId?: number; studentId?: number; applicationId?: number };
export function identity(req: NextRequest): FeeIdentity {
  const admin = requireAdmin(req);
  if (admin && (req.nextUrl.searchParams.has("studentId") || req.nextUrl.searchParams.has("applicationId") || req.nextUrl.pathname.startsWith("/api/admin/") || req.nextUrl.pathname.includes("/receipts/"))) return { adminId: Number(admin.id) };
  const student = getStudentFromRequest(req);
  if (student && /^\d+$/.test(student)) return { studentId: Number(student) };
  try {
    const token = req.cookies.get("applicant_fee_token")?.value;
    const decoded = jwt.verify(token || "", process.env.JWT_SECRET || "") as JwtPayload;
    if (decoded.role === "applicant_fees" && Number.isSafeInteger(decoded.applicationId)) return { applicationId: decoded.applicationId };
  } catch { /* Missing or expired cookie. */ }
  throw new FeeError("Sign in to view or pay fees.", 401);
}
export function adminIdentity(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) throw new FeeError("Administrator login required.", 401);
  return Number(admin.id);
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) throw new FeeError("Cross-origin request rejected.", 403);
}
export function applicantCookie(response: NextResponse, applicationId: number) {
  if (!process.env.JWT_SECRET) throw new FeeError("Session configuration unavailable.", 503);
  response.cookies.set("applicant_fee_token", jwt.sign({ applicationId, role: "applicant_fees" }, process.env.JWT_SECRET, { expiresIn: "8h" }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 28800,
  });
}
export async function recoverApplicant(applicationId: string, code: string) {
  if (!/^[a-f\d]{64}$/i.test(code)) throw new FeeError("Application ID or recovery code is incorrect.", 401);
  const { applications } = await import("@/db/schema");
  const [row] = await db.select({ id: applications.id, hash: feeAccess.recoveryHash }).from(applications)
    .innerJoin(feeAccess, eq(feeAccess.applicationId, applications.id)).where(eq(applications.applicationId, applicationId));
  if (!row || row.hash !== recoveryHash(code)) throw new FeeError("Application ID or recovery code is incorrect.", 401);
  return row.id;
}
export function feeResponse(error: unknown) {
  if (error instanceof FeeError) return NextResponse.json({ error: error.message }, { status: error.status });
  // Do not log gateway error bodies, SQL parameters or student information.
  console.error("Fee operation failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "Unable to process fees right now. Please retry; your application and confirmed payments are preserved." }, { status: 503 });
}
