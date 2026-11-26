import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Bookmark, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { domainById, TYPE_LABEL } from "@/lib/arena/domains";
import { gradeFromScore, submissionEfficiency } from "@/lib/arena/game";
import { playClick } from "@/lib/arena/sound";
import { toggleSavedChallenge } from "@/lib/arena/storage";
import type { Challenge, Difficulty, Grade, Submission } from "@/lib/arena/types";
import { cn } from "@/lib/utils";
import { DynamicScenePreview } from "./DynamicScenePreview";

const DIFF_DOT: Record<Difficulty, string> = {
  Beginner: "bg-highlight",
  Intermediate: "bg-primary",
  Advanced: "bg-nebula",
};

const GRADE_STYLE: Record<Grade, string> = {
  S: "border-highlight/60 bg-highlight/15 text-highlight",
  A: "border-primary/70 bg-primary/25 text-foreground",
  B: "border-nebula/60 bg-nebula/20 text-nebula",
  C: "border-warning/60 bg-warning/15 text-warning",
  D: "border-destructive/60 bg-destructive/20 text-destructive",
};

export function GradeBadge({
  grade,
  size = "sm",
}: {
  grade: Grade;
  size?: "sm" | "lg";
  surface?: "dark" | "paper";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-mono font-semibold tabular",
        GRADE_STYLE[grade],
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
  stageNumber,
}: {
  challenge: Challenge;
  bestSubmission?: Submission | undefined;
  isSaved?: boolean | undefined;
  stageNumber?: number | undefined;
}) {
  const domain = domainById(challenge.domain);
  const eff = bestSubmission ? submissionEfficiency(bestSubmission) : null;
  const grade = bestSubmission ? (bestSubmission.grade ?? gradeFromScore(eff!)) : null;
  const cleared = Boolean(bestSubmission && bestSubmission.score >= 50);

  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-xl border bg-card p-5 text-foreground transition-[border-color,box-shadow] duration-150 hover:border-highlight/60 hover:shadow-[0_8px_24px_rgba(79,70,229,0.25)]",
        cleared ? "border-highlight/30" : "border-border",
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {stageNumber !== undefined && (
              <span className="font-mono text-highlight tabular">
                STAGE {String(stageNumber).padStart(2, "0")}
              </span>
            )}
            <span className="tag border-border bg-secondary text-foreground">
              <domain.icon className="h-3.5 w-3.5 text-highlight" strokeWidth={1.5} aria-hidden />
              {domain.label}
            </span>
            <span className="tag border-border bg-background/60 text-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", DIFF_DOT[challenge.difficulty])} aria-hidden />
              {challenge.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 font-mono tabular">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              {challenge.minutes}m
            </span>
            <span>{TYPE_LABEL[challenge.type]}</span>
            {challenge.dynamic && (
              <span className="tag border-highlight/45 bg-highlight/10 text-highlight">
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                Dynamic
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              toggleSavedChallenge(challenge.id);
            }}
            aria-label={isSaved ? "Remove bookmark" : "Bookmark mission"}
            className={cn(
              "rounded-md p-1.5 transition-colors duration-150 hover:bg-secondary",
              isSaved ? "text-highlight" : "text-muted-foreground",
            )}
          >
            <Bookmark className="h-4 w-4" strokeWidth={1.5} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
          {challenge.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {challenge.summary}
        </p>

        {challenge.payload.kind === "text" && challenge.payload.referenceImage && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background/60">
            <img
              src={challenge.payload.referenceImage.src}
              alt={challenge.payload.referenceImage.alt}
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {challenge.payload.kind === "text" && challenge.payload.sceneSpec && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background/60">
            <div className="max-h-32 overflow-hidden">
              <DynamicScenePreview spec={challenge.payload.sceneSpec} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3.5">
        {bestSubmission && grade !== null && eff !== null ? (
          <div className="flex items-center gap-2.5">
            <GradeBadge grade={grade} />
            <div className="text-xs tabular">
              <div className="flex items-center gap-1 font-medium text-foreground">
                {cleared ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.5} aria-hidden />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} aria-hidden />
                )}
                <span className="text-highlight">{eff}% efficiency</span>
              </div>
              <div className="font-mono text-muted-foreground">
                {cleared ? "CLEARED" : "RETRY"} · Rubric {bestSubmission.score}/100
              </div>
            </div>
          </div>
        ) : (
          <span className="font-mono text-xs text-nebula tabular">
            BOUNTY +{Math.round(100 * (challenge.difficulty === "Advanced" ? 1.5 : challenge.difficulty === "Intermediate" ? 1.25 : 1) + 80)} XP
          </span>
        )}

        <Button asChild size="sm" variant={bestSubmission ? "outline" : "hero"}>
          <Link to="/play/$id" params={{ id: challenge.id }} onClick={() => playClick()}>
            {bestSubmission ? "Replay stage" : "Play stage"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
}
