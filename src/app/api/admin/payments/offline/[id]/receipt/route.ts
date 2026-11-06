import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { offlineReceipts } from "@/db/schema";
import { adminIdentity, feeResponse } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
import { offlineReceiptPdf } from "@/lib/fees/offline-pdf";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    adminIdentity(req);
    const id=Number((await params).id);
    if(!Number.isSafeInteger(id)||id<1) throw new FeeError("Invalid offline receipt ID.");
    const [receipt]=await db.select().from(offlineReceipts).where(eq(offlineReceipts.id,id));
    if(!receipt) throw new FeeError("Receipt not found.",404);
    const bytes=await offlineReceiptPdf(receipt);
    return new NextResponse(Buffer.from(bytes),{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename="${receipt.receiptNo}.pdf"`,"cache-control":"private,no-store"}});
  } catch(error){return feeResponse(error);}
}
export const runtime="nodejs";
