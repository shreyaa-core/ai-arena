import { evaluateRubric, wordCount } from "./scoring";
import type { Challenge, TextPayload } from "./types";

export interface SimulationPreview {
  estimatedQuality: number;
  strengthsDetected: string[];
  failureModes: string[];
  simulatedOutput: string;
}

/**
 * Deterministic AI output simulator for text/prompt challenges (including visual prompt recreation).
 * Shows how a typical AI assistant or image generator responds to the player's current prompt
 * before they lock in their final submission — illustrating missing constraints
 * and signal gaps without calling any external LLM.
 */
export function simulatePromptOutput(challenge: Challenge, text: string): SimulationPreview {
  if (challenge.payload.kind !== "text") {
    return {
      estimatedQuality: 0,
      strengthsDetected: [],
      failureModes: ["Simulator is only available for prompt-writing and output-improvement tasks."],
      simulatedOutput: "",
    };
  }

  const p: TextPayload = challenge.payload;
  const words = wordCount(text);
  const isImageTask = Boolean(p.referenceImage);

  if (!text.trim() || (p.starter && text.trim().toLowerCase() === p.starter.trim().toLowerCase())) {
    return {
      estimatedQuality: 10,
      strengthsDetected: [],
      failureModes: [
        isImageTask
          ? "Prompt is empty or too vague — the image generator invented its own subject, style, and lighting."
          : "Prompt is too vague or unchanged — the AI guessed your audience, format, and facts.",
      ],
      simulatedOutput: isImageTask
        ? "Generated a generic stock scene with random framing, flat lighting, and unwanted overlaid text."
        : "Sure! Here is a generic 600-word overview covering broad background points without specific constraints, citations, or target audience tailoring...",
    };
  }

  const evalRes = evaluateRubric(challenge, { kind: "text", text });
  const failureModes = [...evalRes.improvements];
  if (words < p.minWords) {
    failureModes.unshift(
      isImageTask
        ? `Short prompt (${words}/${p.minWords} words) leaves composition, lighting, and style open to guesswork.`
        : `Short prompt (${words}/${p.minWords} words) gives the AI room to hallucinate defaults.`,
    );
  }

  const lines: string[] = [];
  if (evalRes.strengths.length > 0) {
    lines.push(
      isImageTask
        ? `[Simulated Image Generator locked ${evalRes.strengths.length} visual cue(s): ${evalRes.strengths.slice(0, 3).join(", ")}]`
        : `[Simulated AI followed ${evalRes.strengths.length} detected instruction(s): ${evalRes.strengths.slice(0, 3).join(", ")}]`,
    );
  } else {
    lines.push(
      isImageTask
        ? "[Simulated Image Generator had minimal visual constraints and fell back to generic defaults]"
        : "[Simulated AI had minimal constraints and fell back to generic defaults]",
    );
  }

  if (evalRes.score >= 85) {
    lines.push(
      isImageTask
        ? "Render Preview: Tight match to the reference — subject, camera angle, lighting, color palette, and negative exclusions are all anchored for a clean first-shot render."
        : "Output Preview: Structured, decision-ready draft tailored to your exact audience, format, and verification constraints — minimal follow-up turns needed.",
    );
  } else if (evalRes.score >= 60) {
    lines.push(
      isImageTask
        ? "Render Preview: Recognizable subject, though missing camera framing, lighting, or style cues caused noticeable drift from the reference."
        : "Output Preview: Usable first draft, though a few missing constraints forced the AI to improvise tone, length, or edge-case checks.",
    );
  } else {
    lines.push(
      isImageTask
        ? "Render Preview: Off-target composition and wrong mood — you would burn 2–3 re-roll generations trying to steer this back."
        : "Output Preview: Broad, padded draft with unverified claims and generic framing — you would spend 2–3 extra turns fixing this in a real chat.",
    );
  }

  return {
    estimatedQuality: evalRes.score,
    strengthsDetected: evalRes.strengths,
    failureModes: failureModes.slice(0, 4),
    simulatedOutput: lines.join("\n\n"),
  };
}
