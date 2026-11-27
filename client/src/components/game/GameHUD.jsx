import {
  Award,
  Coins,
  Compass,
  Flame,
  Gift,
  Pause,
  ShoppingBag,
  Sparkles,
  Swords,
  TreePine,
  Trophy,
  Volume2,
  VolumeX,
  FlaskConical,
  DoorOpen,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGame } from "../../context/GameContext.jsx";
import { playClick, toggleSoundEnabled, useSoundEnabled } from "../../utils/sound.js";
import { Button } from "../ui/button.jsx";
import { Progress } from "../ui/progress.jsx";

export function GameHUD() {
  const {
    state,
    stats,
    t,
    screen,
    activeWorld,
    setScreen,
    openMission,
    setActiveModal,
    actions,
  } = useGame();
  const soundOn = useSoundEnabled();
  const [stationDrawerOpen, setStationDrawerOpen] = useState(false);

  const dailyClaim = () => {
    const res = actions.claimDailyBonus();
    if (res.alreadyClaimed) {
      toast.info("Daily supply drop already claimed today!");
    } else {
      toast.success(`Daily Bonus: +${res.coinBonus} Coins!`);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 md:p-5">
      {/* Top HUD Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Player Status Plate */}
        <div className="pointer-events-auto hud-panel flex items-center gap-3 rounded-xl px-3.5 py-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 font-display text-sm font-bold text-slate-950"
            style={{ backgroundColor: state.profile?.character?.suitColor || state.profile?.avatarColor || "#14B8A6" }}
          >
            {(state.profile?.alias || "EX").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-[148px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-sm font-semibold text-white">
                {state.profile?.alias || "Explorer"}
              </span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                AEI {stats.aei}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-300">
              <span>{stats.rank.title}</span>
              <span className="font-mono">{stats.totalXp} XP</span>
            </div>
            <Progress value={stats.rankProgress} className="mt-1 h-1.5" />
          </div>

          <div className="flex items-center gap-2 border-l border-slate-700 pl-3 font-mono text-xs">
            <span className="flex items-center gap-1 text-amber-400" title="Arena Coins">
              <Coins className="h-3.5 w-3.5" />
              {state.coins ?? 100}
            </span>
            <span className="flex items-center gap-1 text-teal-400" title="Best Streak">
              <Flame className="h-3.5 w-3.5" />
              {stats.currentStreak}
            </span>
          </div>
        </div>

        {/* Center Location / Territory Pill */}
        <div className="pointer-events-auto hud-panel hidden items-center gap-2 rounded-full px-4 py-1.5 md:flex">
          <Compass className="h-4 w-4 text-teal-400" />
          <span className="font-display text-sm font-medium text-white">
            {screen === "worldmap" ? t.worldMap : activeWorld.name}
          </span>
          {screen === "territory" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs text-amber-300"
              onClick={() => {
                playClick();
                setScreen("worldmap");
              }}
            >
              Leave Sector
            </Button>
          )}
        </div>

        {/* Top-Right Action & Game System Tray */}
        <div className="pointer-events-auto hud-panel flex flex-wrap items-center gap-1.5 rounded-xl px-2.5 py-1.5">
          <Button size="icon" variant="ghost" title="Daily Bonus" onClick={dailyClaim}>
            <Gift className="h-4 w-4 text-amber-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={t.skillTree}
            onClick={() => {
              playClick();
              setActiveModal({ type: "skill-tree" });
            }}
          >
            <TreePine className="h-4 w-4 text-emerald-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={t.shopInventory}
            onClick={() => {
              playClick();
              setActiveModal({ type: "shop" });
            }}
          >
            <ShoppingBag className="h-4 w-4 text-amber-300" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={t.skillPassport}
            onClick={() => {
              playClick();
              setActiveModal({ type: "passport" });
            }}
          >
            <Award className="h-4 w-4 text-sky-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={t.leaderboard}
            onClick={() => {
              playClick();
              setActiveModal({ type: "leaderboard" });
            }}
          >
            <Trophy className="h-4 w-4 text-amber-400" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={soundOn ? "Mute Audio" : "Enable Audio"}
            onClick={() => toggleSoundEnabled()}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="Pause / Menu"
            onClick={() => {
              playClick();
              setActiveModal({ type: "pause" });
            }}
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            title="Leave to Title Screen"
            className="h-9 px-3 text-xs font-semibold"
            onClick={() => {
              playClick();
              setActiveModal(null);
              setScreen("title");
            }}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Leave
          </Button>
        </div>
      </div>

      {/* Bottom HUD Row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* Bottom-Left Controls Hint & Quick Territory Missions Drawer */}
        <div className="pointer-events-auto flex flex-col gap-2">
          {screen === "territory" && stationDrawerOpen && (
            <div className="hud-panel max-h-60 w-72 overflow-y-auto rounded-xl p-2.5 text-xs">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-teal-400">
                Sector Terminals ({activeWorld.name})
              </p>
              <div className="flex flex-col gap-1">
                {activeWorld.stations.map((st) => {
                  const done =
                    stats.completedIds.includes(st.id) ||
                    (state.tutorialsCompleted || []).includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStationDrawerOpen(false);
                        if (st.kind === "tutorial") {
                          setActiveModal({ type: "tutorial", data: { tutorialId: st.id } });
                        } else {
                          openMission(st.id, st.kind === "boss" ? "boss" : "campaign");
                        }
                      }}
                      className="flex items-center justify-between rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-left hover:bg-slate-800"
                    >
                      <span className="truncate">{st.label}</span>
                      <span className={done ? "text-emerald-400" : "text-amber-400"}>
                        {done ? "✓" : st.kind === "boss" ? "Boss" : "Go"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="hud-panel flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-xs">
            {screen === "worldmap" ? (
              <span className="text-slate-300">
                Click any unlocked territory node to beam down and explore.
              </span>
            ) : (
              <>
                <span className="hidden text-slate-300 sm:inline">
                  Move: <strong>WASD</strong> / Click · Interact: <strong>[E]</strong>
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setStationDrawerOpen((v) => !v)}
                >
                  Stations ({activeWorld.stations.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-amber-300"
                  onClick={() => {
                    playClick();
                    setScreen("worldmap");
                  }}
                >
                  Leave Sector
                </Button>
              </>
            )}

            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveModal({ type: "playground" })}
              >
                <FlaskConical className="mr-1 h-3.5 w-3.5 text-teal-400" />
                {t.aiPlayground}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveModal({ type: "escape-room" })}
              >
                <DoorOpen className="mr-1 h-3.5 w-3.5 text-amber-400" />
                {t.escapeRoom}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveModal({ type: "duel" })}
              >
                <Swords className="mr-1 h-3.5 w-3.5 text-sky-400" />
                Duel
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom-Right Reserved space kept clean for NOVA Companion widget */}
        <div className="pointer-events-none h-10 w-10" />
      </div>
    </div>
  );
}
