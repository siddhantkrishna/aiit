import { createHash } from "node:crypto";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { feeOrders, feeWebhooks } from "@/db/schema";
import { FeeError, signatureValid } from "./rules";
import { reconcileOrder } from "./service";
import { gateway } from "./provider";

const events = new Set(["payment.authorized", "payment.captured", "payment.failed", "order.paid", "refund.created", "refund.processed", "refund.failed"]);
export async function processWebhook(raw: string, signature: string | null, eventId: string | null) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) throw new FeeError("Webhook configuration unavailable.", 503);
  if (!signatureValid(raw, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) throw new FeeError("Invalid webhook signature.", 400);
  if (!eventId || eventId.length > 255) throw new FeeError("Missing webhook event identifier.");
  let body;
  try { body = JSON.parse(raw); } catch { throw new FeeError("Invalid webhook body."); }
  const hash = createHash("sha256").update(raw).digest("hex");
  if (typeof body.event !== "string") throw new FeeError("Missing webhook event.");
  await db.insert(feeWebhooks).values({ eventId, bodyHash: hash, event: body.event, status: "received" }).onConflictDoNothing();
  return db.transaction(async tx => {
    const [event] = await tx.select().from(feeWebhooks).where(or(eq(feeWebhooks.eventId, eventId), eq(feeWebhooks.bodyHash, hash))).for("update");
    if (event.bodyHash !== hash) throw new FeeError("Webhook identifier conflicts with another body.", 409);
    if (["processed", "ignored"].includes(event.status)) return { duplicate: true };
    if (!events.has(body.event)) {
      await tx.update(feeWebhooks).set({ status: "ignored", processedAt: new Date() }).where(eq(feeWebhooks.eventId, event.eventId));
      return { ignored: true };
    }
    try {
      let remoteId = body.payload?.payment?.entity?.order_id || body.payload?.order?.entity?.id;
      if (!remoteId && body.payload?.refund?.entity?.payment_id) {
        const payment = await gateway().payments.fetch(body.payload.refund.entity.payment_id);
        remoteId = payment.order_id;
      }
      let [order] = remoteId ? await tx.select().from(feeOrders).where(eq(feeOrders.razorpayOrderId, remoteId)) : [];
      if (!order && typeof remoteId === "string") {
        const remote = await gateway().orders.fetch(remoteId);
        [order] = await tx.select().from(feeOrders).where(eq(feeOrders.id, remote.receipt || ""));
      }
      if (order) await reconcileOrder(order.id);
      await tx.update(feeWebhooks).set({ orderId: order?.id || null, status: order ? "processed" : "ignored", processedAt: new Date(), attempts: sql`${feeWebhooks.attempts} + 1` }).where(eq(feeWebhooks.eventId, event.eventId));
      return { success: true };
    } catch {
      await tx.update(feeWebhooks).set({ status: "failed", attempts: sql`${feeWebhooks.attempts} + 1` }).where(eq(feeWebhooks.eventId, event.eventId));
      return { failed: true };
    }
  });
}
