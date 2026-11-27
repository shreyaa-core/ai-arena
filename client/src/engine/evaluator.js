import { evaluateRubric } from "./scoring.js";

/**
 * Hybrid evaluation entry point used by the game UI.
 * Calls the backend AI evaluation endpoint when live AI mode is enabled on text prompts,
 * falling back cleanly to deterministic rubric scoring on timeout/error/unconfigured.
 * Never fabricates live AI responses when the backend reports unavailable.
 */
export async function evaluate(challenge, response, opts = {}) {
  const deterministic = evaluateRubric(challenge, response);

  const canUseLivePromptEval =
    opts.useLiveAi &&
    typeof fetch === "function" &&
    response?.kind === "text" &&
    Boolean(response?.text?.trim());

  if (canUseLivePromptEval) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        signal: controller?.signal,
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          scenario: challenge.scenario || "",
          task: challenge.task || "",
          promptText: response.text.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.status === "ok" && typeof data.aiScore === "number") {
        const blendedScore = Math.max(
          0,
          Math.min(100, Math.round(deterministic.score * 0.55 + data.aiScore * 0.45)),
        );
        return {
          ...deterministic,
          score: blendedScore,
          strengths: Array.from(new Set([...(data.strengths || []), ...(deterministic.strengths || [])])).slice(0, 6),
          improvements: Array.from(new Set([...(data.improvements || []), ...(deterministic.improvements || [])])).slice(0, 6),
          aiSummary: data.summary || "",
          evaluator: `hybrid-${data.provider || "groq"}`,
          liveAiStatus: "ok",
        };
      }

      return {
        ...deterministic,
        liveAiStatus: data?.status || "unavailable",
        liveAiMessage: data?.message || "Live AI evaluator unavailable — scored deterministically.",
      };
    } catch {
      return {
        ...deterministic,
        liveAiStatus: "unavailable",
        liveAiMessage: "Network timeout or unreachable — scored deterministically.",
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return deterministic;
}
