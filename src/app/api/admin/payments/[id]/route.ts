import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { orderDetails, reconcileOrder } from "@/lib/fees/service";
import { db } from "@/db";
import { feeAudit } from "@/db/schema";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}) {try { return NextResponse.json(await orderDetails({adminId:adminIdentity(req)},(await params).id)); } catch(error) {return feeResponse(error);} }
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {try {
  sameOrigin(req); const adminId=adminIdentity(req); const id=(await params).id; const details=await orderDetails({adminId},id);
  await reconcileOrder(id); await db.insert(feeAudit).values({adminId,planId:details.plan.id,action:"reconcile",reason:"Administrator requested provider reconciliation",details:{orderId:id}});
  return NextResponse.json({success:true});
} catch(error) {return feeResponse(error);} }
