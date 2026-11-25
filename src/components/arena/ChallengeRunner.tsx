import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Bot,
  Check,
  Clock,
  Eye,
  Lightbulb,
  Play,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { domainById, TYPE_LABEL } from "@/lib/arena/domains";
import { evaluate } from "@/lib/arena/evaluator";
import {
  computeEfficiency,
  computePlayerStats,
  estimateTokens,
  formatDuration,
  getParSeconds,
} from "@/lib/arena/game";
import { wordCount } from "@/lib/arena/scoring";
import { simulatePromptOutput, type SimulationPreview } from "@/lib/arena/simulator";
import { recordSubmission, toggleSavedChallenge, useArenaState } from "@/lib/arena/storage";
import type {
  Challenge,
  ChallengeResponse,
  EfficiencyBreakdown,
  EvaluationResult,
  RiskLevel,
  Submission,
} from "@/lib/arena/types";
import { cn } from "@/lib/utils";
import { ResultPanel } from "./ResultPanel";

function initialResponse(challenge: Challenge): ChallengeResponse {
  const p = challenge.payload;
  if (p.kind === "text") return { kind: "text", text: p.starter ?? "" };
  if (p.kind === "flags") return { kind: "flags", ids: [] };
  if (p.kind === "choice") return { kind: "choice", id: null, justification: "" };
  if (p.kind === "workflow") return { kind: "workflow", ids: [] };
  return { kind: "risk", answers: {} };
}

function canSubmit(challenge: Challenge, r: ChallengeResponse): boolean {
  if (r.kind === "text") return r.text.trim().length > 0;
  if (r.kind === "flags") return true;
  if (r.kind === "choice") return r.id !== null && r.justification.trim().length > 0;
  if (r.kind === "workflow") return r.ids.length > 0;
  if (r.kind === "risk" && challenge.payload.kind === "risk") {
    return Object.keys(r.answers).length === challenge.payload.items.length;
  }
  return false;
}

export function ChallengeRunner({
  challenge,
  modeLabel,
  nextChallenge,
  onCompleted,
  onNext,
  nextLabel,
  disableRetry,
}: {
  challenge: Challenge;
  modeLabel?: string | undefined;
  nextChallenge?: Challenge | undefined;
  onCompleted?:
    | ((payload: {
        evaluation: EvaluationResult;
        efficiency: EfficiencyBreakdown;
        submission: Submission;
        seconds: number;
      }) => void)
    | undefined;
  onNext?: (() => void) | undefined;
  nextLabel?: string | undefined;
  disableRetry?: boolean | undefined;
}) {
  const state = useArenaState();
  const domain = domainById(challenge.domain);
  const parSeconds = getParSeconds(challenge);
  const isSaved = state.saved.includes(challenge.id);

  const [response, setResponse] = useState<ChallengeResponse>(() => initialResponse(challenge));
  const [seconds, setSeconds] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [simulation, setSimulation] = useState<SimulationPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<{
    evaluation: EvaluationResult;
    efficiency: EfficiencyBreakdown;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    setResponse(initialResponse(challenge));
    setSeconds(0);
    setHintsShown(0);
    setTurnsUsed(0);
    setSimulation(null);
    setOutcome(null);
  }, [challenge]);

  useEffect(() => {
    if (outcome) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [outcome, challenge.id]);

  const handleSimulate = () => {
    if (response.kind !== "text") return;
    const preview = simulatePromptOutput(challenge, response.text);
    setSimulation(preview);
    setTurnsUsed((t) => t + 1);
  };

  const handleSubmit = async () => {
    if (!canSubmit(challenge, response) || submitting) return;
    setSubmitting(true);
    try {
      const evaluation = await evaluate(challenge, response);
      const stats = computePlayerStats(state);
      const isFirstClear = !stats.bestByChallenge[challenge.id];
      const efficiency = computeEfficiency(challenge, evaluation, response, {
        seconds: Math.max(5, seconds),
        hintsUsed: hintsShown,
        turnsUsed,
        isFirstClear,
        currentStreak: stats.currentStreak,
      });

      const sub: Submission = {
        id: `${challenge.id}-${Date.now()}`,
        challengeId: challenge.id,
        score: evaluation.score,
        efficiency: efficiency.efficiency,
        grade: efficiency.grade,
        xp: efficiency.xpEarned,
        hintsUsed: hintsShown,
        turnsUsed,
        criteria: evaluation.criteria,
        seconds: Math.max(5, seconds),
        at: new Date().toISOString(),
      };
      recordSubmission(sub);
      setOutcome({ evaluation, efficiency, seconds: Math.max(5, seconds) });

      toast.success(`Grade ${efficiency.grade} (+${efficiency.xpEarned} XP)`, {
        description: `${efficiency.efficiency}% AI efficiency (${evaluation.score}/100 rubric)`,
      });

      onCompleted?.({ evaluation, efficiency, submission: sub, seconds: Math.max(5, seconds) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResponse(initialResponse(challenge));
    setSeconds(0);
    setHintsShown(0);
    setTurnsUsed(0);
    setSimulation(null);
    setOutcome(null);
  };

  const overtime = seconds > parSeconds;

  return (
    <div className="space-y-6">
      {/* Live Mission Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {modeLabel && (
            <span className="tag border-primary/40 bg-primary/15 text-foreground font-mono">
              {modeLabel}
            </span>
          )}
          <span className="tag border-border bg-secondary text-foreground">
            <domain.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            {domain.label}
          </span>
          <span className="text-muted-foreground">{TYPE_LABEL[challenge.type]}</span>
          <span className="text-muted-foreground">{challenge.difficulty}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span
            className={cn(
              "keycap",
              overtime ? "border-warning/60 text-warning" : "border-highlight/45 text-highlight",
            )}
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {formatDuration(seconds)} / {formatDuration(parSeconds)} par
          </span>
          {challenge.payload.kind === "text" && (
            <span className="font-mono text-highlight tabular">
              {turnsUsed === 0 ? "1-shot ready" : `${turnsUsed} sim runs`}
            </span>
          )}
          <span className="font-mono text-warning tabular">
            Hints {hintsShown}/{challenge.hints.length}
          </span>
          <button
            type="button"
            onClick={() => toggleSavedChallenge(challenge.id)}
            aria-label={isSaved ? "Remove bookmark" : "Bookmark mission"}
            className={cn(
              "rounded-md border border-border p-1.5 transition-colors duration-150 hover:bg-secondary",
              isSaved ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Bookmark className="h-4 w-4" strokeWidth={1.5} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {outcome ? (
        <ResultPanel
          challenge={challenge}
          evaluation={outcome.evaluation}
          efficiency={outcome.efficiency}
          elapsedSeconds={outcome.seconds}
          onRetry={disableRetry ? undefined : handleRetry}
          nextChallenge={nextChallenge}
          onNext={onNext}
          nextLabel={nextLabel}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Mission Briefing */}
          <aside className="space-y-4 lg:col-span-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <h1 className="text-xl font-medium">{challenge.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {challenge.scenario}
              </p>

              <div className="mt-4 rounded-lg border border-border bg-secondary p-3.5">
                <div className="text-xs font-medium text-muted-foreground">Objective</div>
                <p className="mt-1 text-sm text-foreground">{challenge.task}</p>
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground">Requirements</div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {challenge.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                  <span>Hints</span>
                </div>
                {hintsShown < challenge.hints.length && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setHintsShown((h) => Math.min(challenge.hints.length, h + 1))}
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    Reveal hint (-18%)
                  </Button>
                )}
              </div>

              {hintsShown === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Solve without hints to keep your 100% zero-assist bonus
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {challenge.hints.slice(0, hintsShown).map((hint, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-border bg-secondary p-3 text-xs leading-relaxed text-foreground"
                    >
                      <span className="font-mono text-muted-foreground">Hint {idx + 1}: </span>
                      {hint}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Right Paper Worksheet */}
          <section className="rounded-xl border border-paper-border bg-paper p-5 text-paper-foreground lg:col-span-7">
            {challenge.payload.kind === "text" && response.kind === "text" && (
              <div className="space-y-4">
                {challenge.payload.source && (
                  <div className="rounded-lg border border-paper-border bg-paper-muted p-4">
                    <div className="text-xs font-medium text-paper-muted-foreground">
                      {challenge.payload.source.label}
                    </div>
                    <pre className="mt-1.5 whitespace-pre-wrap font-sans text-sm">
                      {challenge.payload.source.text}
                    </pre>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="prompt-editor" className="text-sm font-medium">
                      Your prompt or edited output
                    </label>
                    <div className="flex items-center gap-3 font-mono text-xs text-paper-muted-foreground tabular">
                      <span>
                        {wordCount(response.text)} / ~{challenge.payload.minWords} words
                      </span>
                      <span>~{estimateTokens(response.text)} tokens</span>
                    </div>
                  </div>
                  <Textarea
                    id="prompt-editor"
                    value={response.text}
                    onChange={(e) => setResponse({ kind: "text", text: e.target.value })}
                    placeholder={challenge.payload.placeholder.replace("…", "")}
                    rows={10}
                    className="border-paper-border bg-white text-paper-foreground placeholder:text-paper-muted-foreground/70"
                  />
                </div>

                {simulation && (
                  <div className="rounded-lg border border-paper-border bg-paper-muted p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium text-paper-foreground">
                        <Bot className="h-4 w-4 text-paper-muted-foreground" strokeWidth={1.5} aria-hidden />
                        Simulated AI output (practice preview)
                      </span>
                      <span className="font-mono text-xs font-medium tabular">
                        Est. quality {simulation.estimatedQuality}/100
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-paper-foreground">
                      {simulation.simulatedOutput}
                    </p>
                    {simulation.failureModes.length > 0 && (
                      <div className="mt-3 border-t border-paper-border pt-2.5">
                        <div className="text-xs font-medium text-amber-800">
                          Failure modes detected
                        </div>
                        <ul className="mt-1 space-y-1 text-xs text-paper-muted-foreground">
                          {simulation.failureModes.map((f, i) => (
                            <li key={i}>• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="paper"
                    onClick={handleSimulate}
                    disabled={!response.text.trim()}
                  >
                    <Play className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Test in simulator
                  </Button>

                  <Button
                    type="button"
                    variant="paperPrimary"
                    onClick={handleSubmit}
                    disabled={!canSubmit(challenge, response) || submitting}
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    {turnsUsed === 0 ? "Submit one-shot" : "Submit final answer"}
                  </Button>
                </div>
              </div>
            )}

            {challenge.payload.kind === "flags" && response.kind === "flags" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-medium">{challenge.payload.intro}</h2>
                  <span className="font-mono text-xs text-paper-muted-foreground tabular">
                    {response.ids.length} flagged
                  </span>
                </div>
                <p className="text-xs text-paper-muted-foreground">
                  Select any sentence that is fabricated, wrong, or unsupported. Leave accurate statements unflagged.
                </p>

                <div className="space-y-2">
                  {challenge.payload.segments.map((seg, i) => {
                    const active = response.ids.includes(seg.id);
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() =>
                          setResponse({
                            kind: "flags",
                            ids: active
                              ? response.ids.filter((x) => x !== seg.id)
                              : [...response.ids, seg.id],
                          })
                        }
                        className={cn(
                          "flex w-full items-start justify-between gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors duration-150",
                          active
                            ? "border-rose-300 bg-rose-50 text-paper-foreground"
                            : "border-paper-border bg-white hover:bg-paper-muted/50",
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 font-mono text-xs text-paper-muted-foreground tabular">
                            {i + 1}.
                          </span>
                          <span>{seg.text}</span>
                        </div>
                        <span
                          className={cn(
                            "tag shrink-0",
                            active
                              ? "border-rose-300 bg-rose-100 text-rose-800"
                              : "border-paper-border text-paper-muted-foreground",
                          )}
                        >
                          {active ? "Flagged" : "Clean"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="button" variant="paperPrimary" onClick={handleSubmit} disabled={submitting}>
                    <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Submit audit ({response.ids.length} flagged)
                  </Button>
                </div>
              </div>
            )}

            {challenge.payload.kind === "choice" && response.kind === "choice" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-paper-border bg-paper-muted p-3.5 text-sm font-medium">
                  {challenge.payload.prompt}
                </div>

                <div className="space-y-2">
                  {challenge.payload.options.map((opt) => {
                    const selected = response.id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setResponse({ ...response, id: opt.id })}
                        className={cn(
                          "w-full rounded-lg border p-4 text-left transition-colors duration-150",
                          selected
                            ? "border-blue-400 bg-blue-50/70"
                            : "border-paper-border bg-white hover:bg-paper-muted/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{opt.label}</span>
                          <span
                            className={cn(
                              "h-4 w-4 rounded-full border",
                              selected
                                ? "border-blue-700 bg-blue-700"
                                : "border-paper-muted-foreground/40",
                            )}
                          />
                        </div>
                        <p className="mt-1.5 text-sm text-paper-muted-foreground">{opt.text}</p>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label htmlFor="choice-justify" className="text-sm font-medium">
                    Why is this option strongest (1–2 sentences)
                  </label>
                  <Textarea
                    id="choice-justify"
                    value={response.justification}
                    onChange={(e) => setResponse({ ...response, justification: e.target.value })}
                    placeholder="Explain what makes it reliable and testable"
                    rows={3}
                    className="mt-1.5 border-paper-border bg-white text-paper-foreground"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="paperPrimary"
                    onClick={handleSubmit}
                    disabled={!canSubmit(challenge, response) || submitting}
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Submit selection
                  </Button>
                </div>
              </div>
            )}

            {challenge.payload.kind === "workflow" && response.kind === "workflow" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-medium">Goal: {challenge.payload.goal}</h2>
                    <p className="text-xs text-paper-muted-foreground">
                      Add safe steps into your pipeline and arrange them in execution order. Leave out harmful steps.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-paper-muted-foreground tabular">
                    {response.ids.length} selected
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-paper-muted-foreground">
                      Available steps
                    </div>
                    {challenge.payload.steps
                      .filter((s) => !response.ids.includes(s.id))
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-paper-border bg-white p-3"
                        >
                          <div>
                            <div className="text-sm font-medium">{step.label}</div>
                            <div className="text-xs text-paper-muted-foreground">{step.detail}</div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="paper"
                            className="shrink-0"
                            onClick={() =>
                              setResponse({ kind: "workflow", ids: [...response.ids, step.id] })
                            }
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-paper-muted-foreground">
                      Pipeline order
                    </div>
                    {response.ids.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-paper-border p-6 text-center text-xs text-paper-muted-foreground">
                        Add steps from the left to assemble your workflow
                      </div>
                    ) : (
                      response.ids.map((id, idx) => {
                        const step =
                          challenge.payload.kind === "workflow"
                            ? challenge.payload.steps.find((s) => s.id === id)
                            : undefined;
                        if (!step) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-blue-300 bg-blue-50/60 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 font-mono text-xs font-medium text-blue-700 tabular">
                                {idx + 1}.
                              </span>
                              <div>
                                <div className="text-sm font-medium">{step.label}</div>
                                <div className="text-xs text-paper-muted-foreground">
                                  {step.detail}
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                aria-label="Move step up"
                                disabled={idx === 0}
                                onClick={() => {
                                  const next = [...response.ids];
                                  const prevItem = next[idx - 1];
                                  const curItem = next[idx];
                                  if (prevItem && curItem) {
                                    next[idx - 1] = curItem;
                                    next[idx] = prevItem;
                                    setResponse({ kind: "workflow", ids: next });
                                  }
                                }}
                                className="rounded p-1 hover:bg-paper-muted disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                aria-label="Move step down"
                                disabled={idx === response.ids.length - 1}
                                onClick={() => {
                                  const next = [...response.ids];
                                  const curItem = next[idx];
                                  const nextItem = next[idx + 1];
                                  if (curItem && nextItem) {
                                    next[idx] = nextItem;
                                    next[idx + 1] = curItem;
                                    setResponse({ kind: "workflow", ids: next });
                                  }
                                }}
                                className="rounded p-1 hover:bg-paper-muted disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                aria-label="Remove step"
                                onClick={() =>
                                  setResponse({
                                    kind: "workflow",
                                    ids: response.ids.filter((x) => x !== id),
                                  })
                                }
                                className="rounded p-1 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="paperPrimary"
                    onClick={handleSubmit}
                    disabled={!canSubmit(challenge, response) || submitting}
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Deploy pipeline
                  </Button>
                </div>
              </div>
            )}

            {challenge.payload.kind === "risk" && response.kind === "risk" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-medium">
                    <ShieldAlert className="h-4 w-4 text-paper-muted-foreground" strokeWidth={1.5} aria-hidden />
                    Classify each case
                  </h2>
                  <span className="font-mono text-xs text-paper-muted-foreground tabular">
                    {Object.keys(response.answers).length} / {challenge.payload.items.length} rated
                  </span>
                </div>

                <div className="space-y-2.5">
                  {challenge.payload.items.map((item) => {
                    const current = response.answers[item.id];
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-3 rounded-lg border border-paper-border bg-white p-3.5 sm:flex-row sm:items-center"
                      >
                        <p className="text-sm font-medium">{item.text}</p>
                        <div className="flex shrink-0 gap-1.5">
                          {(["low", "medium", "high"] as RiskLevel[]).map((lvl) => {
                            const active = current === lvl;
                            const activeStyle =
                              lvl === "high"
                                ? "border-rose-700 bg-rose-600 text-white"
                                : lvl === "medium"
                                  ? "border-amber-600 bg-amber-500 text-white"
                                  : "border-emerald-700 bg-emerald-600 text-white";
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() =>
                                  setResponse({
                                    kind: "risk",
                                    answers: { ...response.answers, [item.id]: lvl },
                                  })
                                }
                                className={cn(
                                  "rounded-md border px-3 py-1 text-xs font-medium capitalize transition-colors duration-150",
                                  active
                                    ? activeStyle
                                    : "border-paper-border bg-paper-muted/50 text-paper-muted-foreground hover:bg-paper-muted",
                                )}
                              >
                                {lvl}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="paperPrimary"
                    onClick={handleSubmit}
                    disabled={!canSubmit(challenge, response) || submitting}
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Submit risk triage
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
