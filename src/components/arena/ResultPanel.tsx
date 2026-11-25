import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, RotateCcw, TrendingUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/arena/game";
import { criterionLabel } from "@/lib/arena/scoring";
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
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/40 bg-card p-6 text-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <GradeBadge grade={efficiency.grade} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-highlight">
                <span>Mission debrief</span>
                {efficiency.signalDensity && (
                  <span className="tag border-primary/40 bg-secondary text-foreground">
                    Signal: {efficiency.signalDensity}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-2xl font-medium tabular">
                {efficiency.efficiency}% AI efficiency
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground tabular">
                {challenge.title} in {formatDuration(elapsedSeconds)} (par{" "}
                {formatDuration(efficiency.parSeconds)})
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-nebula/45 bg-secondary px-4 py-2.5 text-right">
            <div className="text-xs text-muted-foreground">XP earned</div>
            <div className="font-mono text-2xl font-medium text-nebula tabular">
              +{efficiency.xpEarned}
            </div>
          </div>
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
            <div key={pillar.label} className="rounded-lg border border-border bg-background/60 p-3">
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
        <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.5} aria-hidden />
            Strengths detected
          </h3>
          {evaluation.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-paper-muted-foreground">
              No strong rubric signals detected yet — try adding concrete constraints and verification cues
            </p>
          )}
        </div>

        <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <TrendingUp className="h-4 w-4 text-blue-700" strokeWidth={1.5} aria-hidden />
            How to improve efficiency
          </h3>
          {evaluation.improvements.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {evaluation.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-paper-muted-foreground">
              Clean execution — every rubric requirement was satisfied
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
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
                  <span className="font-mono text-xs text-paper-muted-foreground tabular">
                    {c.score} / {c.max} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-1.5 bg-paper-muted" />
                <p className="text-xs text-paper-muted-foreground">{c.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>

      {evaluation.details && evaluation.details.length > 0 && (
        <div className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground">
          <h3 className="text-base font-medium">Answer key and item review</h3>
          <div className="mt-3 space-y-2">
            {evaluation.details.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2.5 rounded-lg border border-paper-border bg-paper-muted/50 p-3 text-sm"
              >
                {d.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.5} aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" strokeWidth={1.5} aria-hidden />
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
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Retry for higher grade
            </Button>
          )}
          <Button asChild variant="subtle">
            <Link to="/profile">View skill report</Link>
          </Button>
        </div>

        {onNext ? (
          <Button type="button" variant="hero" onClick={onNext}>
            {nextLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </Button>
        ) : nextChallenge ? (
          <Button asChild variant="hero">
            <Link to="/play/$id" params={{ id: nextChallenge.id }}>
              Next: {nextChallenge.title}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
