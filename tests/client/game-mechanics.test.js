import { describe, expect, it } from "vitest";
import { CHALLENGES, challengeById } from "../../client/src/data/challenges.js";
import {
  generateDynamicBriefChallenge,
  generateDynamicVisualChallenge,
} from "../../client/src/engine/dynamicChallenges.js";
import {
  computeAEI,
  computeBadges,
  computeEfficiency,
  computePlayerStats,
  gradeFromScore,
} from "../../client/src/engine/game.js";
import { evaluateRubric } from "../../client/src/engine/scoring.js";
import { simulatePromptOutput } from "../../client/src/engine/simulator.js";
import { createEmptyArenaState } from "../../client/src/utils/storage.js";

describe("AI Arena pure-JS game mechanics", () => {
  it("rewards speed, 1-shot clarity, and zero hints while gating low-quality junk", () => {
    const ch = challengeById("brief-research-assistant");
    expect(ch).toBeDefined();

    const goodPrompt =
      "You are a research analyst preparing a brief for my manager Priya, who is non-technical and must decide on remote work by Friday. Summarize the three studies (Stanford, Microsoft, meta-analysis) in under 200 words using plain language bullets. Include pros and cons, cite which study supports each point, flag uncertainty or where studies disagree, do not invent facts, and stay neutral.";
    const evalGood = evaluateRubric(ch, { kind: "text", text: goodPrompt });
    const fastOneShot = computeEfficiency(
      ch,
      evalGood,
      { kind: "text", text: goodPrompt },
      { seconds: 120, hintsUsed: 0, turnsUsed: 0, isFirstClear: true, currentStreak: 0 },
    );
    const slowAssisted = computeEfficiency(
      ch,
      evalGood,
      { kind: "text", text: goodPrompt },
      { seconds: 700, hintsUsed: 3, turnsUsed: 3, isFirstClear: false, currentStreak: 0 },
    );

    expect(fastOneShot.efficiency).toBeGreaterThan(slowAssisted.efficiency);
    expect(fastOneShot.grade).toBe("S");
    expect(fastOneShot.bonuses).toContain("One-Shot Clear (+20 XP)");
    expect(fastOneShot.coinsEarned).toBeGreaterThan(0);

    const junkEval = evaluateRubric(ch, { kind: "text", text: "help" });
    const junkFast = computeEfficiency(
      ch,
      junkEval,
      { kind: "text", text: "help" },
      { seconds: 5, hintsUsed: 0, turnsUsed: 0, isFirstClear: true, currentStreak: 0 },
    );
    expect(junkFast.efficiency).toBeLessThan(40);
    expect(gradeFromScore(junkFast.efficiency)).toBe("D");
  });

  it("simulates prompt output and tags simulation mode honestly", () => {
    const ch = challengeById("rescue-vague-prompt");
    const preview = simulatePromptOutput(ch, "write something about our product launch");
    expect(preview.mode).toBe("simulation");
    expect(preview.estimatedQuality).toBeLessThan(30);
    expect(preview.failureModes.length).toBeGreaterThan(0);

    const imgCh = challengeById("recreate-orbital-beacon");
    const imgGood = simulatePromptOutput(
      imgCh,
      "Stylized sci-fi vector illustration in isometric three-quarter view of an orbital research station with solar arrays floating above a glowing cyan crescent planet horizon in deep indigo space, warm amber windows, no text or watermarks.",
    );
    expect(imgGood.estimatedQuality).toBeGreaterThanOrEqual(85);
    expect(imgGood.simulatedOutput).toContain("Image Generator");
  });

  it("computes player stats, AEI weights, rank progression, and badges while separating assessment XP", () => {
    const state = createEmptyArenaState();
    const spotFlaws = CHALLENGES.find((c) => c.type === "spot-flaws");
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
      mode: "campaign",
      at: new Date().toISOString(),
    });
    // Assessment entry must NOT inflate gameplay XP
    state.submissions.push({
      id: "s-assess",
      challengeId: "brief-research-assistant",
      score: 80,
      efficiency: 80,
      grade: "A",
      xp: 999,
      criteria: [],
      seconds: 90,
      mode: "assessment",
      at: new Date().toISOString(),
    });

    const stats = computePlayerStats(state);
    expect(stats.totalXp).toBe(180);
    expect(stats.rank.level).toBe(2);
    expect(stats.currentStreak).toBe(1);

    const aei = computeAEI({
      prompt: 80,
      evaluation: 80,
      workflow: 80,
      responsible: 80,
      tools: 80,
      creative: 80,
    });
    expect(aei.aei).toBe(80);
    expect(aei.band).toBe("AI Strategist");

    const badges = computeBadges(state, stats);
    expect(badges.find((b) => b.id === "first-clear")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "one-shot")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "hallucination-hunter")?.unlocked).toBe(true);
  });

  it("generates distinct dynamic visual and brief challenges for different seeds", () => {
    const v1 = generateDynamicVisualChallenge(101);
    const v2 = generateDynamicVisualChallenge(777);
    expect(v1.payload.kind).toBe("text");
    expect(v2.payload.kind).toBe("text");
    expect(v1.payload.sceneSpec).toBeDefined();
    expect(v2.payload.sceneSpec).toBeDefined();
    expect(v1.payload.sceneSpec).not.toEqual(v2.payload.sceneSpec);

    const b1 = generateDynamicBriefChallenge(0);
    const b2 = generateDynamicBriefChallenge(1);
    expect(b1.scenario).not.toBe(b2.scenario);
  });
});
