import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Bookmark, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { domainById, TYPE_LABEL } from "@/lib/arena/domains";
import { gradeFromScore, submissionEfficiency } from "@/lib/arena/game";
import { toggleSavedChallenge } from "@/lib/arena/storage";
import type { Challenge, Difficulty, Grade, Submission } from "@/lib/arena/types";
import { cn } from "@/lib/utils";

const DIFF_STYLE: Record<Difficulty, string> = {
  Beginner: "border-emerald-300 text-emerald-800 bg-emerald-50",
  Intermediate: "border-amber-300 text-amber-800 bg-amber-50",
  Advanced: "border-rose-300 text-rose-800 bg-rose-50",
};

const GRADE_STYLE_DARK: Record<Grade, string> = {
  S: "border-highlight/60 bg-highlight/20 text-highlight",
  A: "border-success/60 bg-success/20 text-success",
  B: "border-primary/60 bg-primary/20 text-primary",
  C: "border-warning/60 bg-warning/20 text-warning",
  D: "border-destructive/60 bg-destructive/20 text-destructive",
};

const GRADE_STYLE_PAPER: Record<Grade, string> = {
  S: "border-cyan-400 bg-cyan-50 text-cyan-800",
  A: "border-emerald-400 bg-emerald-50 text-emerald-800",
  B: "border-indigo-400 bg-indigo-50 text-indigo-800",
  C: "border-amber-400 bg-amber-50 text-amber-800",
  D: "border-rose-400 bg-rose-50 text-rose-800",
};

export function GradeBadge({
  grade,
  size = "sm",
  surface = "dark",
}: {
  grade: Grade;
  size?: "sm" | "lg";
  surface?: "dark" | "paper";
}) {
  const styles = surface === "paper" ? GRADE_STYLE_PAPER : GRADE_STYLE_DARK;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-display font-bold",
        styles[grade],
        size === "lg" ? "h-14 w-14 text-2xl" : "h-7 w-7 text-xs",
      )}
    >
      {grade}
    </span>
  );
}

export function MissionCard({
  challenge,
  bestSubmission,
  isSaved,
}: {
  challenge: Challenge;
  bestSubmission?: Submission | undefined;
  isSaved?: boolean | undefined;
}) {
  const domain = domainById(challenge.domain);
  const eff = bestSubmission ? submissionEfficiency(bestSubmission) : null;
  const grade = bestSubmission ? (bestSubmission.grade ?? gradeFromScore(eff!)) : null;

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground transition-shadow hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 text-paper-muted-foreground">
            <span className="chip border-paper-border bg-paper-muted text-paper-foreground">
              <domain.icon className="h-3 w-3" aria-hidden />
              {domain.label}
            </span>
            <span className={cn("chip font-semibold", DIFF_STYLE[challenge.difficulty])}>
              {challenge.difficulty}
            </span>
            <span className="chip border-paper-border">
              <Clock className="h-3 w-3" aria-hidden />
              {challenge.minutes}m par
            </span>
            <span className="chip border-paper-border">{TYPE_LABEL[challenge.type]}</span>
          </div>
          <button
            type="button"
            onClick={() => toggleSavedChallenge(challenge.id)}
            aria-label={isSaved ? "Remove bookmark" : "Bookmark mission"}
            className={cn(
              "rounded-md p-1.5 transition-colors hover:bg-paper-muted",
              isSaved ? "text-primary" : "text-paper-muted-foreground",
            )}
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug">{challenge.title}</h3>
        <p className="mt-1.5 text-sm text-paper-muted-foreground">{challenge.summary}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-paper-border pt-3.5">
        {bestSubmission && grade !== null && eff !== null ? (
          <div className="flex items-center gap-2">
            <GradeBadge grade={grade} surface="paper" />
            <div className="text-xs">
              <div className="flex items-center gap-1 font-semibold text-paper-foreground">
                {bestSubmission.score >= 50 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden />
                )}
                {eff}% efficiency
              </div>
              <div className="text-paper-muted-foreground">Rubric {bestSubmission.score}/100</div>
            </div>
          </div>
        ) : (
          <span className="text-xs font-medium text-paper-muted-foreground">
            Unplayed • Up to +{Math.round(100 * (challenge.difficulty === "Advanced" ? 1.5 : challenge.difficulty === "Intermediate" ? 1.25 : 1) + 80)} XP
          </span>
        )}

        <Button asChild size="sm" variant={bestSubmission ? "paper" : "hero"}>
          <Link to="/play/$id" params={{ id: challenge.id }}>
            {bestSubmission ? "Replay" : "Start Mission"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
}
