import http from "node:http";
import { Server as SocketServer } from "socket.io";
import { createApp } from "./app.js";
import { getDbStatus } from "./config/db.js";
import { env, hasProdSecretsIssue } from "./config/env.js";
import { getAiCapabilities } from "./services/ai/aiGateway.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";

if (hasProdSecretsIssue()) {
  console.error("[FATAL] Production mode requires non-default JWT_SECRET and JWT_REFRESH_SECRET.");
  process.exit(1);
}

const app = createApp();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: [env.clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  },
});

registerSocketHandlers(io);

server.listen(env.port, async () => {
  const db = await getDbStatus();
  const ai = getAiCapabilities();
  console.log(`[AI Arena Server] Listening on http://localhost:${env.port}`);
  console.log(`[AI Arena DB] ${db.status}: ${db.message}`);
  console.log(
    `[AI Arena AI] Groq=${ai.groqConfigured ? "ready" : "unconfigured"} | Gemini=${ai.geminiConfigured ? "ready" : "unconfigured"}`,
  );
});
