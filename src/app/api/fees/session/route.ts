import { NextRequest, NextResponse } from "next/server";
import { applicantCookie, recoverApplicant, feeResponse, sameOrigin } from "@/lib/fees/auth";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req); const body = await req.json();
    const id = await recoverApplicant(String(body.applicationId || "").trim(), String(body.recoveryCode || "").trim());
    const response = NextResponse.json({ success: true }); applicantCookie(response, id); return response;
  } catch (error) { return feeResponse(error); }
}
