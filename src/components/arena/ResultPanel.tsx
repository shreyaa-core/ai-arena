import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles, TrendingUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { criterionLabel } from "@/lib/arena/scoring";
import { formatDuration } from "@/lib/arena/game";
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
  nextLabel = "Next Recommended Mission",
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
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-gradient-surface p-6 text-foreground shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <GradeBadge grade={efficiency.grade} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-highlight">
                  Mission Debrief • Rubric-Based
                </span>
                {efficiency.signalDensity && (
                  <span className="chip border-border bg-muted/60 text-foreground">
                    Signal: {efficiency.signalDensity}
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 text-2xl font-bold">
                {efficiency.efficiency}% AI Efficiency
              </h2>
              <p className="text-sm text-muted-foreground">
                Completed {challenge.title} in {formatDuration(elapsedSeconds)} (Par{" "}
                {formatDuration(efficiency.parSeconds)})
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-primary/40 bg-primary/15 px-4 py-2.5 text-right">
            <div className="text-xs text-muted-foreground">XP Earned</div>
            <div className="font-display text-2xl font-bold text-highlight">
              +{efficiency.xpEarned} XP
            </div>
          </div>
        </div>

        {efficiency.bonuses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {efficiency.bonuses.map((b) => (
              <span key={b} className="chip border-highlight/40 bg-highlight/10 text-highlight">
                <Sparkles className="h-3 w-3" aria-hidden />
                {b}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Quality (65%)", value: efficiency.rubricScore },
            { label: "Speed vs Par (15%)", value: efficiency.speedScore },
            { label: "Turn Economy (10%)", value: efficiency.turnScore },
            { label: "No-Hint Bonus (10%)", value: efficiency.hintScore },
          ].map((pillar) => (
            <div key={pillar.label} className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pillar.label}</span>
                <span className="font-mono font-semibold text-foreground">{pillar.value}</span>
              </div>
              <Progress value={pillar.value} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
          <h3 className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            Strengths Detected
          </h3>
          {evaluation.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-paper-muted-foreground">
              No strong rubric signals detected yet — try adding concrete constraints and verification cues.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            How to Improve Efficiency
          </h3>
          {evaluation.improvements.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {evaluation.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-paper-muted-foreground">
              Clean execution — every rubric requirement was satisfied.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
        <h3 className="font-semibold">Rubric Breakdown ({evaluation.score}/100)</h3>
        <div className="mt-4 space-y-3">
          {evaluation.criteria.map((c) => {
            const pct = c.max ? Math.round((c.score / c.max) * 100) : 0;
            return (
              <div key={c.criterion} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{criterionLabel(c.criterion)}</span>
                  <span className="font-mono text-xs text-paper-muted-foreground">
                    {c.score} / {c.max} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-2 bg-paper-muted" />
                <p className="text-xs text-paper-muted-foreground">{c.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>

      {evaluation.details && evaluation.details.length > 0 && (
        <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
          <h3 className="font-semibold">Answer Key &amp; Item Review</h3>
          <div className="mt-3 space-y-2">
            {evaluation.details.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2.5 rounded-lg border border-paper-border bg-paper-muted/50 p-3 text-sm"
              >
                {d.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                )}
                <div>
                  <div className="font-medium">{d.label}</div>
                  <div className="text-xs text-paper-muted-foreground">{d.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Retry for Higher Grade
            </Button>
          )}
          <Button asChild variant="subtle">
            <Link to="/profile">View Skill Report</Link>
          </Button>
        </div>

        {onNext ? (
          <Button type="button" variant="hero" onClick={onNext}>
            {nextLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : nextChallenge ? (
          <Button asChild variant="hero">
            <Link to="/play/$id" params={{ id: nextChallenge.id }}>
              Next: {nextChallenge.title}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
