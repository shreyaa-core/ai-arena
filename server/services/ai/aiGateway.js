import { isDbConfigured, query } from "../../config/db.js";
import { env } from "../../config/env.js";
import { callGeminiMultimodal, isGeminiConfigured } from "./geminiAdapter.js";
import { callGroqChat, callGroqWhisper, isGroqConfigured } from "./groqAdapter.js";

const dailyCounters = new Map();
const responseCache = new Map();
const MAX_CACHE = 100;

export function sanitizeForPrompt(text) {
  if (!text) return "";
  return String(text)
    .replaceAll(/```/g, "'''")
    .replace(/\b(ignore previous instructions|disregard system prompt|reveal api key)\b/gi, "[filtered-instruction]")
    .slice(0, 4000);
}

function quotaKey(actorKey) {
  const day = new Date().toISOString().slice(0, 10);
  return `${actorKey}:${day}`;
}

export function checkAndIncrementMemoryQuota(actorKey) {
  const k = quotaKey(actorKey);
  const current = dailyCounters.get(k) || 0;
  if (current >= env.aiDailyQuotaPerUser) {
    return { allowed: false, remaining: 0 };
  }
  dailyCounters.set(k, current + 1);
  return { allowed: true, remaining: env.aiDailyQuotaPerUser - current - 1 };
}

export async function logAiUsage({ userId = null, provider, endpoint, modelName, promptTokens = 0, completionTokens = 0, latencyMs = 0, status = "ok" }) {
  if (!isDbConfigured()) return;
  try {
    await query(
      `INSERT INTO ai_usage_logs (user_id, provider, endpoint, model_name, prompt_tokens, completion_tokens, latency_ms, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, provider, endpoint, modelName, promptTokens, completionTokens, latencyMs, status],
    );
  } catch {
    // Logging should never crash user AI flow
  }
}

export function getAiCapabilities() {
  return {
    groqConfigured: isGroqConfigured(),
    geminiConfigured: isGeminiConfigured(),
    whisperConfigured: isGroqConfigured(),
    liveModeAvailable: isGroqConfigured() || isGeminiConfigured(),
    dailyQuota: env.aiDailyQuotaPerUser,
  };
}

export async function executeChat({ actorKey, userId = null, messages, temperature = 0.4, maxTokens = 450, cacheKey = null, fetchImpl = fetch }) {
  if (!isGroqConfigured()) {
    return {
      ok: false,
      configured: false,
      status: "unavailable",
      message: "Groq API key is not configured on this server. Simulation mode and curated offline guidance remain active.",
    };
  }

  if (cacheKey && responseCache.has(cacheKey)) {
    return { ok: true, cached: true, ...responseCache.get(cacheKey) };
  }

  const quota = checkAndIncrementMemoryQuota(actorKey);
  if (!quota.allowed) {
    return {
      ok: false,
      configured: true,
      status: "quota_exceeded",
      message: `Daily AI request limit (${env.aiDailyQuotaPerUser}) reached for today.`,
    };
  }

  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callGroqChat({ messages, temperature, maxTokens, fetchImpl });
      await logAiUsage({
        userId,
        provider: result.provider,
        endpoint: "chat",
        modelName: result.model,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        latencyMs: result.latencyMs,
        status: "ok",
      });
      if (cacheKey) {
        if (responseCache.size >= MAX_CACHE) {
          const oldest = responseCache.keys().next().value;
          responseCache.delete(oldest);
        }
        responseCache.set(cacheKey, result);
      }
      return { ok: true, remainingQuota: quota.remaining, ...result };
    } catch (err) {
      lastErr = err;
    }
  }

  await logAiUsage({ userId, provider: "groq", endpoint: "chat", modelName: env.groqModel, status: "error" });
  return {
    ok: false,
    configured: true,
    status: "error",
    message: lastErr?.message || "Groq request failed",
  };
}

export async function executeVisionEvaluation({ actorKey, userId = null, promptText, imageBase64, mimeType, fetchImpl = fetch }) {
  if (!isGeminiConfigured()) {
    return {
      ok: false,
      configured: false,
      status: "unavailable",
      message: "Gemini API key is not configured for multimodal inspection.",
    };
  }

  const quota = checkAndIncrementMemoryQuota(actorKey);
  if (!quota.allowed) {
    return { ok: false, configured: true, status: "quota_exceeded", message: "Daily AI quota reached." };
  }

  try {
    const result = await callGeminiMultimodal({
      promptText: sanitizeForPrompt(promptText),
      imageBase64,
      mimeType,
      fetchImpl,
    });
    await logAiUsage({
      userId,
      provider: "gemini",
      endpoint: "vision",
      modelName: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs: result.latencyMs,
      status: "ok",
    });
    return { ok: true, remainingQuota: quota.remaining, ...result };
  } catch (err) {
    await logAiUsage({ userId, provider: "gemini", endpoint: "vision", modelName: env.geminiModel, status: "error" });
    return { ok: false, configured: true, status: "error", message: err.message };
  }
}

export async function executeSpeechToText({ actorKey, userId = null, audioBase64, mimeType, language, fetchImpl = fetch }) {
  if (!isGroqConfigured()) {
    return {
      ok: false,
      configured: false,
      status: "unavailable",
      message: "Groq Whisper requires GROQ_API_KEY on the server.",
    };
  }
  const quota = checkAndIncrementMemoryQuota(actorKey);
  if (!quota.allowed) {
    return { ok: false, configured: true, status: "quota_exceeded", message: "Daily AI quota reached." };
  }
  try {
    const result = await callGroqWhisper({ audioBase64, mimeType, language, fetchImpl });
    await logAiUsage({ userId, provider: "whisper", endpoint: "stt", modelName: result.model, latencyMs: result.latencyMs, status: "ok" });
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, configured: true, status: "error", message: err.message };
  }
}
