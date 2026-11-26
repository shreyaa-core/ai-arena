import { Play, Compass, Swords, Settings, HelpCircle, Info, ShieldCheck, Zap, Sparkles, UserCheck } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { useGame } from "../../context/GameContext.jsx";
import { playClick } from "../../utils/sound.js";

export function TitleScreen() {
  const {
    state,
    stats,
    hasProgress,
    t,
    recommended,
    serverHealth,
    authUser,
    enterWorldMap,
    openMission,
    setActiveModal,
  } = useGame();

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12">
      {/* Top Bar: Minimal Game Telemetry & Account Trigger */}
      <div className="flex items-start justify-between">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-600/40 bg-[#0B132B]/85 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur">
          <span
            className={`h-2 w-2 rounded-full ${
              serverHealth.groqConfigured ? "bg-teal-400" : "bg-amber-400"
            }`}
          />
          <span>
            {serverHealth.groqConfigured ? t.liveAiReadyNotice : t.simulationModeNotice}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            setActiveModal({ type: "auth" });
          }}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-teal-500/40 bg-[#141D38]/90 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-teal-400"
        >
          <UserCheck className="h-3.5 w-3.5 text-teal-400" />
          <span>{authUser ? authUser.alias : state.profile?.alias || t.accountSignIn}</span>
        </button>
      </div>

      {/* Main Left-Aligned Game Launch Menu */}
      <div className="pointer-events-auto my-auto max-w-md space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300">
            <Sparkles className="h-3 w-3" /> Edition 2.0 · Phaser World Engine
          </div>
          <h1 className="font-display text-5xl font-bold tracking-wider text-white drop-shadow-[0_4px_24px_rgba(20,184,166,0.35)] md:text-6xl">
            {t.gameTitle}
          </h1>
          <p className="text-sm leading-relaxed text-slate-300 md:text-base">
            Six AI territories have destabilised under vague prompts, hallucinations, and unsafe automation. Explore each sector, master practical AI craft, and restore the system.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {hasProgress && (
            <Button
              size="lg"
              variant="hero"
              className="justify-between text-base"
              onClick={() => {
                playClick();
                enterWorldMap();
              }}
            >
              <span className="flex items-center gap-2.5">
                <Compass className="h-5 w-5" />
                {t.continueAdventure}
              </span>
              <span className="font-mono text-xs opacity-80">
                Lv.{stats.rank.level} · AEI {stats.aei}
              </span>
            </Button>
          )}

          <Button
            size="lg"
            variant={hasProgress ? "default" : "hero"}
            className="justify-between text-base"
            onClick={() => {
              playClick();
              setActiveModal({ type: "onboarding" });
            }}
          >
            <span className="flex items-center gap-2.5">
              <Play className="h-5 w-5" />
              {hasProgress ? "New Explorer / Customize" : t.playGame}
            </span>
            <span className="font-mono text-xs opacity-75">Story Campaign</span>
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => {
                playClick();
                setActiveModal({ type: "playground" });
              }}
            >
              <Zap className="h-4 w-4 text-teal-400" />
              {t.trainingGrounds}
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => {
                playClick();
                openMission(recommended, "training");
              }}
            >
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              {t.quickChallenge}
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => {
                playClick();
                setActiveModal({ type: "duel" });
              }}
            >
              <Swords className="h-4 w-4 text-sky-400" />
              {t.multiplayerArena}
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => {
                playClick();
                setActiveModal({ type: "blitz" });
              }}
            >
              <Zap className="h-4 w-4 text-amber-400" />
              {t.blitzMode}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playClick();
                setActiveModal({ type: "settings" });
              }}
            >
              <Settings className="mr-1.5 h-4 w-4" />
              {t.settings}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playClick();
                setActiveModal({ type: "howto" });
              }}
            >
              <HelpCircle className="mr-1.5 h-4 w-4" />
              {t.howToPlay}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playClick();
                setActiveModal({ type: "credits" });
              }}
            >
              <Info className="mr-1.5 h-4 w-4" />
              {t.credits}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>Use WASD / Arrows or Click to explore worlds · Works offline in Guest Mode</span>
        <span className="font-mono">AEI Competency System · v2.0 JS/Phaser</span>
      </div>
    </div>
  );
}
