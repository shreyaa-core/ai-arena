import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "../../server/app.js";
import { signAccessToken } from "../../server/middleware/auth.js";

describe("Express app health, auth guards, and RBAC (mocked/local HTTP)", () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("reports health status honestly including DB and AI readiness", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.service, "ai-arena-server");
    assert.ok(body.db && typeof body.db.status === "string");
    assert.ok(body.ai && typeof body.ai.groqConfigured === "boolean");
  });

  it("rejects unauthenticated access to protected player endpoints with 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  it("enforces admin/educator RBAC on /api/admin/analytics", async () => {
    const playerToken = signAccessToken({ id: "u-1", email: "p@example.com", role: "player" });
    const res = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    assert.equal(res.status, 403);
  });

  it("returns 503 unavailable when Groq AI key is absent rather than faking AI responses", async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Help me write a clearer prompt", language: "en" }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.status, "unavailable");
    assert.equal(body.configured, false);
  });
});
