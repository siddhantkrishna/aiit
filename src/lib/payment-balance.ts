import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";

// Use integer paise for calculations; PostgreSQL numeric remains the stored format.
export function paise(amount: string) {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(amount)) throw new Error("Invalid monetary amount");
  const [whole, fraction = ""] = amount.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function rupees(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid balance");
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}
export async function adjustBalance(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], studentId: number, delta: number) {
  const [student] = await tx.select().from(students).where(eq(students.id, studentId)).for("update");
  if (!student) throw new Error("Student not found");
  const paid = paise(student.amountPaid || "0") + delta;
  if (paid < 0) throw new Error("Existing balance requires reconciliation before reversing this payment");
  const pending = Math.max(0, paise(student.totalFee || "0") - paid);
  await tx.update(students).set({ amountPaid: rupees(paid), amountPending: rupees(pending), paymentStatus: pending === 0 ? "PAID" : "PENDING", updatedAt: new Date() }).where(eq(students.id, studentId));
}
