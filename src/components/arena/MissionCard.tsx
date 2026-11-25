import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Bookmark, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { domainById, TYPE_LABEL } from "@/lib/arena/domains";
import { gradeFromScore, submissionEfficiency } from "@/lib/arena/game";
import { toggleSavedChallenge } from "@/lib/arena/storage";
import type { Challenge, Difficulty, Grade, Submission } from "@/lib/arena/types";
import { cn } from "@/lib/utils";

const DIFF_DOT: Record<Difficulty, string> = {
  Beginner: "bg-emerald-600",
  Intermediate: "bg-amber-600",
  Advanced: "bg-rose-600",
};

const GRADE_STYLE_DARK: Record<Grade, string> = {
  S: "border-primary/40 bg-primary/15 text-primary",
  A: "border-success/40 bg-success/15 text-success",
  B: "border-border bg-secondary text-foreground",
  C: "border-warning/40 bg-warning/15 text-warning",
  D: "border-destructive/40 bg-destructive/15 text-destructive",
};

const GRADE_STYLE_PAPER: Record<Grade, string> = {
  S: "border-blue-300 bg-blue-50 text-blue-800",
  A: "border-emerald-300 bg-emerald-50 text-emerald-800",
  B: "border-slate-300 bg-slate-100 text-slate-800",
  C: "border-amber-300 bg-amber-50 text-amber-800",
  D: "border-rose-300 bg-rose-50 text-rose-800",
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
        "inline-flex items-center justify-center rounded-md border font-mono font-medium tabular",
        styles[grade],
        size === "lg" ? "h-12 w-12 text-xl" : "h-7 w-7 text-xs",
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
    <article className="flex flex-col justify-between rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] duration-150 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-paper-muted-foreground">
            <span className="tag border-paper-border bg-paper-muted text-paper-foreground">
              <domain.icon className="h-3.5 w-3.5 text-paper-muted-foreground" strokeWidth={1.5} aria-hidden />
              {domain.label}
            </span>
            <span className="tag border-paper-border bg-white text-paper-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", DIFF_DOT[challenge.difficulty])} aria-hidden />
              {challenge.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 font-mono tabular">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              {challenge.minutes}m
            </span>
            <span>{TYPE_LABEL[challenge.type]}</span>
          </div>
          <button
            type="button"
            onClick={() => toggleSavedChallenge(challenge.id)}
            aria-label={isSaved ? "Remove bookmark" : "Bookmark mission"}
            className={cn(
              "rounded-md p-1.5 transition-colors duration-150 hover:bg-paper-muted",
              isSaved ? "text-blue-700" : "text-paper-muted-foreground",
            )}
          >
            <Bookmark className="h-4 w-4" strokeWidth={1.5} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        <h3 className="mt-3 text-base font-medium leading-snug text-paper-foreground">
          {challenge.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-paper-muted-foreground">
          {challenge.summary}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-paper-border pt-3.5">
        {bestSubmission && grade !== null && eff !== null ? (
          <div className="flex items-center gap-2.5">
            <GradeBadge grade={grade} surface="paper" />
            <div className="text-xs tabular">
              <div className="flex items-center gap-1 font-medium text-paper-foreground">
                {bestSubmission.score >= 50 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} aria-hidden />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" strokeWidth={1.5} aria-hidden />
                )}
                <span>{eff}% efficiency</span>
              </div>
              <div className="font-mono text-paper-muted-foreground">
                Rubric {bestSubmission.score}/100
              </div>
            </div>
          </div>
        ) : (
          <span className="font-mono text-xs text-paper-muted-foreground tabular">
            Up to +{Math.round(100 * (challenge.difficulty === "Advanced" ? 1.5 : challenge.difficulty === "Intermediate" ? 1.25 : 1) + 80)} XP
          </span>
        )}

        <Button asChild size="sm" variant={bestSubmission ? "paper" : "paperPrimary"}>
          <Link to="/play/$id" params={{ id: challenge.id }}>
            {bestSubmission ? "Replay" : "Start mission"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
}
