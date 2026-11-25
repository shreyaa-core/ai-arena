import { CHALLENGES, challengeById } from "./challenges";
import { DOMAINS } from "./domains";
import { wordCount } from "./scoring";
import type {
  ArenaState,
  Challenge,
  ChallengeResponse,
  Difficulty,
  DomainId,
  EfficiencyBreakdown,
  EvaluationResult,
  Grade,
  Submission,
} from "./types";

const DIFFICULTY_MULT: Record<Difficulty, number> = {
  Beginner: 1.0,
  Intermediate: 1.25,
  Advanced: 1.5,
};

export interface RankTier {
  level: number;
  title: string;
  minXp: number;
  nextXp: number | null;
}

export const RANK_TIERS: RankTier[] = [
  { level: 1, title: "Prompt Novice", minXp: 0, nextXp: 150 },
  { level: 2, title: "Signal Seeker", minXp: 150, nextXp: 350 },
  { level: 3, title: "Tactical Operator", minXp: 350, nextXp: 650 },
  { level: 4, title: "Workflow Architect", minXp: 650, nextXp: 1050 },
  { level: 5, title: "Verification Ace", minXp: 1050, nextXp: 1600 },
  { level: 6, title: "AI Grandmaster", minXp: 1600, nextXp: null },
];

export function gradeFromScore(score: number): Grade {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function proficiencyBand(score: number): "Beginner" | "Developing" | "Proficient" | "Advanced" {
  if (score >= 85) return "Advanced";
  if (score >= 68) return "Proficient";
  if (score >= 45) return "Developing";
  return "Beginner";
}

export function getParSeconds(challenge: Challenge): number {
  return challenge.minutes * 60;
}

export function estimateTokens(text: string): number {
  const words = wordCount(text);
  return Math.round(words * 1.35);
}

export function computeSignalDensity(
  challenge: Challenge,
  response: ChallengeResponse,
): EfficiencyBreakdown["signalDensity"] {
  if (challenge.payload.kind !== "text" || response.kind !== "text") return undefined;
  const words = wordCount(response.text);
  const min = challenge.payload.minWords;
  if (words < min) return "Too Brief";
  if (words <= Math.round(min * 1.6)) return "Concise";
  if (words <= Math.round(min * 2.8)) return "Balanced";
  return "Verbose";
}

export function computeEfficiency(
  challenge: Challenge,
  evaluation: EvaluationResult,
  response: ChallengeResponse,
  opts: {
    seconds: number;
    hintsUsed: number;
    turnsUsed: number;
    isFirstClear: boolean;
    currentStreak: number;
  },
): EfficiencyBreakdown {
  const parSeconds = getParSeconds(challenge);
  const ratio = opts.seconds / Math.max(60, parSeconds);

  // Speed score: finishing <= 50% par gives 100, <= 100% par gives 75-100, overtime decays smoothly to 35.
  let speedScore = 100;
  if (ratio <= 0.5) {
    speedScore = 100;
  } else if (ratio <= 1.0) {
    speedScore = Math.round(100 - ((ratio - 0.5) / 0.5) * 25);
  } else {
    speedScore = Math.max(35, Math.round(75 - (ratio - 1.0) * 35));
  }

  // Turn economy: 0 simulator retries = 100 (First-Shot), 1 = 88, 2 = 74, etc.
  const turnScore =
    opts.turnsUsed <= 0
      ? 100
      : opts.turnsUsed === 1
        ? 88
        : Math.max(40, 74 - (opts.turnsUsed - 2) * 12);

  // Hint economy: 0 hints = 100, -18 per hint revealed (floor 40).
  const hintScore = Math.max(40, 100 - opts.hintsUsed * 18);

  const rawEfficiency = Math.round(
    evaluation.score * 0.65 + speedScore * 0.15 + turnScore * 0.1 + hintScore * 0.1,
  );
  // Quality gate: fast junk submissions cannot earn a high efficiency score.
  const efficiency =
    evaluation.score < 40 ? Math.min(evaluation.score, rawEfficiency) : rawEfficiency;
  const grade = gradeFromScore(efficiency);

  const bonuses: string[] = [];
  let bonusXp = 0;

  if (evaluation.score >= 60) {
    if (opts.turnsUsed === 0) {
      bonuses.push("One-Shot Clear (+20 XP)");
      bonusXp += 20;
    }
    if (opts.hintsUsed === 0) {
      bonuses.push("Zero-Assist (+15 XP)");
      bonusXp += 15;
    }
    if (ratio <= 0.6) {
      bonuses.push("Speedrunner (+15 XP)");
      bonusXp += 15;
    }
    if (opts.isFirstClear) {
      bonuses.push("First Clear (+30 XP)");
      bonusXp += 30;
    }
  }

  const signalDensity = computeSignalDensity(challenge, response);
  if (signalDensity === "Concise" && evaluation.score >= 75) {
    bonuses.push("High Signal-to-Noise (+10 XP)");
    bonusXp += 10;
  }

  const streakMult = 1 + Math.min(0.5, opts.currentStreak * 0.1);
  if (opts.currentStreak > 0 && evaluation.score >= 60) {
    bonuses.push(`${opts.currentStreak}x Streak Multiplier`);
  }

  const baseXp = Math.round(efficiency * DIFFICULTY_MULT[challenge.difficulty]);
  const xpEarned = Math.round((baseXp + bonusXp) * streakMult);

  return {
    efficiency,
    grade,
    rubricScore: evaluation.score,
    speedScore,
    turnScore,
    hintScore,
    parSeconds,
    xpEarned,
    bonuses,
    signalDensity,
  };
}

export function submissionEfficiency(s: Submission): number {
  if (typeof s.efficiency === "number") return s.efficiency;
  return s.score;
}

export function submissionXp(s: Submission): number {
  if (typeof s.xp === "number") return s.xp;
  const ch = challengeById(s.challengeId);
  const mult = ch ? DIFFICULTY_MULT[ch.difficulty] : 1;
  return Math.round(s.score * mult);
}

export function getRankForXp(xp: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    const tier = RANK_TIERS[i];
    if (tier && xp >= tier.minXp) return tier;
  }
  return RANK_TIERS[0]!;
}

export interface PlayerStats {
  totalXp: number;
  rank: RankTier;
  rankProgress: number;
  averageEfficiency: number;
  averageRubric: number;
  completedIds: string[];
  bestByChallenge: Record<string, Submission>;
  currentStreak: number;
  bestStreak: number;
  totalSeconds: number;
  domainScores: { domain: DomainId; label: string; score: number; attempts: number }[];
  weakestDomain: { domain: DomainId; label: string; score: number } | null;
}

export function computePlayerStats(state: ArenaState): PlayerStats {
  const missionXp = state.submissions.reduce((acc, s) => acc + submissionXp(s), 0);
  const blitzXp = (state.blitzRuns ?? []).reduce((acc, b) => acc + b.xpEarned, 0);
  const totalXp = missionXp + blitzXp;
  const rank = getRankForXp(totalXp);
  const rankProgress =
    rank.nextXp === null
      ? 100
      : Math.min(100, Math.round(((totalXp - rank.minXp) / (rank.nextXp - rank.minXp)) * 100));

  const bestByChallenge: Record<string, Submission> = {};
  for (const s of state.submissions) {
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
  for (const s of state.submissions) {
    if (submissionEfficiency(s) >= 70) {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const totalSeconds = state.submissions.reduce((a, s) => a + s.seconds, 0);

  const domainScores = DOMAINS.map((d) => {
    const domainChallenges = CHALLENGES.filter((c) => c.domain === d.id);
    const matching = domainChallenges
      .map((c) => bestByChallenge[c.id])
      .filter((x): x is Submission => Boolean(x));
    const score = matching.length
      ? Math.round(matching.reduce((a, s) => a + submissionEfficiency(s), 0) / matching.length)
      : 0;
    return { domain: d.id, label: d.label, score, attempts: matching.length };
  });

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
    completedIds,
    bestByChallenge,
    currentStreak,
    bestStreak,
    totalSeconds,
    domainScores,
    weakestDomain,
  };
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export function computeBadges(state: ArenaState, stats: PlayerStats): BadgeDef[] {
  const subs = state.submissions;
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
  const hasTypeHigh = (type: Challenge["type"]) =>
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

export function recommendNextChallenge(state: ArenaState): Challenge {
  const stats = computePlayerStats(state);
  const unplayed = CHALLENGES.filter((c) => !stats.bestByChallenge[c.id]);
  if (unplayed.length > 0) {
    if (stats.weakestDomain) {
      const match = unplayed.find((c) => c.domain === stats.weakestDomain!.domain);
      if (match) return match;
    }
    return unplayed[0]!;
  }
  // Otherwise suggest the lowest-scoring challenge to improve efficiency.
  let lowest = CHALLENGES[0]!;
  for (const c of CHALLENGES) {
    const lowSub = stats.bestByChallenge[lowest.id];
    const curSub = stats.bestByChallenge[c.id];
    const ls = lowSub ? submissionEfficiency(lowSub) : 0;
    const cs = curSub ? submissionEfficiency(curSub) : 0;
    if (cs < ls) lowest = c;
  }
  return lowest;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
