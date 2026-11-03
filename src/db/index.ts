import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Enforce certificate verification even when the URL contains sslmode=require.
const connectionUrl = new URL(databaseUrl);
for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) connectionUrl.searchParams.delete(key);
export const pool = new Pool({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, "\n") } : {}) },
  connectionTimeoutMillis: 10000,
  max: 5,
});

export const db = drizzle(pool);