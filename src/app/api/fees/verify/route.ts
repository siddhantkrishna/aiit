import { NextRequest, NextResponse } from "next/server";
import { identity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { verifyCheckout } from "@/lib/fees/service";
export async function POST(req: NextRequest) {
  try { sameOrigin(req); return NextResponse.json(await verifyCheckout(identity(req),await req.json())); } catch(error) { return feeResponse(error); }
}
