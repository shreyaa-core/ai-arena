import { useEffect, useState } from "react";

const LEGACY_KEY = "ai-arena.state.v1";
const STORAGE_KEY = "ai-arena.state.v2";
const CHANGE_EVENT = "ai-arena:state-changed";

/**
 * Create a clean default guest state for AI Arena.
 * Preserves compatibility with legacy v1 submissions and saved lists.
 */
export function createEmptyArenaState() {
  return {
    version: 2,
    profile: {
      alias: "Guest Pilot",
      experience: null,
      goal: null,
      careerPath: "everyday",
      language: "en",
      onboarded: false,
      email: null,
      character: {
        id: "scout-nova",
        avatar: "astronaut",
        suitColor: "#14b8a6",
        visorColor: "#f59e0b",
        title: "AI Apprentice",
      },
    },
    coins: 50,
    inventory: ["badge-starter", "outfit-standard", "theme-midnight"],
    equipped: {
      outfit: "outfit-standard",
      companion: "nova-classic",
      theme: "theme-midnight",
      title: "AI Apprentice",
    },
    unlockedWorlds: ["prompt"],
    restoredWorlds: [],
    tutorialsCompleted: [],
    skillNodesUnlocked: [],
    submissions: [],
    assessments: [],
    saved: [],
    blitzRuns: [],
    dailyTargetProgress: {
      date: new Date().toISOString().slice(0, 10),
      missionsToday: 0,
      claimed: false,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      narration: false,
      untimedMode: false,
      lowGraphics: false,
    },
  };
}

export function createDemoArenaState() {
  const now = Date.now();
  const base = createEmptyArenaState();
  return {
    ...base,
    profile: {
      ...base.profile,
      alias: "Nova Explorer",
      experience: "regular",
      goal: "productivity",
      careerPath: "developer",
      onboarded: true,
    },
    coins: 240,
    unlockedWorlds: ["prompt", "evaluation", "tools"],
    restoredWorlds: ["prompt"],
    tutorialsCompleted: ["tut-prompt-101", "tut-verify-101"],
    skillNodesUnlocked: ["skill-prompt-foundation", "skill-eval-foundation"],
    submissions: [
      {
        id: "demo-1",
        challengeId: "spot-hallucinations-python",
        mode: "campaign",
        score: 92,
        efficiency: 91,
        grade: "S",
        xp: 175,
        coins: 45,
        hintsUsed: 0,
        turnsUsed: 0,
        criteria: [
          { criterion: "verification", score: 55, max: 60, feedback: "Caught all 3 flawed claims." },
          { criterion: "specificity", score: 40, max: 40, feedback: "No accurate sentences wrongly flagged." },
        ],
        seconds: 165,
        at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: "demo-2",
        challengeId: "pick-best-spreadsheet",
        mode: "campaign",
        score: 86,
        efficiency: 88,
        grade: "A",
        xp: 138,
        coins: 35,
        hintsUsed: 0,
        turnsUsed: 0,
        criteria: [
          { criterion: "relevance", score: 60, max: 60, feedback: "Response B: Exact formula and edge case." },
          { criterion: "clarity", score: 26, max: 40, feedback: "Found: notes it is specific/testable." },
        ],
        seconds: 120,
        at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: "demo-3",
        challengeId: "privacy-before-paste",
        mode: "campaign",
        score: 95,
        efficiency: 94,
        grade: "S",
        xp: 145,
        coins: 45,
        hintsUsed: 0,
        turnsUsed: 0,
        criteria: [
          { criterion: "safety", score: 50, max: 50, feedback: "Identified 3 of 3 high-risk items." },
          { criterion: "specificity", score: 45, max: 50, feedback: "Calibration across all items: 92%." },
        ],
        seconds: 110,
        at: new Date(now - 1000 * 60 * 45).toISOString(),
      },
    ],
    saved: ["brief-research-assistant", "support-triage-pipeline"],
    blitzRuns: [
      {
        id: "demo-blitz-1",
        preset: "Core AI Trio",
        averageEfficiency: 88,
        grade: "A",
        totalSeconds: 310,
        xpEarned: 160,
        at: new Date(now - 1000 * 60 * 30).toISOString(),
      },
    ],
  };
}

function migrateLegacyV1(rawV1) {
  const base = createEmptyArenaState();
  return {
    ...base,
    profile: {
      ...base.profile,
      ...(rawV1.profile ?? {}),
    },
    submissions: Array.isArray(rawV1.submissions) ? rawV1.submissions : [],
    saved: Array.isArray(rawV1.saved) ? rawV1.saved : [],
    blitzRuns: Array.isArray(rawV1.blitzRuns) ? rawV1.blitzRuns : [],
  };
}

export function loadArenaState() {
  if (typeof window === "undefined") return createEmptyArenaState();
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY);
    const base = createEmptyArenaState();
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      return {
        ...base,
        ...parsed,
        profile: {
          ...base.profile,
          ...(parsed.profile ?? {}),
          character: {
            ...base.profile.character,
            ...(parsed.profile?.character ?? {}),
          },
        },
        equipped: { ...base.equipped, ...(parsed.equipped ?? {}) },
        accessibility: { ...base.accessibility, ...(parsed.accessibility ?? {}) },
        dailyTargetProgress: {
          ...base.dailyTargetProgress,
          ...(parsed.dailyTargetProgress ?? {}),
          date:
            parsed.dailyTargetProgress?.date === base.dailyTargetProgress.date
              ? parsed.dailyTargetProgress.date
              : base.dailyTargetProgress.date,
          missionsToday:
            parsed.dailyTargetProgress?.date === base.dailyTargetProgress.date
              ? parsed.dailyTargetProgress.missionsToday || 0
              : 0,
          claimed:
            parsed.dailyTargetProgress?.date === base.dailyTargetProgress.date
              ? Boolean(parsed.dailyTargetProgress.claimed)
              : false,
        },
      };
    }

    const rawV1 = window.localStorage.getItem(LEGACY_KEY);
    if (rawV1) {
      const migrated = migrateLegacyV1(JSON.parse(rawV1));
      saveArenaState(migrated);
      return migrated;
    }

    return base;
  } catch {
    return createEmptyArenaState();
  }
}

export function saveArenaState(next) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignore quota errors.
    }
  }
  return next;
}

export function recordSubmission(sub) {
  const cur = loadArenaState();
  const today = new Date().toISOString().slice(0, 10);
  const dailyCount =
    cur.dailyTargetProgress?.date === today ? (cur.dailyTargetProgress.missionsToday || 0) + 1 : 1;

  const isAssessment = sub.mode === "assessment";
  const next = {
    ...cur,
    coins: (cur.coins || 0) + (sub.coins || 0),
    submissions: isAssessment ? cur.submissions : [...cur.submissions, sub],
    assessments: isAssessment ? [...(cur.assessments || []), sub] : cur.assessments || [],
    dailyTargetProgress: {
      date: today,
      missionsToday: dailyCount,
      claimed: cur.dailyTargetProgress?.date === today ? Boolean(cur.dailyTargetProgress.claimed) : false,
    },
  };
  return saveArenaState(next);
}

export function recordBlitzRun(run) {
  const cur = loadArenaState();
  return saveArenaState({
    ...cur,
    coins: (cur.coins || 0) + 25,
    blitzRuns: [...(cur.blitzRuns ?? []), run],
  });
}

export function toggleSavedChallenge(challengeId) {
  const cur = loadArenaState();
  const exists = cur.saved.includes(challengeId);
  return saveArenaState({
    ...cur,
    saved: exists ? cur.saved.filter((id) => id !== challengeId) : [...cur.saved, challengeId],
  });
}

export function updateProfile(patch) {
  const cur = loadArenaState();
  return saveArenaState({
    ...cur,
    profile: {
      ...cur.profile,
      ...patch,
      character: {
        ...cur.profile.character,
        ...(patch.character ?? {}),
      },
    },
  });
}

export function updateAccessibility(patch) {
  const cur = loadArenaState();
  return saveArenaState({
    ...cur,
    accessibility: { ...cur.accessibility, ...patch },
  });
}

export function markTutorialComplete(tutorialId) {
  const cur = loadArenaState();
  if (cur.tutorialsCompleted.includes(tutorialId)) return cur;
  return saveArenaState({
    ...cur,
    coins: (cur.coins || 0) + 20,
    tutorialsCompleted: [...cur.tutorialsCompleted, tutorialId],
  });
}

export function unlockWorldLocal(worldId) {
  const cur = loadArenaState();
  if (cur.unlockedWorlds.includes(worldId)) return cur;
  return saveArenaState({
    ...cur,
    unlockedWorlds: [...cur.unlockedWorlds, worldId],
  });
}

export function restoreWorldLocal(worldId) {
  const cur = loadArenaState();
  if (cur.restoredWorlds.includes(worldId)) return cur;
  return saveArenaState({
    ...cur,
    coins: (cur.coins || 0) + 100,
    restoredWorlds: [...cur.restoredWorlds, worldId],
  });
}

export function unlockSkillNodeLocal(skillId) {
  const cur = loadArenaState();
  if (cur.skillNodesUnlocked.includes(skillId)) return cur;
  return saveArenaState({
    ...cur,
    skillNodesUnlocked: [...cur.skillNodesUnlocked, skillId],
  });
}

export function claimDailyBonusLocal() {
  const cur = loadArenaState();
  if (cur.dailyTargetProgress.claimed || cur.dailyTargetProgress.missionsToday < 3) return cur;
  return saveArenaState({
    ...cur,
    coins: (cur.coins || 0) + 60,
    dailyTargetProgress: { ...cur.dailyTargetProgress, claimed: true },
  });
}

export function purchaseItemLocal(item) {
  const cur = loadArenaState();
  if (cur.inventory.includes(item.id)) return { ok: false, error: "Already owned", state: cur };
  if (cur.coins < item.cost) return { ok: false, error: "Insufficient coins", state: cur };
  const next = saveArenaState({
    ...cur,
    coins: cur.coins - item.cost,
    inventory: [...cur.inventory, item.id],
  });
  return { ok: true, state: next };
}

export function equipItemLocal(slot, itemId) {
  const cur = loadArenaState();
  if (!cur.inventory.includes(itemId)) return cur;
  return saveArenaState({
    ...cur,
    equipped: { ...cur.equipped, [slot]: itemId },
  });
}

export function resetArenaState() {
  return saveArenaState(createEmptyArenaState());
}

export function seedDemoArenaState() {
  return saveArenaState(createDemoArenaState());
}

export function useArenaState() {
  const [state, setState] = useState(() => createEmptyArenaState());

  useEffect(() => {
    setState(loadArenaState());
    const sync = () => setState(loadArenaState());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}
