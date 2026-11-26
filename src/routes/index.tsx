import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Gauge, Map, Play, RefreshCw, ShieldCheck, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { DynamicScenePreview } from "@/components/arena/DynamicScenePreview";
import { GradeBadge } from "@/components/arena/MissionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CHALLENGES } from "@/lib/arena/challenges";
import { DOMAINS } from "@/lib/arena/domains";
import { generateDynamicVisualChallenge } from "@/lib/arena/dynamicChallenges";
import {
  computeBadges,
  computePlayerStats,
  gradeFromScore,
  recommendNextChallenge,
  submissionEfficiency,
} from "@/lib/arena/game";
import { playClick, playShuffle } from "@/lib/arena/sound";
import { useArenaState } from "@/lib/arena/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Arena — AI Efficiency Game Lobby" },
      {
        name: "description",
        content:
          "Arcade game testing speed, first-shot prompt precision, verification, and AI workflow efficiency.",
      },
      { property: "og:title", content: "AI Arena" },
      {
        property: "og:description",
        content:
          "Play timed missions, dynamic visual prompt challenges, and 3-round Blitz runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameLobby,
});

function GameLobby() {
  const state = useArenaState();
  const stats = computePlayerStats(state);
  const badges = computeBadges(state, stats);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;
  const nextMission = recommendNextChallenge(state);

  const [previewSeed, setPreviewSeed] = useState(101);
  useEffect(() => {
    setPreviewSeed(Date.now());
  }, []);

  const dynamicVisual = generateDynamicVisualChallenge(previewSeed);
  const sceneSpec = dynamicVisual.payload.kind === "text" ? dynamicVisual.payload.sceneSpec : undefined;

  const sRanks = Object.values(stats.bestByChallenge).filter(
    (s) => (s.grade ?? gradeFromScore(submissionEfficiency(s))) === "S",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Main Arcade Cockpit Banner */}
      <section className="grid gap-5 rounded-2xl border border-primary/40 bg-card p-6 shadow-[0_12px_40px_-14px_oklch(0.515_0.235_272/0.45)] lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="tag border-highlight/50 bg-highlight/15 text-highlight">
              LV.{stats.rank.level} · {stats.rank.title.toUpperCase()}
            </span>
            <span className="tag border-border bg-secondary text-muted-foreground">
              {stats.completedIds.length}/{CHALLENGES.length} STAGES CLEARED
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Ready to test your AI speed &amp; precision?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Beat par time, nail prompts in one shot without hints, and climb from Prompt Novice to AI
            Grandmaster.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="hero">
              <Link
                to="/play/$id"
                params={{ id: nextMission.id }}
                onClick={() => playClick()}
              >
                <Play className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {stats.completedIds.length > 0 ? "Continue campaign" : "Start stage 01"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="default">
              <Link to="/play/$id" params={{ id: "dynamic-visual-forge" }} onClick={() => playClick()}>
                <RefreshCw className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Dynamic visual round
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/blitz" onClick={() => playClick()}>
                <Zap className="h-4 w-4 text-nebula" strokeWidth={1.5} aria-hidden />
                Blitz gauntlet
              </Link>
            </Button>
          </div>
        </div>

        {/* Pilot HUD Stats */}
        <div className="rounded-xl border border-border bg-background/75 p-4 lg:col-span-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-highlight">PILOT TELEMETRY</span>
            <span className="font-mono text-nebula tabular">
              {stats.totalXp} XP {stats.rank.nextXp ? `/ ${stats.rank.nextXp}` : "MAX"}
            </span>
          </div>
          <Progress value={stats.rankProgress} className="mt-2 h-2" />

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5 text-highlight" strokeWidth={1.5} />
                Efficiency
              </div>
              <div className="mt-1 font-mono text-xl font-semibold text-highlight tabular">
                {stats.completedIds.length ? `${stats.averageEfficiency}%` : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-nebula" strokeWidth={1.5} />
                Combo streak
              </div>
              <div className="mt-1 font-mono text-xl font-semibold text-nebula tabular">
                {stats.currentStreak}x
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-highlight" strokeWidth={1.5} />
                S-Ranks
              </div>
              <div className="mt-1 font-mono text-xl font-semibold text-foreground tabular">
                {sRanks}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                Badges
              </div>
              <div className="mt-1 font-mono text-xl font-semibold text-foreground tabular">
                {unlockedBadges}/{badges.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Playable Arcade Modes */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Mode 1: Dynamic Visual Prompt Forge */}
        <div className="flex flex-col justify-between rounded-xl border border-highlight/45 bg-card p-4">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-highlight">MODE 01 · INFINITE VISUAL</span>
              <button
                type="button"
                onClick={() => {
                  playShuffle();
                  setPreviewSeed(Date.now() + Math.floor(Math.random() * 10000));
                }}
                className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-highlight"
              >
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                Roll scene
              </button>
            </div>
            <h2 className="mt-2 text-lg font-medium">Visual prompt forge</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Inspect a procedurally generated scene and recreate it in one prompt
            </p>
            {sceneSpec && (
              <div className="mt-3 max-h-40 overflow-hidden rounded-lg border border-border">
                <DynamicScenePreview spec={sceneSpec} />
              </div>
            )}
          </div>
          <Button asChild variant="default" className="mt-4 w-full">
            <Link to="/play/$id" params={{ id: "dynamic-visual-forge" }} onClick={() => playClick()}>
              Enter visual forge
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>

        {/* Mode 2: 3-Round Blitz Gauntlet */}
        <div className="flex flex-col justify-between rounded-xl border border-nebula/45 bg-card p-4">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-nebula">MODE 02 · SURVIVAL SPRINT</span>
              <span className="font-mono text-muted-foreground">3 ROUNDS</span>
            </div>
            <h2 className="mt-2 text-lg font-medium">Efficiency blitz</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Play three changing rounds back-to-back under a live clock for a +50 XP bonus
            </p>

            <div className="mt-4 space-y-2 rounded-lg border border-border bg-background/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Round 1</span>
                <span className="font-mono text-highlight">Procedural visual prompt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Round 2</span>
                <span className="font-mono text-nebula">Rotating client brief</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Round 3</span>
                <span className="font-mono text-foreground">Live flaw audit</span>
              </div>
            </div>
          </div>
          <Button asChild variant="hero" className="mt-4 w-full">
            <Link to="/blitz" onClick={() => playClick()}>
              Launch blitz mode
              <Zap className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>

        {/* Mode 3: Campaign Progression */}
        <div className="flex flex-col justify-between rounded-xl border border-primary/45 bg-card p-4">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-primary">MODE 03 · CAMPAIGN</span>
              <span className="font-mono text-muted-foreground tabular">
                {stats.completedIds.length}/{CHALLENGES.length} CLEARED
              </span>
            </div>
            <h2 className="mt-2 text-lg font-medium">Next recommended stage</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Adaptive targeting based on your weakest domain and unplayed stages
            </p>

            <div className="mt-4 rounded-lg border border-border bg-background/60 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-foreground">{nextMission.title}</span>
                {stats.bestByChallenge[nextMission.id] && (
                  <GradeBadge
                    grade={
                      stats.bestByChallenge[nextMission.id]!.grade ??
                      gradeFromScore(submissionEfficiency(stats.bestByChallenge[nextMission.id]!))
                    }
                  />
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{nextMission.summary}</p>
              <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>{nextMission.difficulty}</span>
                <span className="text-highlight">{nextMission.minutes}m par</span>
              </div>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/missions" onClick={() => playClick()}>
              <Map className="h-4 w-4" strokeWidth={1.5} />
              Open campaign map
            </Link>
          </Button>
        </div>
      </section>

      {/* Six Sectors Quick Select */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs text-muted-foreground">CAMPAIGN SECTORS (CLICK TO DEPLOY)</h2>
          <Link to="/leaderboard" className="font-mono text-xs text-highlight hover:underline">
            View rankings →
          </Link>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d, idx) => {
            const total = CHALLENGES.filter((c) => c.domain === d.id).length;
            const cleared = CHALLENGES.filter(
              (c) => c.domain === d.id && stats.completedIds.includes(c.id),
            ).length;
            const domainStat = stats.domainScores.find((x) => x.domain === d.id);
            return (
              <Link
                key={d.id}
                to="/missions"
                search={{ domain: d.id }}
                onClick={() => playClick()}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3.5 py-2.5 transition-colors hover:border-highlight/60 hover:bg-secondary/70"
              >
                <div className="flex items-center gap-2.5">
                  <d.icon className="h-4 w-4 shrink-0 text-highlight" strokeWidth={1.5} aria-hidden />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {idx + 1}. {d.label}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground tabular">
                      {cleared}/{total} cleared
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs text-nebula tabular">
                  {domainStat && domainStat.attempts > 0 ? `${domainStat.score}%` : "OPEN"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
