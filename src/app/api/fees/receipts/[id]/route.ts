import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feeReceipts, feeTransactions, feeOrders } from "@/db/schema";
import { identity, feeResponse } from "@/lib/fees/auth";
import { ownedPlan } from "@/lib/fees/service";
import { FeeError } from "@/lib/fees/rules";
import { receiptPdf } from "@/lib/fees/receipt";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}) {try {
  const who=identity(req); const {id}=await params;
  const [row]=await db.select({receipt:feeReceipts,transaction:feeTransactions,order:feeOrders}).from(feeReceipts).innerJoin(feeTransactions,eq(feeTransactions.id,feeReceipts.transactionId)).innerJoin(feeOrders,eq(feeOrders.id,feeTransactions.orderId)).where(eq(feeReceipts.id,id));
  if(!row || !row.transaction.capturedAt) throw new FeeError("Verified receipt not found.",404);
  await ownedPlan(db,who,row.order.obligationId);
  const pdf=await receiptPdf(id,row.receipt.snapshot,row.transaction.refunded);
  return new NextResponse(Buffer.from(pdf),{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename=${id}.pdf`,"cache-control":"private, no-store"}});
} catch(error) {return feeResponse(error);} }
export const runtime="nodejs";
