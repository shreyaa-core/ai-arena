import { evaluateRubric } from "./scoring.js";

/**
 * Hybrid evaluation entry point used by the game UI.
 * Calls the backend AI evaluation endpoint when live AI mode is enabled,
 * falling back cleanly to deterministic rubric scoring when offline/guest.
 * Never fabricates live AI responses when the backend reports unavailable.
 */
export async function evaluate(challenge, response, opts = {}) {
  const deterministic = evaluateRubric(challenge, response);
  if (opts.useLiveAi && typeof fetch === "function") {
    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          challengeTask: challenge.task,
          domain: challenge.domain,
          response,
          deterministic,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === "ok" && data.evaluation) {
          return data.evaluation;
        }
        return {
          ...deterministic,
          liveAiStatus: data?.status || "unavailable",
          liveAiMessage: data?.message || "Live AI evaluator unavailable — scored deterministically.",
        };
      }
    } catch {
      return {
        ...deterministic,
        liveAiStatus: "unavailable",
        liveAiMessage: "Network unreachable — scored deterministically without fabricating live AI output.",
      };
    }
  }
  return deterministic;
}
