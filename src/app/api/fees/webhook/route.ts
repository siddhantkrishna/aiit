import { NextRequest, NextResponse } from "next/server";
import { feeResponse } from "@/lib/fees/auth";
import { processWebhook } from "@/lib/fees/webhook";
export async function POST(req: NextRequest) {
  try {
    const raw=await req.text();
    if(Buffer.byteLength(raw)>1048576) return NextResponse.json({error:"Webhook too large."},{status:413});
    const result=await processWebhook(raw,req.headers.get("x-razorpay-signature"),req.headers.get("x-razorpay-event-id"));
    return NextResponse.json(result,{status:result.failed?503:200});
  } catch(error) { return feeResponse(error); }
}
export const runtime="nodejs";
