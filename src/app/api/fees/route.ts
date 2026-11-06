import { NextRequest, NextResponse } from "next/server";
import { identity, feeResponse } from "@/lib/fees/auth";
import { portal } from "@/lib/fees/service";
export async function GET(req: NextRequest) {
  try { return NextResponse.json(await portal(identity(req), { studentId: Number(req.nextUrl.searchParams.get("studentId")) || undefined, applicationId: Number(req.nextUrl.searchParams.get("applicationId")) || undefined })); } catch (error) { return feeResponse(error); }
}
export const dynamic = "force-dynamic";
