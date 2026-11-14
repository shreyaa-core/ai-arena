import { evaluateRubric } from "./scoring";
import type { Challenge, ChallengeResponse, EvaluationResult } from "./types";

/**
 * Evaluation entry point used by the UI.
 *
 * Today: deterministic rubric scoring in the browser (no API key needed).
 * Later: add a `createServerFn` (e.g. src/lib/arena/evaluate.functions.ts) that calls an
 * LLM through the server-side AI gateway, returns the same `EvaluationResult` shape with
 * evaluator: "llm", and swap the call here. Never call a model or hold a key in the browser.
 */
export async function evaluate(challenge: Challenge, response: ChallengeResponse): Promise<EvaluationResult> {
  return evaluateRubric(challenge, response);
}
