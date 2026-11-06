import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { offlineReceipts, offlineReceiptNotifications } from "@/db/schema";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
import { sendReceiptNotifications } from "@/lib/fees/offline-notify";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    sameOrigin(req);adminIdentity(req);
    const id=Number((await params).id);
    if (!Number.isSafeInteger(id)||id<1) throw new FeeError("Invalid receipt ID.");
    const [row]=await db.select({id:offlineReceipts.id}).from(offlineReceipts).where(eq(offlineReceipts.id,id));
    if (!row) throw new FeeError("Receipt not found.",404);
    const attempts=await sendReceiptNotifications(id);
    const notifications=await db.select({channel:offlineReceiptNotifications.channel,recipientType:offlineReceiptNotifications.recipientType,status:offlineReceiptNotifications.status}).from(offlineReceiptNotifications).where(eq(offlineReceiptNotifications.receiptId,id));
    return NextResponse.json({attempts,notifications});
  } catch(error) {return feeResponse(error);}
}
export const runtime="nodejs";
