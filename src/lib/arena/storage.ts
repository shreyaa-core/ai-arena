import { useEffect, useState } from "react";
import type { ArenaState, BlitzRecord, Profile, Submission } from "./types";

const STORAGE_KEY = "ai-arena.state.v1";
const CHANGE_EVENT = "ai-arena:state-changed";

export function createEmptyArenaState(): ArenaState {
  return {
    version: 1,
    profile: {
      alias: "Guest Operator",
      experience: null,
      goal: null,
      onboarded: false,
      email: null,
    },
    submissions: [],
    saved: [],
    blitzRuns: [],
  };
}

export function createDemoArenaState(): ArenaState {
  const now = Date.now();
  return {
    version: 1,
    profile: {
      alias: "Guest Operator",
      experience: "regular",
      goal: "productivity",
      onboarded: true,
      email: null,
    },
    submissions: [
      {
        id: "demo-1",
        challengeId: "spot-hallucinations-python",
        score: 92,
        efficiency: 91,
        grade: "S",
        xp: 175,
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
        score: 86,
        efficiency: 88,
        grade: "A",
        xp: 138,
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
        score: 95,
        efficiency: 94,
        grade: "S",
        xp: 145,
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

export function loadArenaState(): ArenaState {
  if (typeof window === "undefined") return createEmptyArenaState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyArenaState();
    const parsed = JSON.parse(raw) as Partial<ArenaState>;
    const base = createEmptyArenaState();
    return {
      version: 1,
      profile: { ...base.profile, ...(parsed.profile ?? {}) },
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      blitzRuns: Array.isArray(parsed.blitzRuns) ? parsed.blitzRuns : [],
    };
  } catch {
    return createEmptyArenaState();
  }
}

export function saveArenaState(next: ArenaState): ArenaState {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Ignore storage quota errors in restricted environments.
    }
  }
  return next;
}

export function recordSubmission(sub: Submission): ArenaState {
  const cur = loadArenaState();
  return saveArenaState({
    ...cur,
    submissions: [...cur.submissions, sub],
  });
}

export function recordBlitzRun(run: BlitzRecord): ArenaState {
  const cur = loadArenaState();
  return saveArenaState({
    ...cur,
    blitzRuns: [...(cur.blitzRuns ?? []), run],
  });
}

export function toggleSavedChallenge(challengeId: string): ArenaState {
  const cur = loadArenaState();
  const exists = cur.saved.includes(challengeId);
  return saveArenaState({
    ...cur,
    saved: exists ? cur.saved.filter((id) => id !== challengeId) : [...cur.saved, challengeId],
  });
}

export function updateProfile(patch: Partial<Profile>): ArenaState {
  const cur = loadArenaState();
  return saveArenaState({
    ...cur,
    profile: { ...cur.profile, ...patch },
  });
}

export function resetArenaState(): ArenaState {
  return saveArenaState(createEmptyArenaState());
}

export function seedDemoArenaState(): ArenaState {
  return saveArenaState(createDemoArenaState());
}

export function useArenaState() {
  const [state, setState] = useState<ArenaState>(() => createEmptyArenaState());

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
