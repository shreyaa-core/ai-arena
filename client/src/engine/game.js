import { CHALLENGES, challengeById } from "../data/challenges.js";
import { DOMAINS } from "../data/domains.js";
import { wordCount } from "./scoring.js";

const DIFFICULTY_MULT = {
  Beginner: 1.0,
  Intermediate: 1.25,
  Advanced: 1.5,
};

export const RANK_TIERS = [
  { level: 1, title: "Prompt Novice", minXp: 0, nextXp: 150 },
  { level: 2, title: "Signal Seeker", minXp: 150, nextXp: 350 },
  { level: 3, title: "Tactical Operator", minXp: 350, nextXp: 650 },
  { level: 4, title: "Workflow Architect", minXp: 650, nextXp: 1050 },
  { level: 5, title: "Verification Ace", minXp: 1050, nextXp: 1600 },
  { level: 6, title: "AI Grandmaster", minXp: 1600, nextXp: null },
];

export const DEFAULT_AEI_WEIGHTS = {
  prompt: 0.25,
  evaluation: 0.2,
  workflow: 0.2,
  responsible: 0.15,
  tools: 0.1,
  creative: 0.1,
};

export function gradeFromScore(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function proficiencyBand(score) {
  if (score >= 85) return "Advanced";
  if (score >= 68) return "Proficient";
  if (score >= 45) return "Developing";
  return "Beginner";
}

/**
 * AEI competency tiers aligned with Skill Passport certification.
 */
export function aeiProficiencyBand(aei) {
  if (aei >= 90) return { band: "AI Grandmaster", tier: 5 };
  if (aei >= 75) return { band: "AI Strategist", tier: 4 };
  if (aei >= 60) return { band: "AI Problem Solver", tier: 3 };
  if (aei >= 40) return { band: "AI Practitioner", tier: 2 };
  return { band: "AI Beginner", tier: 1 };
}

export function getParSeconds(challenge) {
  return (challenge?.minutes || 6) * 60;
}

export function estimateTokens(text) {
  const words = wordCount(text);
  return Math.round(words * 1.35);
}

export function computeSignalDensity(challenge, response) {
  if (challenge?.payload?.kind !== "text" || response?.kind !== "text") return undefined;
  const words = wordCount(response.text);
  const min = challenge.payload.minWords || 30;
  if (words < min) return "Too Brief";
  if (words <= Math.round(min * 1.6)) return "Concise";
  if (words <= Math.round(min * 2.8)) return "Balanced";
  return "Verbose";
}

/**
 * Deterministic mission efficiency & reward computation.
 * Note: repeatFactor prevents coin/XP farming on identical repeated missions.
 */
export function computeEfficiency(challenge, evaluation, response, opts = {}) {
  const seconds = Number(opts.seconds ?? 0);
  const hintsUsed = Number(opts.hintsUsed ?? 0);
  const turnsUsed = Number(opts.turnsUsed ?? 0);
  const isFirstClear = Boolean(opts.isFirstClear);
  const currentStreak = Number(opts.currentStreak ?? 0);
  const priorRepeats = Number(opts.priorRepeats ?? 0);

  const parSeconds = getParSeconds(challenge);
  const ratio = seconds / Math.max(60, parSeconds);

  let speedScore = 100;
  if (ratio <= 0.5) {
    speedScore = 100;
  } else if (ratio <= 1.0) {
    speedScore = Math.round(100 - ((ratio - 0.5) / 0.5) * 25);
  } else {
    speedScore = Math.max(35, Math.round(75 - (ratio - 1.0) * 35));
  }

  const turnScore =
    turnsUsed <= 0
      ? 100
      : turnsUsed === 1
        ? 88
        : Math.max(40, 74 - (turnsUsed - 2) * 12);

  const hintScore = Math.max(40, 100 - hintsUsed * 18);

  const rawEfficiency = Math.round(
    evaluation.score * 0.65 + speedScore * 0.15 + turnScore * 0.1 + hintScore * 0.1,
  );
  const efficiency =
    evaluation.score < 40 ? Math.min(evaluation.score, rawEfficiency) : rawEfficiency;
  const grade = gradeFromScore(efficiency);

  const bonuses = [];
  let bonusXp = 0;

  if (evaluation.score >= 60) {
    if (turnsUsed === 0) {
      bonuses.push("One-Shot Clear (+20 XP)");
      bonusXp += 20;
    }
    if (hintsUsed === 0) {
      bonuses.push("Zero-Assist (+15 XP)");
      bonusXp += 15;
    }
    if (ratio <= 0.6) {
      bonuses.push("Speedrunner (+15 XP)");
      bonusXp += 15;
    }
    if (isFirstClear) {
      bonuses.push("First Clear (+30 XP)");
      bonusXp += 30;
    }
  }

  const signalDensity = computeSignalDensity(challenge, response);
  if (signalDensity === "Concise" && evaluation.score >= 75) {
    bonuses.push("High Signal-to-Noise (+10 XP)");
    bonusXp += 10;
  }

  const streakMult = 1 + Math.min(0.5, currentStreak * 0.1);
  if (currentStreak > 0 && evaluation.score >= 60) {
    bonuses.push(`${currentStreak}x Streak Multiplier`);
  }

  const diffMult = DIFFICULTY_MULT[challenge?.difficulty] || 1.0;
  const baseXp = Math.round(efficiency * diffMult);
  const repeatDecay = priorRepeats <= 0 ? 1 : priorRepeats === 1 ? 0.5 : priorRepeats === 2 ? 0.25 : 0.1;
  const xpEarned = Math.round((baseXp + bonusXp) * streakMult * repeatDecay);
  const coinsEarned =
    evaluation.score >= 50
      ? Math.max(5, Math.round((efficiency * 0.4 + (isFirstClear ? 25 : 0)) * diffMult * repeatDecay))
      : 0;

  return {
    efficiency,
    grade,
    rubricScore: evaluation.score,
    speedScore,
    turnScore,
    hintScore,
    parSeconds,
    xpEarned,
    coinsEarned,
    bonuses,
    signalDensity,
  };
}

export function submissionEfficiency(s) {
  if (typeof s.efficiency === "number") return s.efficiency;
  return s.score;
}

export function submissionXp(s) {
  if (typeof s.xp === "number") return s.xp;
  const ch = challengeById(s.challengeId);
  const mult = ch ? DIFFICULTY_MULT[ch.difficulty] || 1 : 1;
  return Math.round(s.score * mult);
}

export function getRankForXp(xp) {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    const tier = RANK_TIERS[i];
    if (tier && xp >= tier.minXp) return tier;
  }
  return RANK_TIERS[0];
}

/**
 * Computes weighted AI Efficiency Index (AEI 0–100) from verified domain competency scores.
 */
export function computeAEI(domainScoreMap = {}, weights = DEFAULT_AEI_WEIGHTS) {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [domain, weight] of Object.entries(weights)) {
    const val = Math.max(0, Math.min(100, Number(domainScoreMap[domain] ?? 0)));
    weightedSum += val * weight;
    totalWeight += weight;
  }
  const aei = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return {
    aei,
    ...aeiProficiencyBand(aei),
  };
}

export function computePlayerStats(state) {
  // Gameplay XP excludes standalone baseline/diagnostic assessments
  const gameplaySubs = (state.submissions || []).filter((s) => s.mode !== "assessment");
  const missionXp = gameplaySubs.reduce((acc, s) => acc + submissionXp(s), 0);
  const blitzXp = (state.blitzRuns ?? []).reduce((acc, b) => acc + (b.xpEarned || 0), 0);
  const totalXp = missionXp + blitzXp;
  const rank = getRankForXp(totalXp);
  const rankProgress =
    rank.nextXp === null
      ? 100
      : Math.min(100, Math.round(((totalXp - rank.minXp) / (rank.nextXp - rank.minXp)) * 100));

  const bestByChallenge = {};
  for (const s of state.submissions || []) {
    const prev = bestByChallenge[s.challengeId];
    if (!prev || submissionEfficiency(s) > submissionEfficiency(prev)) {
      bestByChallenge[s.challengeId] = s;
    }
  }

  const bestList = Object.values(bestByChallenge);
  const completedIds = bestList.filter((s) => s.score >= 50).map((s) => s.challengeId);

  const averageEfficiency = bestList.length
    ? Math.round(bestList.reduce((a, s) => a + submissionEfficiency(s), 0) / bestList.length)
    : 0;
  const averageRubric = bestList.length
    ? Math.round(bestList.reduce((a, s) => a + s.score, 0) / bestList.length)
    : 0;

  let currentStreak = 0;
  let bestStreak = 0;
  for (const s of gameplaySubs) {
    if (submissionEfficiency(s) >= 70) {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const totalSeconds = (state.submissions || []).reduce((a, s) => a + (s.seconds || 0), 0);

  const domainScores = DOMAINS.map((d) => {
    const domainChallenges = CHALLENGES.filter((c) => c.domain === d.id);
    const matching = domainChallenges
      .map((c) => bestByChallenge[c.id])
      .filter(Boolean);
    const score = matching.length
      ? Math.round(matching.reduce((a, s) => a + submissionEfficiency(s), 0) / matching.length)
      : 0;
    return { domain: d.id, label: d.label, score, attempts: matching.length };
  });

  const domainMap = {};
  for (const d of domainScores) domainMap[d.domain] = d.score;
  const aeiReport = computeAEI(domainMap);

  const attemptedDomains = domainScores.filter((d) => d.attempts > 0);
  const weakestDomain = attemptedDomains.length
    ? attemptedDomains.reduce((a, b) => (b.score < a.score ? b : a))
    : null;

  return {
    totalXp,
    rank,
    rankProgress,
    averageEfficiency,
    averageRubric,
    aei: aeiReport.aei,
    aeiBand: aeiReport.band,
    aeiTier: aeiReport.tier,
    completedIds,
    bestByChallenge,
    currentStreak,
    bestStreak,
    totalSeconds,
    domainScores,
    weakestDomain,
  };
}

export function computeBadges(state, stats) {
  const subs = state.submissions || [];
  const hasOneShot = subs.some(
    (s) => submissionEfficiency(s) >= 80 && (s.turnsUsed ?? 0) === 0,
  );
  const zeroHintCount = subs.filter(
    (s) => s.score >= 65 && (s.hintsUsed ?? 0) === 0,
  ).length;
  const hasSpeedrun = subs.some((s) => {
    const ch = challengeById(s.challengeId);
    return ch && s.score >= 70 && s.seconds <= getParSeconds(ch) * 0.45;
  });
  const hasTypeHigh = (type) =>
    subs.some((s) => {
      const ch = challengeById(s.challengeId);
      return ch?.type === type && s.score >= 85;
    });
  const allDomainsCleared = stats.domainScores.every((d) => d.attempts > 0);

  return [
    {
      id: "first-clear",
      name: "First Mission Cleared",
      description: "Complete your first AI Arena mission with a score of 50+.",
      unlocked: stats.completedIds.length >= 1,
    },
    {
      id: "one-shot",
      name: "One-Shot Sniper",
      description: "Score 80%+ efficiency without needing a simulator retry.",
      unlocked: hasOneShot,
    },
    {
      id: "zero-hint",
      name: "Zero-Assist Purist",
      description: "Clear 3 missions with 0 hints revealed.",
      unlocked: zeroHintCount >= 3,
    },
    {
      id: "speedrunner",
      name: "Speedrunner",
      description: "Clear a mission in under 45% of par time with 70%+ quality.",
      unlocked: hasSpeedrun,
    },
    {
      id: "hallucination-hunter",
      name: "Hallucination Hunter",
      description: "Score 85%+ on a Spot the Flaws mission.",
      unlocked: hasTypeHigh("spot-flaws"),
    },
    {
      id: "pipeline-architect",
      name: "Pipeline Architect",
      description: "Score 85%+ on a Workflow Design mission.",
      unlocked: hasTypeHigh("workflow-design"),
    },
    {
      id: "safety-guardian",
      name: "Safety Guardian",
      description: "Score 85%+ on a Risk Classification mission.",
      unlocked: hasTypeHigh("risk-classify"),
    },
    {
      id: "six-domains",
      name: "Six-Domain Explorer",
      description: "Complete at least one mission in all 6 AI skill domains.",
      unlocked: allDomainsCleared,
    },
  ];
}

export function recommendAdaptiveDifficulty(stats, experienceLevel = "beginner") {
  if (stats.completedIds.length === 0) {
    if (experienceLevel === "advanced") return "Intermediate";
    return "Beginner";
  }
  if (stats.averageEfficiency >= 85) return "Advanced";
  if (stats.averageEfficiency >= 68) return "Intermediate";
  return "Beginner";
}

export function recommendNextChallenge(state) {
  const stats = computePlayerStats(state);
  const targetDiff = recommendAdaptiveDifficulty(stats, state.profile?.experienceLevel);
  const unplayed = CHALLENGES.filter((c) => !stats.bestByChallenge[c.id]);
  if (unplayed.length > 0) {
    if (stats.weakestDomain) {
      const domainMatch = unplayed.find(
        (c) => c.domain === stats.weakestDomain.domain && c.difficulty === targetDiff,
      ) || unplayed.find((c) => c.domain === stats.weakestDomain.domain);
      if (domainMatch) return domainMatch;
    }
    const diffMatch = unplayed.find((c) => c.difficulty === targetDiff);
    return diffMatch || unplayed[0];
  }

  let lowest = CHALLENGES[0];
  for (const c of CHALLENGES) {
    const lowSub = stats.bestByChallenge[lowest.id];
    const curSub = stats.bestByChallenge[c.id];
    const ls = lowSub ? submissionEfficiency(lowSub) : 0;
    const cs = curSub ? submissionEfficiency(curSub) : 0;
    if (cs < ls) lowest = c;
  }
  return lowest;
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
