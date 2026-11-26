import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, RotateCcw, TrendingUp, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { computePlayerStats, formatDuration } from "@/lib/arena/game";
import { criterionLabel } from "@/lib/arena/scoring";
import { playClick } from "@/lib/arena/sound";
import { useArenaState } from "@/lib/arena/storage";
import type { Challenge, EfficiencyBreakdown, EvaluationResult } from "@/lib/arena/types";
import { GradeBadge } from "./MissionCard";

export function ResultPanel({
  challenge,
  evaluation,
  efficiency,
  elapsedSeconds,
  onRetry,
  nextChallenge,
  onNext,
  nextLabel = "Next recommended mission",
}: {
  challenge: Challenge;
  evaluation: EvaluationResult;
  efficiency: EfficiencyBreakdown;
  elapsedSeconds: number;
  onRetry?: (() => void) | undefined;
  nextChallenge?: Challenge | undefined;
  onNext?: (() => void) | undefined;
  nextLabel?: string | undefined;
}) {
  const state = useArenaState();
  const stats = computePlayerStats(state);
  const passed = evaluation.score >= 50;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/50 bg-card p-6 text-foreground shadow-[0_12px_40px_-14px_oklch(0.515_0.235_272/0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <GradeBadge grade={efficiency.grade} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className={passed ? "text-success font-semibold" : "text-destructive font-semibold"}>
                  {passed ? "STAGE CLEARED" : "STAGE FAILED — RETRY"}
                </span>
                {efficiency.signalDensity && (
                  <span className="tag border-primary/40 bg-secondary text-foreground">
                    Signal: {efficiency.signalDensity}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-2xl font-semibold tabular">
                {efficiency.efficiency}% AI efficiency
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground tabular">
                {challenge.title} · {formatDuration(elapsedSeconds)} (par{" "}
                {formatDuration(efficiency.parSeconds)})
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-nebula/50 bg-secondary px-4 py-2.5 text-right">
            <div className="font-mono text-[11px] text-muted-foreground">XP REWARD</div>
            <div className="font-mono text-2xl font-semibold text-nebula tabular">
              +{efficiency.xpEarned}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-background/60 px-3.5 py-2.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-1.5 text-highlight">
              <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              LV.{stats.rank.level} {stats.rank.title.toUpperCase()}
            </span>
            <span className="text-muted-foreground tabular">
              {stats.totalXp} XP {stats.rank.nextXp ? `/ ${stats.rank.nextXp}` : "MAX"}
            </span>
          </div>
          <Progress value={stats.rankProgress} className="mt-2 h-1.5" />
        </div>

        {efficiency.bonuses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {efficiency.bonuses.map((b) => (
              <span key={b} className="tag border-highlight/40 bg-highlight/10 text-highlight font-mono">
                {b}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Quality (65%)", value: efficiency.rubricScore },
            { label: "Speed vs par (15%)", value: efficiency.speedScore },
            { label: "Turn economy (10%)", value: efficiency.turnScore },
            { label: "No-hint bonus (10%)", value: efficiency.hintScore },
          ].map((pillar) => (
            <div key={pillar.label} className="rounded-lg border border-border bg-background/70 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pillar.label}</span>
                <span className="font-mono font-medium text-foreground tabular">{pillar.value}</span>
              </div>
              <Progress value={pillar.value} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 text-foreground">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.5} aria-hidden />
            Strengths detected
          </h3>
          {evaluation.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  <span className="text-foreground">{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No strong rubric signals detected yet — try adding concrete constraints and verification cues
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 text-foreground">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="h-4 w-4 text-highlight" strokeWidth={1.5} aria-hidden />
            How to improve efficiency
          </h3>
          {evaluation.improvements.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {evaluation.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Clean execution — every rubric requirement was satisfied
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-foreground">
        <h3 className="text-base font-medium tabular">
          Rubric breakdown ({evaluation.score}/100)
        </h3>
        <div className="mt-4 space-y-3">
          {evaluation.criteria.map((c) => {
            const pct = c.max ? Math.round((c.score / c.max) * 100) : 0;
            return (
              <div key={c.criterion} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{criterionLabel(c.criterion)}</span>
                  <span className="font-mono text-xs text-highlight tabular">
                    {c.score} / {c.max} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{c.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>

      {evaluation.details && evaluation.details.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 text-foreground">
          <h3 className="text-base font-medium">Answer key and item review</h3>
          <div className="mt-3 space-y-2">
            {evaluation.details.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-background/60 p-3 text-sm"
              >
                {d.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.5} aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden />
                )}
                <div>
                  <div className="font-medium">{d.label}</div>
                  <div className="text-xs text-muted-foreground">{d.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                playClick();
                onRetry();
              }}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Replay stage
            </Button>
          )}
          <Button asChild variant="subtle">
            <Link to="/profile" onClick={() => playClick()}>
              Open pilot hangar
            </Link>
          </Button>
        </div>

        {onNext ? (
          <Button
            type="button"
            variant="hero"
            onClick={() => {
              playClick();
              onNext();
            }}
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </Button>
        ) : nextChallenge ? (
          <Button asChild variant="hero">
            <Link to="/play/$id" params={{ id: nextChallenge.id }} onClick={() => playClick()}>
              Next stage: {nextChallenge.title}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
