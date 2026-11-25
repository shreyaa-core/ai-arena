import { computePlayerStats } from "./game";
import type { ArenaState } from "./types";

export interface LeaderboardEntry {
  id: string;
  alias: string;
  rankTitle: string;
  efficiency: number;
  xp: number;
  cleared: number;
  bestStreak: number;
  isYou?: boolean;
}

const DEMO_CONTENDERS: LeaderboardEntry[] = [
  { id: "bot-1", alias: "NovaPrompt", rankTitle: "AI Grandmaster", efficiency: 94, xp: 1740, cleared: 12, bestStreak: 9 },
  { id: "bot-2", alias: "RubricFox", rankTitle: "Verification Ace", efficiency: 90, xp: 1290, cleared: 10, bestStreak: 7 },
  { id: "bot-3", alias: "ZeroShotKai", rankTitle: "Workflow Architect", efficiency: 86, xp: 890, cleared: 8, bestStreak: 5 },
  { id: "bot-4", alias: "SignalScout", rankTitle: "Tactical Operator", efficiency: 81, xp: 540, cleared: 6, bestStreak: 4 },
  { id: "bot-5", alias: "TokenTamer", rankTitle: "Tactical Operator", efficiency: 76, xp: 410, cleared: 5, bestStreak: 3 },
  { id: "bot-6", alias: "DriftCheck", rankTitle: "Signal Seeker", efficiency: 69, xp: 240, cleared: 3, bestStreak: 2 },
  { id: "bot-7", alias: "PromptCub", rankTitle: "Prompt Novice", efficiency: 58, xp: 110, cleared: 2, bestStreak: 1 },
];

export type LeaderboardSort = "efficiency" | "xp" | "cleared";

export function buildLeaderboard(state: ArenaState, sort: LeaderboardSort = "efficiency"): LeaderboardEntry[] {
  const stats = computePlayerStats(state);
  const you: LeaderboardEntry = {
    id: "you",
    alias: state.profile.alias || "Guest Operator",
    rankTitle: stats.rank.title,
    efficiency: stats.averageEfficiency,
    xp: stats.totalXp,
    cleared: stats.completedIds.length,
    bestStreak: stats.bestStreak,
    isYou: true,
  };

  return [...DEMO_CONTENDERS, you].sort((a, b) => {
    if (sort === "xp") return b.xp - a.xp || b.efficiency - a.efficiency;
    if (sort === "cleared") return b.cleared - a.cleared || b.efficiency - a.efficiency;
    return b.efficiency - a.efficiency || b.xp - a.xp;
  });
}
