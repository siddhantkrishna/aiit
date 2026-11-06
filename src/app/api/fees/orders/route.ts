import { NextRequest, NextResponse } from "next/server";
import { identity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { createOrder } from "@/lib/fees/service";
import { FeeError } from "@/lib/fees/rules";
export async function POST(req: NextRequest) {
  try { sameOrigin(req); const who=identity(req); const body=await req.json();
    if(!Number.isSafeInteger(body.obligationId)) throw new FeeError("Select a fee obligation.");
    return NextResponse.json(await createOrder(who,body.obligationId));
  } catch(error) { return feeResponse(error); }
}
