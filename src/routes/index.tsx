import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Gauge, Play, Sparkles, Trophy, Zap } from "lucide-react";
import { MissionCard } from "@/components/arena/MissionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CHALLENGES, challengeById } from "@/lib/arena/challenges";
import { DOMAINS } from "@/lib/arena/domains";
import {
  computeBadges,
  computePlayerStats,
  proficiencyBand,
  recommendNextChallenge,
} from "@/lib/arena/game";
import { useArenaState } from "@/lib/arena/storage";
import type { Challenge } from "@/lib/arena/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Arena — Test How Efficiently You Work With AI" },
      {
        name: "description",
        content:
          "An interactive AI efficiency game with timed missions, prompt simulation, and transparent rubric scoring.",
      },
      { property: "og:title", content: "AI Arena — AI Efficiency Game" },
      {
        property: "og:description",
        content:
          "Measure prompt clarity, speed, turn economy, and verification skill across 12 interactive missions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const state = useArenaState();
  const stats = computePlayerStats(state);
  const badges = computeBadges(state, stats);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;
  const nextMission = recommendNextChallenge(state);

  const featured = [
    "brief-research-assistant",
    "spot-hallucinations-python",
    "support-triage-pipeline",
    "deployment-risk-triage",
  ]
    .map((id) => challengeById(id))
    .filter((c): c is Challenge => Boolean(c));

  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-0 h-[520px]" aria-hidden />

      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <span className="chip border-primary/40 bg-primary/10 text-highlight">
              <Sparkles className="h-3 w-3" aria-hidden />
              Interactive AI Efficiency Game • 12 Missions
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
              How <span className="text-gradient">efficiently</span> do you work with AI?
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Every mission scores four dimensions of real AI mastery: output quality, speed vs.
              par time, first-shot turn economy, and zero-hint independence.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/play/$id" params={{ id: nextMission.id }}>
                  <Play className="h-4 w-4" aria-hidden />
                  {stats.completedIds.length > 0 ? "Play Next Mission" : "Start First Mission"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/blitz">
                  <Zap className="h-4 w-4 text-warning" aria-hidden />
                  3-Round Efficiency Blitz
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/missions">
                  Explore All {CHALLENGES.length} Missions
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          {/* Live Player Command Card */}
          <div className="rounded-2xl border border-border bg-gradient-surface p-6 shadow-glow lg:col-span-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Operator Status
                </div>
                <div className="mt-0.5 font-display text-xl font-bold">
                  Lv.{stats.rank.level} {stats.rank.title}
                </div>
              </div>
              <span className="chip border-highlight/40 bg-highlight/10 text-highlight">
                {stats.completedIds.length ? proficiencyBand(stats.averageEfficiency) : "Rookie Run"}
              </span>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.totalXp} XP</span>
                <span>
                  {stats.rank.nextXp ? `Next rank at ${stats.rank.nextXp} XP` : "Max rank"}
                </span>
              </div>
              <Progress value={stats.rankProgress} className="h-2" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <Gauge className="mx-auto h-4 w-4 text-highlight" aria-hidden />
                <div className="mt-1 font-display text-lg font-bold">
                  {stats.completedIds.length ? `${stats.averageEfficiency}%` : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground">Efficiency</div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <Flame className="mx-auto h-4 w-4 text-warning" aria-hidden />
                <div className="mt-1 font-display text-lg font-bold">{stats.currentStreak}</div>
                <div className="text-[11px] text-muted-foreground">Streak</div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <Trophy className="mx-auto h-4 w-4 text-primary" aria-hidden />
                <div className="mt-1 font-display text-lg font-bold">
                  {unlockedBadges}/{badges.length}
                </div>
                <div className="text-[11px] text-muted-foreground">Badges</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>
                Recommended: <strong className="text-foreground">{nextMission.title}</strong>
              </span>
              <Link to="/profile" className="font-medium text-highlight hover:underline">
                Full Report →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How Efficiency Is Scored */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { pct: "65%", title: "Rubric Quality", desc: "Clarity, verification, specificity, and safety signals." },
            { pct: "15%", title: "Speed vs. Par", desc: "Beat par time without sacrificing accuracy." },
            { pct: "10%", title: "Turn Economy", desc: "Nail prompts in 1 shot instead of repeated simulator retries." },
            { pct: "10%", title: "Zero-Hint Mastery", desc: "Solve independently to keep your 100% no-assist bonus." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border/70 bg-background/40 p-3.5">
              <span className="font-mono text-xs font-semibold text-highlight">{item.pct} WEIGHT</span>
              <h2 className="mt-1 text-sm font-semibold">{item.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Six Skill Domains */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Six AI Skill Arenas</h2>
            <p className="text-sm text-muted-foreground">Pick a domain to drill specific skills.</p>
          </div>
          <Link to="/missions" className="text-sm font-medium text-highlight hover:underline">
            Browse all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d) => {
            const domainStat = stats.domainScores.find((x) => x.domain === d.id);
            return (
              <Link
                key={d.id}
                to="/missions"
                search={{ domain: d.id }}
                className="group rounded-xl border border-border bg-gradient-surface p-5 transition-colors hover:border-primary/60"
              >
                <div className="flex items-center justify-between">
                  <d.icon className="h-5 w-5 text-highlight" aria-hidden />
                  {domainStat && domainStat.attempts > 0 && (
                    <span className="chip border-highlight/40 text-highlight font-mono">
                      {domainStat.score}% eff
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold group-hover:text-highlight">{d.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Playable Missions */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Featured Missions</h2>
            <p className="text-sm text-muted-foreground">
              Jump straight into playable challenges across prompt writing, auditing, workflows, and risk triage.
            </p>
          </div>
          <Link to="/missions" className="text-sm font-medium text-highlight hover:underline">
            All {CHALLENGES.length} missions →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((c) => (
            <MissionCard
              key={c.id}
              challenge={c}
              bestSubmission={stats.bestByChallenge[c.id]}
              isSaved={state.saved.includes(c.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
