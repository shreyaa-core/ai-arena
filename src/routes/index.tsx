import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Zap } from "lucide-react";
import { GradeBadge, MissionCard } from "@/components/arena/MissionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CHALLENGES, challengeById } from "@/lib/arena/challenges";
import { DOMAINS } from "@/lib/arena/domains";
import {
  computePlayerStats,
  proficiencyBand,
  recommendNextChallenge,
} from "@/lib/arena/game";
import { useArenaState } from "@/lib/arena/storage";
import type { Challenge } from "@/lib/arena/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Arena — Measure how efficiently you work with AI" },
      {
        name: "description",
        content:
          "Interactive missions that score prompt clarity, speed vs par time, turn economy, and verification skill.",
      },
      { property: "og:title", content: "AI Arena" },
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
    <div>
      {/* Hero: Asymmetric Split with Live Efficiency Benchmark Moment */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <h1 className="text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-foreground md:text-5xl">
              Measure how efficiently you work with AI
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Twelve timed missions across prompting, verification, workflows, and risk triage —
              scored on output quality, par speed, turn economy, and hint independence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/play/$id" params={{ id: nextMission.id }}>
                  <Play className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  {stats.completedIds.length > 0 ? "Play next mission" : "Start first mission"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/blitz">
                  <Zap className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  Run 3-round blitz
                </Link>
              </Button>
            </div>
          </div>

          {/* Product Moment: Live Benchmark Console */}
          <div className="rounded-2xl border border-primary/40 bg-card p-3 shadow-[0_12px_40px_-12px_oklch(0.515_0.235_272/0.4)] lg:col-span-6">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                <span className="font-mono text-highlight">Efficiency benchmark preview</span>
                <span className="font-mono text-nebula tabular">
                  Lv.{stats.rank.level} {stats.rank.title}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-destructive/35 bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <GradeBadge grade="D" />
                      <div>
                        <div className="text-xs font-medium text-foreground">
                          Unconstrained prompt
                        </div>
                        <div className="text-xs text-muted-foreground">
                          “write something about our product launch”
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs tabular">
                      <div className="text-destructive">24% eff</div>
                      <div className="text-muted-foreground">3 extra turns</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-highlight/55 bg-secondary p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <GradeBadge grade="S" />
                      <div>
                        <div className="text-xs font-medium text-foreground">
                          Structured 1-shot brief
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Audience, 150-word limit, facts, single CTA, no fabrication
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs tabular">
                      <div className="text-highlight">94% eff</div>
                      <div className="text-nebula">1-shot · 01:48</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 tabular">
                <div>
                  <div className="text-xs text-muted-foreground">Your efficiency</div>
                  <div className="mt-0.5 font-mono text-base font-medium text-highlight">
                    {stats.completedIds.length ? `${stats.averageEfficiency}%` : "Unranked"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Band</div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">
                    {stats.completedIds.length
                      ? proficiencyBand(stats.averageEfficiency)
                      : "Baseline"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="mt-0.5 font-mono text-base font-medium text-nebula">
                    {stats.completedIds.length}/{CHALLENGES.length}
                  </div>
                </div>
              </div>
              <Progress value={stats.rankProgress} className="mt-3 h-1.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Formula Strip */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-medium">How efficiency is scored</h2>
            <span className="text-xs text-muted-foreground">
              Submissions under 40/100 rubric quality are capped so speed never beats accuracy
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { pct: 65, title: "Rubric quality", desc: "Clarity, verification, specificity, and safety signals" },
              { pct: 15, title: "Speed vs par", desc: "Finish under par time without rushing quality" },
              { pct: 10, title: "Turn economy", desc: "Deliver clear prompts in one shot with fewer retries" },
              { pct: 10, title: "Zero-hint mastery", desc: "Solve independently without revealing tactical hints" },
            ].map((item) => (
              <div key={item.title} className="space-y-1.5 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="font-mono text-xs text-highlight tabular">{item.pct}%</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Six Skill Arenas */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium">Skill arenas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a domain to drill specific AI habits
            </p>
          </div>
          <Link to="/missions" className="text-sm text-highlight hover:underline">
            Explore all {CHALLENGES.length} missions
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d) => {
            const domainStat = stats.domainScores.find((x) => x.domain === d.id);
            return (
              <Link
                key={d.id}
                to="/missions"
                search={{ domain: d.id }}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-highlight/60 hover:bg-secondary/70"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <d.icon
                      className="h-4 w-4 text-highlight transition-colors group-hover:text-nebula"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {domainStat && domainStat.attempts > 0 && (
                      <span className="font-mono text-xs text-highlight tabular">
                        {domainStat.score}%
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-medium text-foreground">{d.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Missions */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium">Featured missions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Interactive worksheets across prompt writing, auditing, pipelines, and risk triage
            </p>
          </div>
          <Link
            to="/missions"
            className="inline-flex items-center gap-1 text-sm text-highlight hover:underline"
          >
            All missions
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
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
