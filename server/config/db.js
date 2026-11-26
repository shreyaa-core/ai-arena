import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let pool = null;
let lastError = null;

export function isDbConfigured() {
  return Boolean(env.databaseUrl || env.pgHost);
}

export function getPool() {
  if (!isDbConfigured()) return null;
  if (!pool) {
    pool = new Pool(
      env.databaseUrl
        ? { connectionString: env.databaseUrl }
        : {
            host: env.pgHost,
            port: env.pgPort,
            database: env.pgDatabase,
            user: env.pgUser,
            password: env.pgPassword,
          },
    );
    pool.on("error", (err) => {
      lastError = err.message;
    });
  }
  return pool;
}

export async function getDbStatus() {
  if (!isDbConfigured()) {
    return {
      configured: false,
      status: "unconfigured",
      message: "DATABASE_URL / PGHOST not configured. Guest local play remains active; see DATABASE_SETUP.md.",
    };
  }
  try {
    const p = getPool();
    await p.query("SELECT 1");
    lastError = null;
    return { configured: true, status: "connected", message: "PostgreSQL connected" };
  } catch (err) {
    lastError = err.message;
    return {
      configured: true,
      status: "error",
      message: `PostgreSQL connection failed: ${err.message}`,
    };
  }
}

export async function query(text, params = [], customPool = null) {
  const activePool = customPool || getPool();
  if (!activePool) {
    const err = new Error("PostgreSQL is not configured.");
    err.code = "DB_UNCONFIGURED";
    throw err;
  }
  return activePool.query(text, params);
}

export async function withTransaction(fn, customPool = null) {
  const activePool = customPool || getPool();
  if (!activePool) {
    const err = new Error("PostgreSQL is not configured.");
    err.code = "DB_UNCONFIGURED";
    throw err;
  }
  const client = await activePool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors after broken connection
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export function getLastDbError() {
  return lastError;
}
