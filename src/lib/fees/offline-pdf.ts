import "regenerator-runtime/runtime";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { offlineReceipts } from "@/db/schema";

type Receipt = typeof offlineReceipts.$inferSelect;
export async function offlineReceiptPdf(record: Receipt) {
  const pdf=await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const latin=await pdf.embedFont(await readFile(path.join(process.cwd(),"public/fonts/NotoSans-Regular.ttf")),{subset:true});
  const hindi=await pdf.embedFont(await readFile(path.join(process.cwd(),"public/fonts/NotoSansDevanagari-Regular.ttf")),{subset:true});
  let page=pdf.addPage([595,842]),y=789;
  const ink=rgb(.09,.14,.25),blue=rgb(.12,.29,.62);
  const runs=(text:string)=>(text.match(/[\u0900-\u097f]+|[^\u0900-\u097f]+/g)||[]).map(t=>({text:t,font:/[\u0900-\u097f]/.test(t)?hindi:latin}));
  const lineWidth=(text:string,size:number)=>runs(text).reduce((n,r)=>n+r.font.widthOfTextAtSize(r.text,size),0);
  function draw(text:string,size=10,color=ink){
    if(y<70){page=pdf.addPage([595,842]);y=789;}
    let x=45;for(const r of runs(text)){page.drawText(r.text,{x,y,font:r.font,size,color});x+=r.font.widthOfTextAtSize(r.text,size);}
    y-=size+11;
  }
  function field(label:string,value:unknown) {
    const text=`${label}: ${String(value??"—").replace(/[\r\n\t]/g," ")}`,words=text.split(" ");let chunk="";
    for(const word of words){const next=chunk?`${chunk} ${word}`:word;if(lineWidth(next,10)>490 && chunk){draw(chunk);chunk=word;}else chunk=next;}
    if(chunk)draw(chunk);
  }
  const date=new Date(record.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"long",timeStyle:"short"});
  const amount=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(record.amountPaise/100);
  draw("AIIT COLLEGE",20,blue);
  draw("Aryabhatta Institute of Information Technology",11);
  draw("OFFLINE PAYMENT RECEIPT",15,blue);
  field("Receipt number",record.receiptNo);
  field("Date received (India)",date);
  field("Status","Received and entered by authorized administrator");
  field("Amount received",amount);
  field("Method",record.paymentMethod);
  field("Bank/UPI/Cheque reference",record.paymentReference||"Cash");
  field("Purpose",record.purposeType==="TUITION"?"Course fee":"Other institutional service / work");
  field("Description",record.purposeName);
  field("Student / Applicant",record.studentName);
  field("Father",record.fatherName);
  field("Mother",record.motherName);
  field("Student mobile",record.studentMobile);
  field("Student email",record.studentEmail);
  field("Payer",record.payerName);
  field("Relationship",record.payerRelation);
  field("Payer mobile",record.payerMobile);
  field("Payer email",record.payerEmail);
  field("Received by",record.receiverName);
  field("Receiver position",record.receiverRole);
  field("Receiver department",record.receiverDepartment);
  field("Receiver mobile",record.receiverMobile);
  field("Receiver email",record.receiverEmail);
  field("Receiver father",record.receiverFatherName);
  field("Receiver mother",record.receiverMotherName);
  field("Recorded by administrator",record.recordedByAdminId);
  field("Fee ledger reference",record.feeCreditId||"Not a tuition ledger credit");
  field("Remarks",record.notes);
  y-=10;
  draw("This receipt documents an OFFLINE collection, not a Razorpay payment.",9);
  draw("Receiver identification is based on staff and admin records; biometric Face ID is not enabled.",9);
  draw("For corrections, contact AIIT College accounts. Do not alter this issued receipt.",9);
  return pdf.save();
}
