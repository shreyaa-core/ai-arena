import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Play, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { ChallengeRunner } from "@/components/arena/ChallengeRunner";
import { GradeBadge } from "@/components/arena/MissionCard";
import { Button } from "@/components/ui/button";
import { CHALLENGES, challengeById } from "@/lib/arena/challenges";
import { formatDuration, gradeFromScore } from "@/lib/arena/game";
import { recordBlitzRun, useArenaState } from "@/lib/arena/storage";
import type { Challenge, EfficiencyBreakdown } from "@/lib/arena/types";

export const Route = createFileRoute("/blitz")({
  head: () => ({
    meta: [
      { title: "Efficiency Blitz — AI Arena" },
      { name: "description", content: "Play 3 AI efficiency missions back-to-back in a timed gauntlet." },
    ],
  }),
  component: BlitzPage,
});

interface BlitzPreset {
  id: string;
  name: string;
  description: string;
  challengeIds: string[];
}

const PRESETS: BlitzPreset[] = [
  {
    id: "core-trio",
    name: "Core AI Trio",
    description: "Prompt writing + hallucination spotting + tool selection.",
    challengeIds: ["brief-research-assistant", "spot-hallucinations-python", "pick-best-spreadsheet"],
  },
  {
    id: "safety-ops",
    name: "Safety & Pipeline Ops",
    description: "Privacy triage + support workflow + weak market claims.",
    challengeIds: ["privacy-before-paste", "support-triage-pipeline", "weak-claims-market"],
  },
  {
    id: "creative-sprint",
    name: "Builder & Creative Sprint",
    description: "Improve bland output + review analysis + rescue a vague prompt.",
    challengeIds: ["improve-bland-tagline", "tool-for-reviews", "rescue-vague-prompt"],
  },
];

function BlitzPage() {
  const state = useArenaState();
  const [activePreset, setActivePreset] = useState<BlitzPreset | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [roundResults, setRoundResults] = useState<
    { challenge: Challenge; efficiency: EfficiencyBreakdown; seconds: number }[]
  >([]);
  const [waitingNext, setWaitingNext] = useState(false);

  const startBlitz = (preset: BlitzPreset) => {
    setActivePreset(preset);
    setRoundIdx(0);
    setRoundResults([]);
    setWaitingNext(false);
  };

  if (!activePreset) {
    const pastRuns = state.blitzRuns ?? [];
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-gradient-surface p-7 shadow-glow">
          <span className="chip border-warning/40 bg-warning/10 text-warning">
            <Zap className="h-3 w-3" aria-hidden />
            3-Round Timed Gauntlet
          </span>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Efficiency Blitz Mode</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Chain 3 diverse AI missions back-to-back. Your cumulative time, rubric quality, and
            first-shot clarity combine into a single Blitz Grade plus bonus XP.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PRESETS.map((preset) => {
            const totalPar = preset.challengeIds.reduce(
              (acc, id) => acc + (challengeById(id)?.minutes ?? 5),
              0,
            );
            return (
              <div
                key={preset.id}
                className="flex flex-col justify-between rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="chip border-paper-border bg-paper-muted">3 Rounds</span>
                    <span className="chip border-paper-border font-mono">
                      <Clock className="h-3 w-3" aria-hidden />
                      {totalPar}m par
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{preset.name}</h2>
                  <p className="mt-1 text-sm text-paper-muted-foreground">{preset.description}</p>
                </div>

                <Button
                  type="button"
                  variant="hero"
                  className="mt-5 w-full"
                  onClick={() => startBlitz(preset)}
                >
                  <Play className="h-4 w-4" aria-hidden />
                  Launch Blitz
                </Button>
              </div>
            );
          })}
        </div>

        {pastRuns.length > 0 && (
          <div className="mt-10 rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Trophy className="h-4 w-4 text-warning" aria-hidden />
              Recent Blitz Runs
            </h2>
            <div className="mt-3 space-y-2">
              {[...pastRuns].reverse().slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <GradeBadge grade={run.grade} />
                    <span className="font-medium">{run.preset}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                    <span>{run.averageEfficiency}% Eff</span>
                    <span>{formatDuration(run.totalSeconds)}</span>
                    <span className="text-highlight">+{run.xpEarned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const rounds = activePreset.challengeIds
    .map((id) => challengeById(id) ?? CHALLENGES[0])
    .filter((c): c is Challenge => Boolean(c));

  const finished = roundResults.length === rounds.length && !waitingNext;

  if (finished) {
    const avgEff = Math.round(
      roundResults.reduce((a, r) => a + r.efficiency.efficiency, 0) / roundResults.length,
    );
    const totalSeconds = roundResults.reduce((a, r) => a + r.seconds, 0);
    const totalXp = roundResults.reduce((a, r) => a + r.efficiency.xpEarned, 0) + 50;
    const blitzGrade = gradeFromScore(avgEff);

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-gradient-surface p-7 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <GradeBadge grade={blitzGrade} size="lg" />
              <div>
                <span className="chip border-highlight/40 bg-highlight/10 text-highlight">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Blitz Complete • {activePreset.name}
                </span>
                <h1 className="mt-1 text-3xl font-bold">{avgEff}% Average Efficiency</h1>
                <p className="text-sm text-muted-foreground">
                  3 rounds cleared in {formatDuration(totalSeconds)} (+50 XP Blitz Completion Bonus)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total XP</div>
              <div className="font-display text-2xl font-bold text-highlight">+{totalXp} XP</div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {roundResults.map((r, i) => (
              <div
                key={r.challenge.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">R{i + 1}</span>
                  <GradeBadge grade={r.efficiency.grade} />
                  <span className="font-medium">{r.challenge.title}</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span>{r.efficiency.efficiency}% eff</span>
                  <span>{formatDuration(r.seconds)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setActivePreset(null)}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Choose Another Blitz
            </Button>
            <Button asChild variant="hero">
              <Link to="/profile">View Full Skill Report</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentChallenge = rounds[roundIdx];
  if (!currentChallenge) return null;
  const isLastRound = roundIdx === rounds.length - 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Blitz: <strong className="text-foreground">{activePreset.name}</strong>
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setActivePreset(null)}>
          Exit Blitz
        </Button>
      </div>

      <ChallengeRunner
        challenge={currentChallenge}
        modeLabel={`Blitz Round ${roundIdx + 1} / ${rounds.length}`}
        disableRetry
        nextLabel={isLastRound ? "Finish Blitz & See Scorecard" : `Next Round (${roundIdx + 2}/${rounds.length})`}
        onCompleted={({ efficiency, seconds }) => {
          const nextResults = [...roundResults, { challenge: currentChallenge, efficiency, seconds }];
          setRoundResults(nextResults);
          setWaitingNext(true);
          if (nextResults.length === rounds.length) {
            const avgEff = Math.round(
              nextResults.reduce((a, r) => a + r.efficiency.efficiency, 0) / nextResults.length,
            );
            const totalSeconds = nextResults.reduce((a, r) => a + r.seconds, 0);
            recordBlitzRun({
              id: `blitz-${Date.now()}`,
              preset: activePreset.name,
              averageEfficiency: avgEff,
              grade: gradeFromScore(avgEff),
              totalSeconds,
              xpEarned: 50,
              at: new Date().toISOString(),
            });
          }
        }}
        onNext={() => {
          setWaitingNext(false);
          if (!isLastRound) {
            setRoundIdx((i) => i + 1);
          }
        }}
      />
    </div>
  );
}
