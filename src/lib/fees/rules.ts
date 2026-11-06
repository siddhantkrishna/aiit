import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export class FeeError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function paise(value: unknown): number {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new FeeError("Enter a positive fee in rupees, with at most two decimal places.");
  const [rupees, fraction = ""] = value.trim().split(".");
  const amount = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000_000) throw new FeeError("Fee must be between INR 0.01 and INR 10,000,000.");
  return amount;
}
export function fullFee(original: number) {
  // Round final payable half-up to the nearest paise; discount is the remainder.
  const payable = Math.floor((original * 90 + 50) / 100);
  if (payable < 100) throw new FeeError("Payable must be at least INR 1.");
  return { payable, discount: original - payable };
}
export function indiaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validateSchedule(total: number, semesters: number, schedule: Array<{ semester: number; amount: number; dueDate: string }>) {
  if (!Number.isInteger(semesters) || semesters < 1 || semesters > 24 || schedule.length !== semesters) throw new FeeError("Configure 1–24 semesters with one installment per semester.");
  let sum = 0;
  schedule.forEach((item, i) => {
    if (item.semester !== i + 1 || !Number.isInteger(item.amount) || item.amount < 100 || !validDate(item.dueDate)) throw new FeeError("Each semester needs an amount of at least INR 1 and a valid due date.");
    if (i && item.dueDate < schedule[i - 1].dueDate) throw new FeeError("Semester due dates must be in chronological order.");
    sum += item.amount;
  });
  if (sum !== total) throw new FeeError("Semester amounts must equal the original course fee exactly.");
}
export function signatureValid(body: string, signature: string | null, secret: string | undefined) {
  if (!secret || !signature || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function recoveryHash(code: string) { return createHash("sha256").update(code).digest("hex"); }
export function netPaid(transactions: Array<{ capturedAt: Date | string | null; amount: number; refunded: number }>) {
  return transactions.reduce((sum, t) => sum + (t.capturedAt ? t.amount - t.refunded : 0), 0);
}
export function obligationState(amount: number, paid: number, dueDate: string, today = indiaDate()) {
  return paid >= amount ? "Paid" : dueDate < today ? "Overdue" : dueDate === today ? "Due" : "Upcoming";
}
export function mayAccess(owner: { applicationId: number | null; studentId: number | null }, identity: { applicationId?: number; studentId?: number; adminId?: number }) {
  return !!identity.adminId || (!!identity.studentId && owner.studentId === identity.studentId) || (!!identity.applicationId && owner.applicationId === identity.applicationId);
}
export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  return `"${(/^(?:\s*[=+\-@]|[\t\r])/.test(raw) ? "'" : "") + raw.replace(/"/g, '""')}"`;
}
