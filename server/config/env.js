import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  pgHost: process.env.PGHOST || "",
  pgPort: Number(process.env.PGPORT || 5432),
  pgDatabase: process.env.PGDATABASE || "ai_arena_db",
  pgUser: process.env.PGUSER || "postgres",
  pgPassword: process.env.PGPASSWORD || "",
  jwtSecret: process.env.JWT_SECRET || "dev-only-jwt-secret-change-in-prod",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-only-refresh-secret-change-in-prod",
  accessTtl: process.env.JWT_ACCESS_TTL || "15m",
  refreshTtlDays: Number(process.env.JWT_REFRESH_DAYS || 14),
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  groqWhisperModel: process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  aiDailyQuotaPerUser: Number(process.env.AI_DAILY_QUOTA_PER_USER || 60),
  multiplayerEnabled: process.env.MULTIPLAYER_ENABLED !== "false",
};

export function hasProdSecretsIssue() {
  if (env.nodeEnv !== "production") return false;
  return (
    env.jwtSecret.includes("dev-only") ||
    env.jwtRefreshSecret.includes("dev-only")
  );
}
