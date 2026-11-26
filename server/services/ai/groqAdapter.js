import { env } from "../../config/env.js";

export function isGroqConfigured() {
  return Boolean(env.groqApiKey && env.groqApiKey.trim().length > 10);
}

export async function callGroqChat({ messages, temperature = 0.4, maxTokens = 450, timeoutMs = 15000, fetchImpl = fetch }) {
  if (!isGroqConfigured()) {
    const err = new Error("GROQ_API_KEY is not configured.");
    err.code = "AI_UNCONFIGURED";
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.groqApiKey}`,
      },
      body: JSON.stringify({
        model: env.groqModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`Groq API error (${res.status}): ${txt.slice(0, 200)}`);
      err.code = "AI_PROVIDER_ERROR";
      err.statusCode = res.status >= 500 ? 502 : res.status;
      throw err;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    return {
      provider: "groq",
      model: data.model || env.groqModel,
      content,
      usage: {
        promptTokens: data?.usage?.prompt_tokens || 0,
        completionTokens: data?.usage?.completion_tokens || 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function callGroqWhisper({ audioBase64, mimeType = "audio/webm", language = "en", fetchImpl = fetch }) {
  if (!isGroqConfigured()) {
    const err = new Error("GROQ_API_KEY is not configured for speech transcription.");
    err.code = "AI_UNCONFIGURED";
    throw err;
  }

  const buffer = Buffer.from(audioBase64, "base64");
  const blob = new Blob([buffer], { type: mimeType });
  const form = new FormData();
  form.append("file", blob, "voice.webm");
  form.append("model", env.groqWhisperModel);
  form.append("language", language);

  const startedAt = Date.now();
  const res = await fetchImpl("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.groqApiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = new Error(`Groq Whisper error (${res.status})`);
    err.code = "AI_PROVIDER_ERROR";
    throw err;
  }

  const data = await res.json();
  return {
    provider: "whisper",
    model: env.groqWhisperModel,
    text: data?.text || "",
    latencyMs: Date.now() - startedAt,
  };
}
