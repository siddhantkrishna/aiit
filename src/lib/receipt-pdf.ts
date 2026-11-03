// shortcut: receipts use ASCII identifiers and INR, embed a Unicode font when multilingual receipt text is required.
export function receiptPdf(receipt: { receiptId: string; paymentDate: string; amount: string; paymentMode: string | null; referenceNumber: string | null; studentCode: string; centre: string | null }) {
  const escape = (value: string) => value.replace(/[^\x20-\x7e]/g, " ").replace(/[\\()]/g, "\\$&");
  const lines = ["AIIT College", "Verified Payment Receipt", "", `Receipt: ${receipt.receiptId}`, `Date: ${receipt.paymentDate}`, `Student / application: ${receipt.studentCode}`,
    `Centre: ${receipt.centre || "AIIT"}`, `Amount: INR ${receipt.amount}`, `Mode: ${receipt.paymentMode || "-"}`, `Transaction reference: ${receipt.referenceNumber || "-"}`, "", "Verified manually by AIIT administration.", "This receipt acknowledges only the payment stated above."];
  const stream = `BT /F1 12 Tf 50 790 Td 24 TL ${lines.flatMap(line => line.match(/.{1,80}/g) || [""]).map((line, i) => `${i ? "T* " : ""}(${escape(line)}) Tj`).join("\n")} ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
