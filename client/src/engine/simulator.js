import { evaluateRubric, wordCount } from "./scoring.js";

/**
 * Deterministic AI output simulator for text/prompt challenges (including visual prompt recreation).
 * Explicitly labeled as simulation mode when live Groq/Gemini APIs are not active.
 */
export function simulatePromptOutput(challenge, text) {
  if (challenge.payload.kind !== "text") {
    return {
      mode: "simulation",
      estimatedQuality: 0,
      strengthsDetected: [],
      failureModes: ["Simulator is only available for prompt-writing and output-improvement tasks."],
      simulatedOutput: "",
    };
  }

  const p = challenge.payload;
  const words = wordCount(text);
  const isImageTask = Boolean(p.referenceImage || p.sceneSpec);

  if (!text.trim() || (p.starter && text.trim().toLowerCase() === p.starter.trim().toLowerCase())) {
    return {
      mode: "simulation",
      estimatedQuality: 10,
      strengthsDetected: [],
      failureModes: [
        isImageTask
          ? "Prompt is empty or too vague — the image generator invented its own subject, style, and lighting."
          : "Prompt is too vague or unchanged — the AI guessed your audience, format, and facts.",
      ],
      simulatedOutput: isImageTask
        ? "Simulated Output: Generic stock scene with random framing, flat lighting, and unwanted overlaid text."
        : "Simulated Output: Generic 600-word overview covering broad background points without constraints, citations, or audience tailoring...",
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

  const lines = [];
  if (evalRes.strengths.length > 0) {
    lines.push(
      isImageTask
        ? `[Simulation Mode · Image Generator locked ${evalRes.strengths.length} visual cue(s): ${evalRes.strengths.slice(0, 3).join(", ")}]`
        : `[Simulation Mode · Assistant followed ${evalRes.strengths.length} instruction(s): ${evalRes.strengths.slice(0, 3).join(", ")}]`,
    );
  } else {
    lines.push(
      isImageTask
        ? "[Simulation Mode · Image Generator had minimal visual constraints and fell back to defaults]"
        : "[Simulation Mode · Assistant had minimal constraints and fell back to generic defaults]",
    );
  }

  if (evalRes.score >= 85) {
    lines.push(
      isImageTask
        ? "Render Preview: Tight match to the reference — subject, camera angle, lighting, palette, and exclusions are all anchored for a clean first-shot render."
        : "Output Preview: Structured, decision-ready draft tailored to your audience, format, and verification rules — minimal follow-up turns needed.",
    );
  } else if (evalRes.score >= 60) {
    lines.push(
      isImageTask
        ? "Render Preview: Recognizable subject, though missing camera framing, lighting, or style cues caused drift from the reference."
        : "Output Preview: Usable first draft, though missing constraints forced the AI to improvise tone, length, or verification checks.",
    );
  } else {
    lines.push(
      isImageTask
        ? "Render Preview: Off-target composition and wrong mood — would require 2-3 re-roll generations to fix."
        : "Output Preview: Broad, padded draft with unverified claims and generic framing — would spend 2-3 extra turns fixing.",
    );
  }

  return {
    mode: "simulation",
    estimatedQuality: evalRes.score,
    strengthsDetected: evalRes.strengths,
    failureModes: failureModes.slice(0, 4),
    simulatedOutput: lines.join("\n\n"),
  };
}
