import { useCallback } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { GameHUD } from "./components/game/GameHUD.jsx";
import { NovaCompanion } from "./components/game/NovaCompanion.jsx";
import { OnboardingModal } from "./components/game/OnboardingModal.jsx";
import { ActiveSystemModal } from "./components/game/PauseSettingsModals.jsx";
import { PhaserViewport } from "./components/game/PhaserViewport.jsx";
import { TitleScreen } from "./components/game/TitleScreen.jsx";
import { GameplayModesModal } from "./components/modes/GameplayModesModal.jsx";
import { MissionModal } from "./components/modes/MissionModal.jsx";
import { ProgressionModals } from "./components/modes/ProgressionModals.jsx";
import { Toaster } from "./components/ui/sonner.jsx";
import { GameProvider, useGame } from "./context/GameContext.jsx";
import { playClick } from "./utils/sound.js";

function GameRoot() {
  const {
    state,
    stats,
    screen,
    activeWorldId,
    activeModal,
    setActiveModal,
    enterTerritory,
    openMission,
    collectWorldShard,
  } = useGame();

  const handleSelectWorld = useCallback(
    ({ world, unlocked }) => {
      playClick();
      if (!unlocked) {
        toast.info(`${world.name} unlocks at ${world.requiredXp} XP (currently ${stats.totalXp} XP).`);
        return;
      }
      enterTerritory(world.id);
    },
    [enterTerritory, stats.totalXp],
  );

  const handleActivateStation = useCallback(
    (station) => {
      playClick();
      if (station.kind === "npc") {
        setActiveModal({ type: "npc", data: station.payload });
        return;
      }
      if (station.kind === "tutorial") {
        setActiveModal({ type: "tutorial", data: { tutorialId: station.id } });
        return;
      }
      if (station.kind === "collectible") {
        const picked = collectWorldShard(station.payload.worldId, station.payload.label);
        if (picked) toast.success(`Collected ${picked} (+35 XP)!`);
        return;
      }
      if (station.kind === "mode") {
        setActiveModal({ type: station.payload.mode });
        return;
      }
      if (station.kind === "mission" || station.kind === "boss") {
        openMission(station.id, station.kind === "boss" ? "boss" : "campaign");
      }
    },
    [collectWorldShard, openMission, setActiveModal],
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0B132B] text-[#F1F5F9]">
      <PhaserViewport
        screen={screen}
        activeWorldId={activeWorldId}
        state={state}
        stats={stats}
        onSelectWorld={handleSelectWorld}
        onActivateStation={handleActivateStation}
      />

      {screen === "title" ? <TitleScreen /> : <GameHUD />}

      {screen !== "title" && <NovaCompanion />}

      {activeModal?.type === "onboarding" && <OnboardingModal />}
      <ActiveSystemModal />
      <MissionModal />
      <GameplayModesModal />
      <ProgressionModals />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<GameRoot />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;
