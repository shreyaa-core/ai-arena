import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { challengeById } from "../data/challenges.js";
import { worldById, WORLDS } from "../data/worlds.js";
import { computeBadges, computePlayerStats, recommendNextChallenge } from "../engine/game.js";
import { getTranslations } from "../i18n/index.js";
import { api } from "../services/apiClient.js";
import { playCoin, playLevelUp, playResult, startAmbientLoop, stopAmbientLoop } from "../utils/sound.js";
import {
  claimDailyBonusLocal,
  equipItemLocal,
  markTutorialComplete,
  purchaseItemLocal,
  recordBlitzRun,
  recordSubmission,
  resetArenaState,
  restoreWorldLocal,
  unlockSkillNodeLocal,
  unlockWorldLocal,
  updateAccessibility,
  updateProfile,
  useArenaState,
} from "../utils/storage.js";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const state = useArenaState();
  const [screen, setScreen] = useState("title");
  const [activeWorldId, setActiveWorldId] = useState("prompt-academy");
  const [activeModal, setActiveModal] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [serverHealth, setServerHealth] = useState({
    checked: false,
    dbStatus: "checking",
    groqConfigured: false,
    geminiConfigured: false,
    multiplayer: true,
  });

  const stats = useMemo(() => computePlayerStats(state), [state]);
  const badges = useMemo(() => computeBadges(state, stats), [state, stats]);
  const recommended = useMemo(() => recommendNextChallenge(state), [state]);
  const t = useMemo(() => getTranslations(state.profile?.language || "en"), [state.profile?.language]);
  const activeWorld = useMemo(() => worldById(activeWorldId), [activeWorldId]);
  const hasProgress = (state.submissions?.length || 0) > 0 || Boolean(state.profile?.onboarded || state.profile?.onboardingCompleted);

  useEffect(() => {
    const el = document.documentElement;
    const a11y = state.accessibility || {};
    el.classList.toggle("a11y-high-contrast", Boolean(a11y.highContrast));
    el.classList.toggle("a11y-large-text", Boolean(a11y.largeText));
    el.classList.toggle("a11y-reduced-motion", Boolean(a11y.reducedMotion));
  }, [state.accessibility]);

  useEffect(() => {
    if (screen !== "title") {
      startAmbientLoop();
    } else {
      stopAmbientLoop();
    }
    return () => stopAmbientLoop();
  }, [screen]);

  useEffect(() => {
    for (const w of WORLDS) {
      if (stats.totalXp >= w.requiredXp && !(state.unlockedWorlds || []).includes(w.id)) {
        unlockWorldLocal(w.id);
      }
    }
  }, [stats.totalXp, state.unlockedWorlds]);

  useEffect(() => {
    let mounted = true;
    api
      .health()
      .then((h) => {
        if (!mounted) return;
        setServerHealth({
          checked: true,
          dbStatus: h.db?.status || "unconfigured",
          groqConfigured: Boolean(h.ai?.groqConfigured),
          geminiConfigured: Boolean(h.ai?.geminiConfigured),
          multiplayer: Boolean(h.multiplayer),
        });
      })
      .catch(() => {
        if (!mounted) return;
        setServerHealth((prev) => ({ ...prev, checked: true, dbStatus: "offline" }));
      });

    api
      .me()
      .then((res) => {
        if (mounted && res?.user) setAuthUser(res.user);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const enterWorldMap = useCallback(() => {
    setScreen("worldmap");
    setActiveModal(null);
  }, []);

  const enterTerritory = useCallback((worldId) => {
    setActiveWorldId(worldId);
    setScreen("territory");
    setActiveModal(null);
  }, []);

  const openMission = useCallback((challengeId, mode = "campaign") => {
    const ch = typeof challengeId === "string" ? challengeById(challengeId) : challengeId;
    if (!ch) return;
    setActiveModal({ type: "mission", data: { challenge: ch, mode } });
  }, []);

  const saveMissionResult = useCallback(
    async ({ challenge, evaluation, breakdown, response, mode = "campaign" }) => {
      const next = recordSubmission({
        challengeId: challenge.id,
        score: evaluation.score,
        efficiency: breakdown.efficiency,
        grade: breakdown.grade,
        xp: breakdown.xpEarned,
        coins: breakdown.coinsEarned,
        hintsUsed: 0,
        turnsUsed: 0,
        criteria: evaluation.criteria,
        seconds: breakdown.secondsSpent || 120,
        mode,
      });

      playResult(breakdown.efficiency);
      if (challenge.isBoss && evaluation.score >= 60) {
        restoreWorldLocal(challenge.worldId);
        playLevelUp();
      }

      if (authUser) {
        api
          .submitAttempt({
            missionId: challenge.id,
            mode: challenge.isBoss ? "boss" : mode === "training" ? "training" : "campaign",
            domain: challenge.domain,
            rubricScore: evaluation.score,
            efficiency: breakdown.efficiency,
            grade: breakdown.grade,
            xpEarned: breakdown.xpEarned,
            coinsEarned: breakdown.coinsEarned,
            secondsSpent: breakdown.secondsSpent || 120,
            evaluatorType: evaluation.evaluator || "deterministic",
            responseJson: response,
          })
          .catch(() => {});
      }
      return next;
    },
    [authUser],
  );

  const collectWorldShard = useCallback(
    (worldId, shardName) => {
      const key = `collectible:${worldId}`;
      if ((state.tutorialsCompleted || []).includes(key)) return false;
      markTutorialComplete(key);
      recordBlitzRun({
        id: `shard-${worldId}`,
        count: 1,
        averageScore: 100,
        xpEarned: 35,
        seconds: 5,
      });
      playCoin();
      return shardName;
    },
    [state.tutorialsCompleted],
  );

  const value = {
    state,
    stats,
    badges,
    recommended,
    t,
    screen,
    setScreen,
    activeWorldId,
    activeWorld,
    setActiveWorldId,
    activeModal,
    setActiveModal,
    authUser,
    setAuthUser,
    serverHealth,
    hasProgress,
    enterWorldMap,
    enterTerritory,
    openMission,
    saveMissionResult,
    collectWorldShard,
    actions: {
      updateProfile: (patch) => {
        updateProfile(patch);
        if (authUser) api.updateMe({ profile: patch }).catch(() => {});
      },
      updateAccessibility: (patch) => {
        updateAccessibility(patch);
        if (authUser) api.updateMe({ settings: patch }).catch(() => {});
      },
      completeTutorial: (tutId) => markTutorialComplete(tutId),
      unlockSkill: (skillId) => {
        unlockSkillNodeLocal(skillId);
        playLevelUp();
      },
      claimDailyBonus: () => {
        const res = claimDailyBonusLocal();
        if (!res.alreadyClaimed) playCoin();
        if (authUser) api.claimDaily().catch(() => {});
        return res;
      },
      buyItem: (item) => {
        const res = purchaseItemLocal(item);
        if (res.ok) playCoin();
        if (authUser) api.buyItem({ itemId: item.id, idempotencyKey: `${item.id}-${Date.now()}` }).catch(() => {});
        return res;
      },
      equipItem: (slot, itemId) => equipItemLocal(slot, itemId),
      resetProgress: () => resetArenaState(),
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
