import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../server/package.json", import.meta.url));
const dotenv = require("dotenv");
const { Pool } = require("pg");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runMigrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString && !process.env.PGHOST) {
    console.error("[migrate] Neither DATABASE_URL nor PGHOST is configured. Check .env or DATABASE_SETUP.md.");
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
    const schemaPath = path.join(__dirname, "schema.sql");
    const sql = await fs.readFile(schemaPath, "utf8");
    await pool.query(sql);
    console.log("[migrate] PostgreSQL schema applied successfully.");
  } catch (err) {
    console.error("[migrate] Failed to apply schema:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrate();
