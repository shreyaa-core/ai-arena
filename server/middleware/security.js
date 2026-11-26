import cors from "cors";
import helmet from "helmet";
import { env } from "../config/env.js";

export function securityMiddleware() {
  return [
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const allowed = [env.clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"];
        if (allowed.includes(origin)) return cb(null, true);
        return cb(null, env.nodeEnv !== "production");
      },
      credentials: true,
    }),
  ];
}

export function errorHandler(err, _req, res, _next) {
  if (err?.code === "DB_UNCONFIGURED") {
    return res.status(503).json({
      error: "Database unavailable",
      code: "DB_UNCONFIGURED",
      message: "PostgreSQL is not configured on this server. Continue in Guest Mode or check DATABASE_SETUP.md.",
    });
  }
  const status = err?.statusCode || err?.status || 500;
  const payload = {
    error: status >= 500 ? "Internal server error" : err.message || "Request error",
  };
  if (env.nodeEnv !== "production" && err?.message && status >= 500) {
    payload.detail = err.message;
  }
  return res.status(status).json(payload);
}
