import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, feeResponse } from "@/lib/fees/auth";
export async function POST(req: NextRequest) {
  try { sameOrigin(req); const response = NextResponse.json({ success: true });
    for (const cookie of ["applicant_fee_token", "student_token"]) response.cookies.set(cookie,"",{ httpOnly:true, secure:process.env.NODE_ENV === "production",sameSite:"strict",path:"/",maxAge:0 });
    return response;
  } catch(error) { return feeResponse(error); }
}
