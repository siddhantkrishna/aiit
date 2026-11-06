import { NextRequest, NextResponse } from "next/server";
import { identity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { orderDetails, reconcileOrder } from "@/lib/fees/service";
export async function POST(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  try { sameOrigin(req); const who=identity(req); const {id}=await params;
    await orderDetails(who,id); await reconcileOrder(id); return NextResponse.json({success:true});
  } catch(error) { return feeResponse(error); }
}
