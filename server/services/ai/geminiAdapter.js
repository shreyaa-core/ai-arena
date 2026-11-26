import { env } from "../../config/env.js";

export function isGeminiConfigured() {
  return Boolean(env.geminiApiKey && env.geminiApiKey.trim().length > 10);
}

export async function callGeminiMultimodal({ promptText, imageBase64 = null, mimeType = "image/jpeg", timeoutMs = 18000, fetchImpl = fetch }) {
  if (!isGeminiConfigured()) {
    const err = new Error("GEMINI_API_KEY is not configured.");
    err.code = "AI_UNCONFIGURED";
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  const parts = [{ text: promptText }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.35 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = new Error(`Gemini API error (${res.status})`);
      err.code = "AI_PROVIDER_ERROR";
      err.statusCode = 502;
      throw err;
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
    return {
      provider: "gemini",
      model: env.geminiModel,
      content,
      usage: {
        promptTokens: data?.usageMetadata?.promptTokenCount || 0,
        completionTokens: data?.usageMetadata?.candidatesTokenCount || 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}
