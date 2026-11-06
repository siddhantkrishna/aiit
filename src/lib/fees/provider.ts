import Razorpay from "razorpay";
import { FeeError } from "./rules";

export function gateway() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret || !/^rzp_(test|live)_/.test(key)) throw new FeeError("Online checkout is not configured. Your application is saved; please try later.", 503);
  if (key.startsWith("rzp_live_") && process.env.RAZORPAY_LIVE_ENABLED !== "true") throw new FeeError("Live checkout awaits test-mode sign-off.", 503);
  return new Razorpay({ key_id: key, key_secret: secret });
}
