import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { offlineReceipts, offlineReceiptNotifications } from "@/db/schema";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char] || char));
}
export async function sendReceiptNotifications(receiptId: number) {
  const [receipt] = await db.select().from(offlineReceipts).where(eq(offlineReceipts.id,receiptId));
  if (!receipt) return [];
  const entries=await db.select().from(offlineReceiptNotifications).where(eq(offlineReceiptNotifications.receiptId,receiptId));
  const results=[];
  for (const entry of entries) {
    if (!["queued","failed","unconfigured"].includes(entry.status)) continue;
    const emailReady=!!(process.env.RESEND_API_KEY && process.env.AIIT_RECEIPT_FROM_EMAIL);
    const smsReady=!!(process.env.MSG91_AUTH_KEY && process.env.MSG91_RECEIPT_TEMPLATE_ID);
    if ((entry.channel === "EMAIL" && !emailReady) || (entry.channel === "SMS" && !smsReady)) {
      await db.update(offlineReceiptNotifications).set({status:"unconfigured",lastError:"Provider configuration is missing",updatedAt:new Date()}).where(eq(offlineReceiptNotifications.id,entry.id));
      results.push({channel:entry.channel,recipient:entry.recipientType,status:"unconfigured"});continue;
    }
    const [claimed] = await db.update(offlineReceiptNotifications).set({status:"sending",attempts:entry.attempts+1,lastError:null,updatedAt:new Date()}).where(and(eq(offlineReceiptNotifications.id,entry.id),or(eq(offlineReceiptNotifications.status,"queued"),eq(offlineReceiptNotifications.status,"failed"),eq(offlineReceiptNotifications.status,"unconfigured")))).returning();
    if (!claimed) continue;
    const rupees=(receipt.amountPaise/100).toFixed(2);
    const note=`AIIT College has recorded INR ${rupees} received for ${receipt.studentName}. Receipt: ${receipt.receiptNo}. For queries, contact AIIT College.`;
    try {
      let providerReference="";
      if (entry.channel === "EMAIL") {
        const response=await fetch("https://api.resend.com/emails", {
          method:"POST",
          headers:{"Authorization":`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},
          body:JSON.stringify({
            from:process.env.AIIT_RECEIPT_FROM_EMAIL,
            to:[entry.destination],
            subject:`AIIT fee collection confirmation ${receipt.receiptNo}`,
            html:`<p>${escapeHtml(note)}</p><p>Payment method: ${escapeHtml(receipt.paymentMethod)}.</p><p>Keep this receipt number for your records. This confirmation records an offline collection, not a Razorpay payment.</p>`
          }), signal:AbortSignal.timeout(8000)
        });
        if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
        const data=await response.json();
        providerReference=String(data.id||"");
      } else {
        const response=await fetch("https://control.msg91.com/api/v5/flow", {
          method:"POST",
          headers:{"authkey":process.env.MSG91_AUTH_KEY!,"Content-Type":"application/json","accept":"application/json"},
          body:JSON.stringify({
            template_id:process.env.MSG91_RECEIPT_TEMPLATE_ID,
            short_url:"0",
            recipients:[{
              mobiles:`91${entry.destination}`,
              VAR1:receipt.receiptNo,VAR2:rupees,VAR3:receipt.studentName.slice(0,40),
            }]
          }), signal:AbortSignal.timeout(8000)
        });
        if (!response.ok) throw new Error(`SMS provider returned HTTP ${response.status}`);
        const data=await response.json();
        if (data.type !== "success") throw new Error("SMS provider did not accept the message");
        providerReference=String(data.message||"");
      }
      await db.update(offlineReceiptNotifications).set({status:"accepted",providerReference,lastError:null,updatedAt:new Date()}).where(eq(offlineReceiptNotifications.id,entry.id));
      results.push({channel:entry.channel,recipient:entry.recipientType,status:"accepted"});
    } catch {
      await db.update(offlineReceiptNotifications).set({status:"failed",lastError:"Delivery provider could not accept the request",updatedAt:new Date()}).where(eq(offlineReceiptNotifications.id,entry.id));
      results.push({channel:entry.channel,recipient:entry.recipientType,status:"failed"});
    }
  }
  return results;
}
