import express from "express";
import cookieParser from "cookie-parser";
import { getDbStatus } from "./config/db.js";
import { env } from "./config/env.js";
import { csrfProtection } from "./middleware/csrf.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, securityMiddleware } from "./middleware/security.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import passportRoutes from "./routes/passportRoutes.js";
import { getAiCapabilities } from "./services/ai/aiGateway.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(securityMiddleware());
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter, csrfProtection);

  app.get("/api/health", async (_req, res) => {
    const db = await getDbStatus();
    const ai = getAiCapabilities();
    return res.json({
      ok: true,
      service: "ai-arena-server",
      db,
      ai,
      multiplayer: env.multiplayerEnabled,
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/game", gameRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/passport", passportRoutes);
  app.use("/api/admin", adminRoutes);

  app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
  app.use(errorHandler);

  return app;
}
