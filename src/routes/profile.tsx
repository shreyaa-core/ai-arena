import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CheckCircle2, RotateCcw } from "lucide-react";
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
      { title: "Efficiency Report — AI Arena" },
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      {/* Header & Summary Numbers (numbers only, no filler icons) */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              Indicative practice report · local guest storage
            </div>
            <h1 className="mt-1 text-3xl font-medium">
              {state.profile.alias} — Lv.{stats.rank.level} {stats.rank.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground tabular">
              {stats.completedIds.length
                ? `${proficiencyBand(stats.averageEfficiency)} band · ${stats.completedIds.length} of ${CHALLENGES.length} missions cleared`
                : "Complete a mission to generate your AI Efficiency Index and domain breakdown"}
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
              Load sample run
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
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-arcade-purple/40 bg-background/70 p-4">
            <div className="text-xs text-muted-foreground">AI efficiency index</div>
            <div className="mt-1 font-mono text-2xl font-medium text-highlight tabular">
              {stats.completedIds.length ? `${stats.averageEfficiency}/100` : "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.completedIds.length ? proficiencyBand(stats.averageEfficiency) : "No runs yet"}
            </div>
          </div>
          <div className="rounded-lg border border-arcade-purple/40 bg-background/70 p-4">
            <div className="text-xs text-muted-foreground">Total XP</div>
            <div className="mt-1 font-mono text-2xl font-medium text-warning tabular">
              {stats.totalXp}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular">
              {stats.rank.nextXp ? `Next rank at ${stats.rank.nextXp}` : "Max rank"}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="text-xs text-muted-foreground">Best streak</div>
            <div className="mt-1 font-mono text-2xl font-medium tabular">{stats.bestStreak}</div>
            <div className="mt-1 text-xs text-muted-foreground tabular">
              Current {stats.currentStreak}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="text-xs text-muted-foreground">Time practiced</div>
            <div className="mt-1 font-mono text-2xl font-medium tabular">
              {formatDuration(stats.totalSeconds)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular">
              {state.submissions.length} submissions
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart (7 cols) + Ranked Domain List (5 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-7">
          <h2 className="text-base font-medium">Six-domain efficiency radar</h2>
          <p className="text-xs text-muted-foreground">Best efficiency score per skill domain</p>
          <div className="mt-4 h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(131,56,236,0.3)" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: "#d8cff7", fontSize: 12, fontFamily: "Roboto, sans-serif" }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Efficiency"
                    dataKey="score"
                    stroke="#00F5FF"
                    fill="#8338EC"
                    fillOpacity={0.38}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Loading chart
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-medium">Domain breakdown</h2>
            <Button asChild size="sm" variant="hero">
              <Link to="/play/$id" params={{ id: nextMission.id }}>
                Train next
              </Link>
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {stats.domainScores.map((d) => (
              <div key={d.domain} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular">
                    {d.attempts > 0 ? `${d.score}% (${d.attempts})` : "Unplayed"}
                  </span>
                </div>
                <Progress value={d.score} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-medium">
          <Award className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "rounded-lg border p-3.5 transition-colors",
                b.unlocked
                  ? "border-primary/40 bg-secondary"
                  : "border-border bg-background/40 opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{b.name}</span>
                {b.unlocked && (
                  <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.5} aria-hidden />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Operator Settings + Mission History */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-5">
          <h2 className="text-base font-medium">Operator settings</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Account persistence is local to this browser in guest mode
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="alias-input" className="text-xs text-muted-foreground">
                Display alias
              </label>
              <div className="mt-1.5 flex gap-2">
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
              <div className="text-xs text-muted-foreground">Experience level</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(["new", "regular", "power"] as Experience[]).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => updateProfile({ experience: exp, onboarded: true })}
                    className={cn(
                      "tag cursor-pointer capitalize transition-colors",
                      state.profile.experience === exp
                        ? "border-primary/50 bg-secondary text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Primary goal</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(["career", "study", "productivity", "creativity"] as Goal[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateProfile({ goal: g, onboarded: true })}
                    className={cn(
                      "tag cursor-pointer capitalize transition-colors",
                      state.profile.goal === g
                        ? "border-primary/50 bg-secondary text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
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
          <h2 className="text-base font-medium">Recent mission log</h2>
          {state.submissions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No missions played yet. Start one from Missions or load a sample run above.
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
                    className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3.5 py-2.5 text-sm transition-colors hover:border-foreground/25"
                  >
                    <div className="flex items-center gap-3">
                      <GradeBadge grade={grade} />
                      <div>
                        <div className="font-medium">{ch?.title ?? s.challengeId}</div>
                        <div className="font-mono text-xs text-muted-foreground tabular">
                          Rubric {s.score}/100 · {formatDuration(s.seconds)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs tabular">
                      <div className="font-medium text-highlight">{eff}% eff</div>
                      <div className="text-warning">+{submissionXp(s)} XP</div>
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
