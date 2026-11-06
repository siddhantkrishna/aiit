import { NextRequest, NextResponse } from "next/server";
import { identity, feeResponse, sameOrigin, adminIdentity } from "@/lib/fees/auth";
import { selectPlan } from "@/lib/fees/service";
export async function POST(req: NextRequest) {
  try { sameOrigin(req); const body=await req.json(); const who=(body.studentId || body.applicationId) ? {adminId:adminIdentity(req)} : identity(req); return NextResponse.json(await selectPlan(who,body.plan,{studentId:Number(body.studentId)||undefined,applicationId:Number(body.applicationId)||undefined})); } catch(error) { return feeResponse(error); }
}
