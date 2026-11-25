import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CheckCircle2, Flame, Gauge, RotateCcw, Sparkles, Timer, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { GradeBadge } from "@/components/arena/MissionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CHALLENGES, challengeById } from "@/lib/arena/challenges";
import {
  computeBadges,
  computePlayerStats,
  formatDuration,
  gradeFromScore,
  proficiencyBand,
  recommendNextChallenge,
  submissionEfficiency,
  submissionXp,
} from "@/lib/arena/game";
import {
  resetArenaState,
  seedDemoArenaState,
  updateProfile,
  useArenaState,
} from "@/lib/arena/storage";
import type { Experience, Goal } from "@/lib/arena/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Efficiency Report & Profile — AI Arena" },
      { name: "description", content: "Track your AI Efficiency Index, domain radar, badges, and mission history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const state = useArenaState();
  const stats = computePlayerStats(state);
  const badges = computeBadges(state, stats);
  const nextMission = recommendNextChallenge(state);

  const [alias, setAlias] = useState(state.profile.alias);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAlias(state.profile.alias);
  }, [state.profile.alias]);

  const radarData = stats.domainScores.map((d) => ({
    domain: d.label.split(" ")[0],
    score: d.score,
    fullMark: 100,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      {/* Top Efficiency Summary */}
      <div className="rounded-2xl border border-border bg-gradient-surface p-6 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="chip border-highlight/40 bg-highlight/10 text-highlight">
              Indicative Practice Report • Local Guest Mode
            </span>
            <h1 className="mt-2 text-3xl font-bold">
              {state.profile.alias} — Lv.{stats.rank.level} {stats.rank.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.completedIds.length
                ? `Proficiency band: ${proficiencyBand(stats.averageEfficiency)} • ${stats.completedIds.length}/${CHALLENGES.length} missions cleared`
                : "Complete a mission to generate your AI Efficiency Index and domain breakdown."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                seedDemoArenaState();
                toast.success("Loaded sample operator run");
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Load Sample Run
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                resetArenaState();
                toast.info("Cleared local progress");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset Data
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gauge className="h-4 w-4 text-highlight" aria-hidden />
              AI Efficiency Index
            </div>
            <div className="mt-1 font-display text-2xl font-bold">
              {stats.completedIds.length ? `${stats.averageEfficiency}/100` : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-4 w-4 text-primary" aria-hidden />
              Total XP
            </div>
            <div className="mt-1 font-display text-2xl font-bold">{stats.totalXp} XP</div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-4 w-4 text-warning" aria-hidden />
              Best Streak
            </div>
            <div className="mt-1 font-display text-2xl font-bold">{stats.bestStreak}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-4 w-4 text-success" aria-hidden />
              Time Practiced
            </div>
            <div className="mt-1 font-display text-2xl font-bold">
              {formatDuration(stats.totalSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart + Domain Bars */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-5">
          <h2 className="font-semibold">Six-Domain Efficiency Radar</h2>
          <p className="text-xs text-muted-foreground">Best efficiency score per skill domain</p>
          <div className="mt-4 h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: "#b8bed9", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Efficiency"
                    dataKey="score"
                    stroke="oklch(0.82 0.13 200)"
                    fill="oklch(0.63 0.22 285)"
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Loading chart…
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Domain Breakdown</h2>
            <Button asChild size="sm" variant="hero">
              <Link to="/play/$id" params={{ id: nextMission.id }}>
                Train: {nextMission.title}
              </Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3.5">
            {stats.domainScores.map((d) => (
              <div key={d.domain} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.attempts > 0 ? `${d.score}% (${d.attempts} played)` : "Not attempted"}
                  </span>
                </div>
                <Progress value={d.score} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements / Badges */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Award className="h-4 w-4 text-highlight" aria-hidden />
          Efficiency Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "rounded-xl border p-3.5 transition-colors",
                b.unlocked
                  ? "border-highlight/40 bg-highlight/10"
                  : "border-border bg-background/30 opacity-60",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{b.name}</span>
                {b.unlocked && <CheckCircle2 className="h-4 w-4 text-highlight" aria-hidden />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding & Operator Settings + History */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-5">
          <h2 className="font-semibold">Operator Profile (Saved Locally)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Guest mode stores all scores and preferences in browser localStorage.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="alias-input" className="text-xs font-medium text-muted-foreground">
                Display Alias
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="alias-input"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={24}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    updateProfile({ alias: alias.trim() || "Guest Operator", onboarded: true });
                    toast.success("Alias updated");
                  }}
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Experience Level</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(["new", "regular", "power"] as Experience[]).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => updateProfile({ experience: exp, onboarded: true })}
                    className={cn(
                      "chip cursor-pointer capitalize",
                      state.profile.experience === exp
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Primary Goal</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(["career", "study", "productivity", "creativity"] as Goal[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateProfile({ goal: g, onboarded: true })}
                    className={cn(
                      "chip cursor-pointer capitalize",
                      state.profile.goal === g
                        ? "border-highlight bg-highlight/15 text-highlight"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-7">
          <h2 className="font-semibold">Recent Mission Log</h2>
          {state.submissions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No missions played yet. Start one from the Missions tab or load a sample run above.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {[...state.submissions].reverse().slice(0, 8).map((s) => {
                const ch = challengeById(s.challengeId);
                const eff = submissionEfficiency(s);
                const grade = s.grade ?? gradeFromScore(eff);
                return (
                  <Link
                    key={s.id}
                    to="/play/$id"
                    params={{ id: s.challengeId }}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3.5 py-2.5 text-sm transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-center gap-3">
                      <GradeBadge grade={grade} />
                      <div>
                        <div className="font-medium">{ch?.title ?? s.challengeId}</div>
                        <div className="text-xs text-muted-foreground">
                          Rubric {s.score}/100 • {formatDuration(s.seconds)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="font-semibold text-foreground">{eff}% eff</div>
                      <div className="text-highlight">+{submissionXp(s)} XP</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
