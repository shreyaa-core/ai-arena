import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../server/package.json", import.meta.url));
const dotenv = require("dotenv");
const { Pool } = require("pg");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString && !process.env.PGHOST) {
    console.error("[seed] Neither DATABASE_URL nor PGHOST is configured. Check .env or DATABASE_SETUP.md.");
    process.exitCode = 1;
    return;
  }

  const pool = new Pool(
    connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST || "localhost",
          port: Number(process.env.PGPORT || 5432),
          database: process.env.PGDATABASE || "ai_arena_db",
          user: process.env.PGUSER || "postgres",
          password: process.env.PGPASSWORD || "",
        },
  );

  try {
    const seedPath = path.join(__dirname, "seeds", "seed.sql");
    const sql = await fs.readFile(seedPath, "utf8");
    await pool.query(sql);
    console.log("[seed] Seed data inserted/updated cleanly.");
  } catch (err) {
    console.error("[seed] Failed to apply seed data:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSeed();
