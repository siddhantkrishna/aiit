import { db } from "./index";
import { admin } from "./schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password || password.length < 16 || Buffer.byteLength(password, "utf8") > 72) throw new Error("Initial admin credentials must be provided securely (password: at least 16 characters).");
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(admin).values({ email, password: passwordHash, name: "Admin" }).onConflictDoNothing({ target: admin.email });
}
