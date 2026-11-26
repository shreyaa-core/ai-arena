import { useEffect, useRef } from "react";
import { AVATAR_COLORS, CHARACTERS } from "../../data/characters.js";
import { WORLDS } from "../../data/worlds.js";
import { createPhaserGame } from "../../game/phaserConfig.js";
import { gameEvents } from "../../game/gameEvents.js";

export function PhaserViewport({
  screen,
  activeWorldId,
  state,
  stats,
  onSelectWorld,
  onActivateStation,
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  const charId = state.profile?.character?.id || state.profile?.characterId;
  const charDef = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  const suitStr = state.profile?.character?.suitColor || state.profile?.avatarColor;
  const colorDef = AVATAR_COLORS.find((c) => c.hex === suitStr);
  const suitHex = colorDef ? colorDef.num : charDef.suitHex;
  const visorHex = charDef.visorHex;

  // Initialize Phaser once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const game = createPhaserGame(el);
    gameRef.current = game;

    const unsubWorld = gameEvents.on("world:select", onSelectWorld);
    const unsubStation = gameEvents.on("station:activate", onActivateStation);

    return () => {
      unsubWorld();
      unsubStation();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Re-wire latest callbacks cleanly
  useEffect(() => {
    const unsubWorld = gameEvents.on("world:select", onSelectWorld);
    const unsubStation = gameEvents.on("station:activate", onActivateStation);
    return () => {
      unsubWorld();
      unsubStation();
    };
  }, [onSelectWorld, onActivateStation]);

  // Switch active Phaser scene cleanly when screen, worldId, or progression changes
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    const syncScene = () => {
      const targetKey =
        screen === "title"
          ? "TitleScene"
          : screen === "worldmap"
            ? "WorldMapScene"
            : "TerritoryScene";

      const payload = {
        worldId: activeWorldId,
        completedIds: stats.completedIds,
        completedTutorials: state.tutorialsCompleted || [],
        unlockedWorlds: state.unlockedWorlds || ["prompt-academy"],
        restoredWorlds: state.restoredWorlds || [],
        xp: stats.totalXp,
        suitHex,
        visorHex,
        alias: state.profile?.alias || "Explorer",
      };

      for (const s of ["TitleScene", "WorldMapScene", "TerritoryScene"]) {
        if (s !== targetKey && game.scene.isActive(s)) {
          game.scene.stop(s);
        }
      }
      game.scene.start(targetKey, payload);
    };

    if (game.isBooted) {
      syncScene();
    } else {
      game.events.once("ready", syncScene);
    }
  }, [
    screen,
    activeWorldId,
    stats.completedIds.length,
    stats.totalXp,
    (state.tutorialsCompleted || []).length,
    (state.restoredWorlds || []).length,
    (state.unlockedWorlds || []).length,
    suitHex,
    visorHex,
    state.profile?.alias,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B132B]">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Interactive AI Arena Game Canvas"
      />
      {/* Screen-reader & keyboard quick navigation fallback for territories */}
      {screen === "worldmap" && (
        <nav aria-label="Accessible Territory Selector" className="sr-only">
          {WORLDS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() =>
                onSelectWorld({
                  world: w,
                  unlocked:
                    (state.unlockedWorlds || []).includes(w.id) ||
                    stats.totalXp >= w.requiredXp,
                })
              }
            >
              Enter {w.name}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
