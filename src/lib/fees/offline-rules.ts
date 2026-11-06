import { FeeError, paise } from "./rules";
const value = (input: unknown) => String(input ?? "").trim();
export const mobile = (input: unknown) => { const digits=value(input).replace(/\D/g, ""); return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits; };
const email = (input: unknown) => value(input).toLowerCase();
export const validEmail = (input: string) => !input || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
export const validMobile = (input: string) => /^[6-9]\d{9}$/.test(input);
const methods = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"];
const relations = ["SELF", "FATHER", "MOTHER", "PARENT", "GUARDIAN", "FRIEND", "OTHER"];
export function validateOfflineInput(body: Record<string, unknown>) {
  const payerName = value(body.payerName);
  const payerMobile = mobile(body.payerMobile);
  const payerEmail = email(body.payerEmail);
  const method = value(body.paymentMethod).toUpperCase();
  const relation = value(body.payerRelation).toUpperCase();
  const purposeType = value(body.purposeType).toUpperCase();
  const purposeName = value(body.purposeName);
  const paymentReference = value(body.paymentReference);
  const notes = value(body.notes);
  const amountPaise = paise(body.amount);
  const receiverStaffId = Number(body.receiverStaffId);
  const applicationId = body.applicationId ? Number(body.applicationId) : undefined;
  const studentId = body.studentId ? Number(body.studentId) : undefined;
  const obligationId = body.obligationId ? Number(body.obligationId) : undefined;
  if ((!!studentId) === (!!applicationId)) throw new FeeError("Select exactly one student or application.");
  for (const number of [receiverStaffId, studentId, applicationId].filter(n => n !== undefined)) {
    if (!Number.isSafeInteger(number) || number < 1) throw new FeeError("Invalid staff or student reference.");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value(body.requestKey))) throw new FeeError("Invalid submission token. Refresh the page and retry.");
  if (payerName.length < 2 || payerName.length > 255 || !validMobile(payerMobile) || !validEmail(payerEmail)) throw new FeeError("Enter payer name, valid Indian mobile number and optional valid email.");
  if (!methods.includes(method) || !relations.includes(relation)) throw new FeeError("Choose a valid payer relationship and payment method.");
  if (!["TUITION","SERVICE"].includes(purposeType) || !purposeName || purposeName.length > 255) throw new FeeError("Enter the valid collection purpose.");
  if (purposeType === "TUITION" && (!Number.isSafeInteger(obligationId) || !obligationId || obligationId < 1)) throw new FeeError("Select a valid unpaid semester obligation.");
  if (method !== "CASH" && paymentReference.length < 5) throw new FeeError("Enter the bank/UPI/cheque transaction reference.");
  if (paymentReference.length > 255 || [body.receiverFatherName,body.receiverMotherName].some(v => value(v).length > 255)) throw new FeeError("Reference and parent-name fields must be under 256 characters.");
  if (notes.length < 10 || notes.length > 2000) throw new FeeError("Record at least 10 characters of receiving evidence and notes.");
  if (body.physicallyReceived !== true) throw new FeeError("Confirm the institution has actually received the money.");
  if (body.notifyContacts !== true) throw new FeeError("Confirm the contact details were checked and notifications are permitted.");
  return { payerName, payerMobile, payerEmail: payerEmail || null, method, relation, purposeType, purposeName, paymentReference: paymentReference || null, notes, amountPaise, receiverStaffId, applicationId, studentId, obligationId, requestKey: value(body.requestKey), receiverFatherName: value(body.receiverFatherName) || null, receiverMotherName: value(body.receiverMotherName) || null };
}
