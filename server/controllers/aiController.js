import {
  executeChat,
  executeSpeechToText,
  executeVisionEvaluation,
  getAiCapabilities,
  sanitizeForPrompt,
} from "../services/ai/aiGateway.js";
import { evaluatePromptWithAi } from "../services/ai/hybridEvaluator.js";
import { aiChatSchema, aiEvaluateSchema, aiPlaygroundSchema } from "../validators/schemas.js";

function actorKey(req) {
  return req.user?.id || req.ip || "anon";
}

export async function aiStatus(_req, res) {
  return res.json(getAiCapabilities());
}

export async function novaChat(req, res) {
  const parsed = aiChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid chat message" });
  }

  const langNote =
    parsed.data.language === "bn"
      ? "Reply concisely in Bengali."
      : parsed.data.language === "hi"
        ? "Reply concisely in Hindi."
        : "Reply concisely in clear English.";

  const systemPrompt = `You are NOVA, the tactical AI guide inside AI Arena. Coach players on prompt engineering, fact verification, workflows, and AI safety without solving graded challenges verbatim for them. ${langNote}`;
  const contextLine = parsed.data.missionTitle
    ? `Current context: World=${parsed.data.worldId || "hub"}, Mission=${parsed.data.missionTitle}. `
    : "";

  const result = await executeChat({
    actorKey: actorKey(req),
    userId: req.user?.id || null,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${contextLine}${sanitizeForPrompt(parsed.data.message)}` },
    ],
    temperature: 0.45,
    maxTokens: 320,
  });

  if (!result.ok) {
    return res.status(result.status === "quota_exceeded" ? 429 : 503).json(result);
  }
  return res.json({ reply: result.content, provider: result.provider, model: result.model });
}

export async function aiEvaluate(req, res) {
  const parsed = aiEvaluateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid evaluation payload" });
  }
  const result = await evaluatePromptWithAi({
    actorKey: actorKey(req),
    userId: req.user?.id || null,
    ...parsed.data,
  });
  if (result.status !== "ok") {
    return res.status(result.status === "quota_exceeded" ? 429 : 503).json(result);
  }
  return res.json(result);
}

export async function aiPlayground(req, res) {
  const parsed = aiPlaygroundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid playground request" });
  }
  const messages = [];
  if (parsed.data.systemPrompt) {
    messages.push({ role: "system", content: sanitizeForPrompt(parsed.data.systemPrompt) });
  }
  messages.push({ role: "user", content: sanitizeForPrompt(parsed.data.userPrompt) });

  const result = await executeChat({
    actorKey: actorKey(req),
    userId: req.user?.id || null,
    messages,
    temperature: parsed.data.temperature,
    maxTokens: parsed.data.maxTokens,
  });
  if (!result.ok) {
    return res.status(result.status === "quota_exceeded" ? 429 : 503).json(result);
  }
  return res.json({
    output: result.content,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    latencyMs: result.latencyMs,
  });
}

export async function aiVisionAnalyze(req, res) {
  const { promptText, imageBase64, mimeType } = req.body || {};
  if (!promptText || typeof promptText !== "string") {
    return res.status(400).json({ error: "promptText is required" });
  }
  const result = await executeVisionEvaluation({
    actorKey: actorKey(req),
    userId: req.user?.id || null,
    promptText,
    imageBase64,
    mimeType,
  });
  if (!result.ok) {
    return res.status(result.status === "quota_exceeded" ? 429 : 503).json(result);
  }
  return res.json({ analysis: result.content, provider: result.provider, model: result.model });
}

export async function aiSpeechTranscribe(req, res) {
  const { audioBase64, mimeType, language } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "audioBase64 is required" });
  }
  const result = await executeSpeechToText({
    actorKey: actorKey(req),
    userId: req.user?.id || null,
    audioBase64,
    mimeType,
    language,
  });
  if (!result.ok) {
    return res.status(result.status === "quota_exceeded" ? 429 : 503).json(result);
  }
  return res.json({ text: result.text, provider: result.provider, model: result.model });
}
