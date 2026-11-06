import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { feeOrders, feeObligations } from "@/db/schema";
import { identity, feeResponse } from "@/lib/fees/auth";
import { owner, findPlan } from "@/lib/fees/service";
export async function GET(req:NextRequest) {try {
  const person=await owner(db,identity(req));const plan=await findPlan(db,person);
  if(!plan) return NextResponse.json([]);
  const orders=await db.select({id:feeOrders.id}).from(feeOrders).innerJoin(feeObligations,eq(feeObligations.id,feeOrders.obligationId)).where(and(eq(feeObligations.planId,plan.id)));
  return NextResponse.json(orders);
} catch(error) {return feeResponse(error);} }
