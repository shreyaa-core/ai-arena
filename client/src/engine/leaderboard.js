import { computePlayerStats } from "./game.js";

const DEMO_CONTENDERS = [
  { id: "bot-1", alias: "NovaPrompt", rankTitle: "AI Grandmaster", efficiency: 94, xp: 1740, cleared: 12, bestStreak: 9, isBot: true },
  { id: "bot-2", alias: "RubricFox", rankTitle: "Verification Ace", efficiency: 90, xp: 1290, cleared: 10, bestStreak: 7, isBot: true },
  { id: "bot-3", alias: "ZeroShotKai", rankTitle: "Workflow Architect", efficiency: 86, xp: 890, cleared: 8, bestStreak: 5, isBot: true },
  { id: "bot-4", alias: "SignalScout", rankTitle: "Tactical Operator", efficiency: 81, xp: 540, cleared: 6, bestStreak: 4, isBot: true },
  { id: "bot-5", alias: "TokenTamer", rankTitle: "Tactical Operator", efficiency: 76, xp: 410, cleared: 5, bestStreak: 3, isBot: true },
  { id: "bot-6", alias: "DriftCheck", rankTitle: "Signal Seeker", efficiency: 69, xp: 240, cleared: 3, bestStreak: 2, isBot: true },
  { id: "bot-7", alias: "PromptCub", rankTitle: "Prompt Novice", efficiency: 58, xp: 110, cleared: 2, bestStreak: 1, isBot: true },
];

export function buildLeaderboard(state, sort = "efficiency", remoteEntries = null) {
  const stats = computePlayerStats(state);
  const you = {
    id: "you",
    alias: state.profile?.alias || "Guest Operator",
    rankTitle: stats.rank.title,
    efficiency: stats.averageEfficiency,
    xp: stats.totalXp,
    cleared: stats.completedIds.length,
    bestStreak: stats.bestStreak,
    isYou: true,
    isBot: false,
  };

  const pool = Array.isArray(remoteEntries) && remoteEntries.length > 0
    ? [...remoteEntries]
    : [...DEMO_CONTENDERS];

  const hasYou = pool.some((e) => e.isYou || e.alias === you.alias);
  const merged = hasYou ? pool : [...pool, you];

  return merged.sort((a, b) => {
    if (sort === "xp") return b.xp - a.xp || b.efficiency - a.efficiency;
    if (sort === "cleared") return b.cleared - a.cleared || b.efficiency - a.efficiency;
    return b.efficiency - a.efficiency || b.xp - a.xp;
  });
}
