import "regenerator-runtime/runtime";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function receiptPdf(receiptId: string, snapshot: Record<string, string | number>, refunded: number) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const latin = await document.embedFont(await readFile(path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf")), { subset: true });
  const devanagari = await document.embedFont(await readFile(path.join(process.cwd(), "public/fonts/NotoSansDevanagari-Regular.ttf")), { subset: true });
  const runs = (text: string) => (text.match(/[\u0900-\u097f]+|[^\u0900-\u097f]+/g) || []).map(text => ({ text, font: /[\u0900-\u097f]/.test(text) ? devanagari : latin }));
  const width = (text: string, size: number) => runs(text).reduce((sum, run) => sum + run.font.widthOfTextAtSize(run.text, size), 0);
  let page = document.addPage([595,842]); let y = 790;
  const ink = rgb(.06,.12,.26); const blue=rgb(.1,.3,.65);
  function line(text: string, size=11, color=ink) {
    const words = text.replace(/[\r\n\t]/g," ").split(" "); let current="";
    for(const word of words) {
      const candidate=current ? `${current} ${word}` : word;
      if(width(candidate,size)>475 && current) { draw(current,size,color);current=word; } else current=candidate;
    }
    draw(current,size,color);
  }
  function draw(text:string,size:number,color:ReturnType<typeof rgb>) {
    if(y<65) { page=document.addPage([595,842]); y=790; }
    let x = 55;
    for (const run of runs(text)) {
      page.drawText(run.text, { x, y, size, font: run.font, color });
      x += run.font.widthOfTextAtSize(run.text, size);
    }
    y-=size+13;
  }
  const money=(n:unknown)=>`INR ${(Number(n)/100).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  line("AIIT College",24,blue);
  line("Aryabhatta Institute of Information Technology",12);
  line("Gharghoda, Raigarh, Chhattisgarh, India",10);
  y-=15;line("FEE PAYMENT RECEIPT",17,blue);line(receiptId,12);y-=12;
  line(`Status: VERIFIED CAPTURE${refunded ? ` | Processed refunds: ${money(refunded)}` : ""}`,12);
  const rows=[
    ["Student / Applicant",snapshot.name],["Student ID",snapshot.studentId || "Not yet enrolled"],
    ["Application ID",snapshot.applicationId || "Not applicable"],["Course",snapshot.course],
    ["Payment date (India)",new Date(snapshot.date).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})],
    ["Payment plan",snapshot.plan === "full" ? "Full payment" : "Semester-wise"],
    ["Semester",Number(snapshot.semester) || "Full course"],["Original course fee",money(snapshot.original)],
    ["Upfront discount",money(snapshot.discount)],["Amount received",money(snapshot.amount)],
    ["Payment method",snapshot.method],["Razorpay payment ID",snapshot.paymentId],
    ["Remaining fee at issuance",money(snapshot.remaining)],
  ];
  for(const [label,value] of rows) line(`${label}: ${String(value)}`);
  y-=15;line("Generated from a verified captured payment. No signature is required.",9);
  line("This receipt records the original collection. Refunds above reflect the current verified status.",9);
  line("For fee queries: info@aiitcollege.edu.in | +91 97700 55880",9);
  return document.save();
}
