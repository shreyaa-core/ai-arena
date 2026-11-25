import { describe, expect, it } from "vitest";
import { CHALLENGES, challengeById } from "@/lib/arena/challenges";
import { computeBadges, computeEfficiency, computePlayerStats, gradeFromScore } from "@/lib/arena/game";
import { evaluateRubric } from "@/lib/arena/scoring";
import { simulatePromptOutput } from "@/lib/arena/simulator";
import { createEmptyArenaState } from "@/lib/arena/storage";

describe("AI Arena game mechanics", () => {
  it("rewards speed, 1-shot clarity, and zero hints while gating low-quality junk", () => {
    const ch = challengeById("brief-research-assistant")!;
    const goodPrompt =
      "You are a research analyst preparing a brief for my manager Priya, who is non-technical and must decide on remote work by Friday. Summarize the three studies (Stanford, Microsoft, meta-analysis) in under 200 words using plain language bullets. Include pros and cons, cite which study supports each point, flag uncertainty or where studies disagree, do not invent facts, and stay neutral.";
    const evalGood = evaluateRubric(ch, { kind: "text", text: goodPrompt });
    const fastOneShot = computeEfficiency(ch, evalGood, { kind: "text", text: goodPrompt }, {
      seconds: 120,
      hintsUsed: 0,
      turnsUsed: 0,
      isFirstClear: true,
      currentStreak: 0,
    });
    const slowAssisted = computeEfficiency(ch, evalGood, { kind: "text", text: goodPrompt }, {
      seconds: 700,
      hintsUsed: 3,
      turnsUsed: 3,
      isFirstClear: false,
      currentStreak: 0,
    });

    expect(fastOneShot.efficiency).toBeGreaterThan(slowAssisted.efficiency);
    expect(fastOneShot.grade).toBe("S");
    expect(fastOneShot.bonuses).toContain("One-Shot Clear (+20 XP)");

    const junkEval = evaluateRubric(ch, { kind: "text", text: "help" });
    const junkFast = computeEfficiency(ch, junkEval, { kind: "text", text: "help" }, {
      seconds: 5,
      hintsUsed: 0,
      turnsUsed: 0,
      isFirstClear: true,
      currentStreak: 0,
    });
    expect(junkFast.efficiency).toBeLessThan(40);
    expect(gradeFromScore(junkFast.efficiency)).toBe("D");
  });

  it("simulates prompt output and surfaces missing constraint failure modes", () => {
    const ch = challengeById("rescue-vague-prompt")!;
    const preview = simulatePromptOutput(ch, "write something about our product launch");
    expect(preview.estimatedQuality).toBeLessThan(30);
    expect(preview.failureModes.length).toBeGreaterThan(0);
  });

  it("computes player stats, rank progression, and badges across domains", () => {
    const state = createEmptyArenaState();
    const spotFlaws = CHALLENGES.find((c) => c.type === "spot-flaws")!;
    state.submissions.push({
      id: "s1",
      challengeId: spotFlaws.id,
      score: 92,
      efficiency: 93,
      grade: "S",
      xp: 180,
      hintsUsed: 0,
      turnsUsed: 0,
      criteria: [],
      seconds: 120,
      at: new Date().toISOString(),
    });

    const stats = computePlayerStats(state);
    expect(stats.totalXp).toBe(180);
    expect(stats.rank.level).toBe(2);
    expect(stats.currentStreak).toBe(1);

    const badges = computeBadges(state, stats);
    expect(badges.find((b) => b.id === "first-clear")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "one-shot")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "hallucination-hunter")?.unlocked).toBe(true);
  });
});
