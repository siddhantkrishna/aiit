import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse } from "@/lib/fees/auth";
import { feeReport } from "@/lib/fees/report";
import { csvCell, validDate, FeeError } from "@/lib/fees/rules";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc } from "drizzle-orm";
export async function GET(req:NextRequest) {
  try {
    adminIdentity(req); const params=req.nextUrl.searchParams;
    if(params.get("legacy")==="true") return NextResponse.json(await db.select().from(payments).orderBy(desc(payments.createdAt)));
    for (const key of ["from", "to"]) if (params.get(key) && !validDate(params.get(key))) throw new FeeError("Use a valid date range.");
    if (params.get("from") && params.get("to") && params.get("from")! > params.get("to")!) throw new FeeError("The end date must follow the start date.");
    if (params.get("semester") && !/^(?:[0-9]|1[0-9]|2[0-4])$/.test(params.get("semester")!)) throw new FeeError("Select a valid semester.");
    const report=await feeReport(params);
    if(params.get("export")==="csv") {
      const keys=["id","receiptId","name","studentRef","applicationRef","course","plan","semester","amount","discount","refunded","method","status","razorpayOrderId","razorpayPaymentId","date"] as const;
      const csv=[keys.map(csvCell).join(","),...report.rows.map(row=>keys.map(k=>csvCell(row[k])).join(","))].join("\r\n");
      return new NextResponse("\uFEFF"+csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=aiit-fees-paise.csv","cache-control":"no-store"}});
    }
    const page=Math.max(1,Number(params.get("page"))||1);
    return NextResponse.json({...report,rows:report.rows.slice((page-1)*100,page*100),total:report.rows.length,page});
  } catch(error) {return feeResponse(error);}
}
export const dynamic="force-dynamic";
