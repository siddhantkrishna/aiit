import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
import { offlineList, recordOfflinePayment } from "@/lib/fees/offline";
import { sendReceiptNotifications } from "@/lib/fees/offline-notify";
export async function GET(req:NextRequest) {
  try {
    adminIdentity(req);
    return NextResponse.json(await offlineList(req.nextUrl.searchParams.get("search") || ""));
  } catch(error) { return feeResponse(error); }
}
export async function POST(req:NextRequest) {
  try {
    sameOrigin(req);
    const adminId=adminIdentity(req);
    const body=await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new FeeError("Invalid receipt submission.");
    const result=await recordOfflinePayment(adminId,body);
    const notifications=result.duplicate ? [] : await sendReceiptNotifications(result.receipt.id).catch(() => [{channel:"SYSTEM",recipient:"ALL",status:"failed"}]);
    return NextResponse.json({success:true,duplicate:result.duplicate,receipt:result.receipt,notifications},{status:result.duplicate ? 200 : 201});
  } catch(error) {
    const cause=error instanceof Error && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return feeResponse(new FeeError("This payment reference or submission has already been recorded.",409));
    return feeResponse(error);
  }
}
export const runtime="nodejs";
export const dynamic="force-dynamic";
