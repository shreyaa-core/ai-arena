import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Lightbulb, Play, RefreshCw, Sparkles, Volume2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { domainById } from "../../data/domains.js";
import { useGame } from "../../context/GameContext.jsx";
import { materializeChallenge } from "../../engine/dynamicChallenges.js";
import { evaluate } from "../../engine/evaluator.js";
import { computeEfficiency, estimateTokens, formatDuration } from "../../engine/game.js";
import { simulatePromptOutput } from "../../engine/simulator.js";
import { speakText } from "../../utils/speech.js";
import { Button } from "../ui/button.jsx";
import { Textarea } from "../ui/textarea.jsx";
import { DynamicScenePreview } from "../game/DynamicScenePreview.jsx";
import { ModalShell } from "../game/PauseSettingsModals.jsx";

export function MissionModal() {
  const { state, stats, activeModal, setActiveModal, serverHealth, saveMissionResult } = useGame();
  const initialChallenge = activeModal?.type === "mission" ? activeModal.data?.challenge : null;
  const mode = activeModal?.type === "mission" ? activeModal.data?.mode || "campaign" : "campaign";

  const [challenge, setChallenge] = useState(initialChallenge);
  const [textVal, setTextVal] = useState("");
  const [flags, setFlags] = useState([]);
  const [choiceId, setChoiceId] = useState("");
  const [justification, setJustification] = useState("");
  const [workflowIds, setWorkflowIds] = useState([]);
  const [riskMap, setRiskMap] = useState({});
  const [hintsShown, setHintsShown] = useState(0);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [simPreview, setSimPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [useLiveAi, setUseLiveAi] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialChallenge) return;
    const mat = initialChallenge.dynamic ? materializeChallenge(initialChallenge, Date.now()) : initialChallenge;
    setChallenge(mat);
    setTextVal(mat.payload?.starter || "");
    setFlags([]);
    setChoiceId("");
    setJustification("");
    setWorkflowIds([]);
    setRiskMap({});
    setHintsShown(0);
    setTurnsUsed(0);
    setSimPreview(null);
    setResult(null);
    setSeconds(0);
    setUseLiveAi(Boolean(serverHealth.groqConfigured));
  }, [initialChallenge?.id]);

  useEffect(() => {
    if (!challenge || result) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [challenge, result]);

  if (activeModal?.type !== "mission" || !challenge) return null;

  const domain = domainById(challenge.domain);
  const close = () => setActiveModal(null);

  const rerollDynamic = () => {
    const next = materializeChallenge(challenge, Date.now());
    setChallenge(next);
    setSimPreview(null);
    setResult(null);
    setTextVal("");
  };

  const buildResponse = () => {
    const kind = challenge.payload.kind;
    if (kind === "text") return { kind: "text", text: textVal };
    if (kind === "flags") return { kind: "flags", selectedIds: flags };
    if (kind === "choice") return { kind: "choice", selectedId: choiceId, justification };
    if (kind === "workflow") return { kind: "workflow", orderedIds: workflowIds };
    if (kind === "risk") return { kind: "risk", answers: riskMap };
    return { kind: "text", text: textVal };
  };

  const runSimulation = () => {
    setTurnsUsed((t) => t + 1);
    const preview = simulatePromptOutput(challenge, textVal);
    setSimPreview(preview);
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const response = buildResponse();
      const evaluation = await evaluate(challenge, response, { useLiveAi });
      const priorSubs = (state.submissions || []).filter((s) => s.challengeId === challenge.id).length;
      const breakdown = computeEfficiency(challenge, evaluation, response, {
        seconds,
        hintsUsed,
        turnsUsed,
        isFirstClear: !stats.completedIds.includes(challenge.id),
        currentStreak: stats.currentStreak,
        priorRepeats: priorSubs,
      });
      breakdown.secondsSpent = seconds;

      await saveMissionResult({ challenge, evaluation, breakdown, response, mode });
      setResult({ evaluation, breakdown });
      if (challenge.isBoss && evaluation.score >= 60) {
        toast.success(`${challenge.title} cleared — Territory Restored!`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title={challenge.title}
      subtitle={`${domain?.label || challenge.domain} · ${challenge.difficulty} · Timer ${formatDuration(seconds)}`}
      onClose={close}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Scenario Box */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-teal-400">
              {challenge.isBoss ? "⚔ Boss Encounter" : mode === "training" ? "Training Station" : "Field Terminal"}
            </span>
            <div className="flex items-center gap-2">
              {challenge.dynamic && (
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={rerollDynamic}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Reroll Scene
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => speakText(`${challenge.scenario}. ${challenge.task}`, state.profile?.language || "en")}
              >
                <Volume2 className="mr-1 h-3 w-3" /> Listen
              </Button>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{challenge.scenario}</p>
          <p className="mt-2 text-xs font-semibold text-amber-300">Objective: {challenge.task}</p>
        </div>

        {/* Visual Prompt Reference (Static image or Procedural SVG Scene) */}
        {challenge.payload.referenceImage && (
          <div className="overflow-hidden rounded-xl border border-teal-500/30 bg-slate-950 p-2">
            <img
              src={challenge.payload.referenceImage.src}
              alt={challenge.payload.referenceImage.alt}
              className="mx-auto max-h-60 rounded-lg object-cover"
            />
            <p className="mt-1.5 text-center text-xs text-slate-400">
              {challenge.payload.referenceImage.caption}
            </p>
          </div>
        )}
        {challenge.payload.sceneSpec && <DynamicScenePreview spec={challenge.payload.sceneSpec} />}

        {/* AI Output to Improve */}
        {challenge.payload.source && (
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-950/90 p-3 font-mono text-xs text-slate-300">
            <span className="mb-1 block text-[10px] uppercase text-amber-400">{challenge.payload.source.label}</span>
            {challenge.payload.source.text}
          </pre>
        )}

        {/* Interactive Mission Body */}
        {challenge.payload.kind === "text" && (
          <div className="space-y-2.5">
            <Textarea
              rows={6}
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              placeholder={challenge.payload.placeholder}
              disabled={Boolean(result)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>~{estimateTokens(textVal)} tokens · Target ≥ {challenge.payload.minWords} words</span>
              <div className="flex items-center gap-2">
                {serverHealth.groqConfigured && (
                  <label className="flex items-center gap-1.5 text-teal-300">
                    <input
                      type="checkbox"
                      checked={useLiveAi}
                      onChange={(e) => setUseLiveAi(e.target.checked)}
                    />
                    Hybrid Groq Grading
                  </label>
                )}
                {!result && (
                  <Button size="sm" variant="outline" onClick={runSimulation}>
                    <Play className="mr-1 h-3 w-3" /> Test Simulator
                  </Button>
                )}
              </div>
            </div>

            {simPreview && (
              <div className="rounded-xl border border-sky-500/35 bg-sky-950/30 p-3 text-xs">
                <div className="flex items-center justify-between font-mono text-sky-300">
                  <span>{simPreview.mode === "simulation" ? "Simulation Mode Output Preview" : "AI Output"}</span>
                  <span>Est. Quality: {simPreview.estimatedQuality}/100</span>
                </div>
                <pre className="mt-2 whitespace-pre-wrap text-slate-200">{simPreview.simulatedOutput}</pre>
                {simPreview.failureModes.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-amber-300">
                    {simPreview.failureModes.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {challenge.payload.kind === "flags" && (
          <div className="space-y-2">
            <p className="font-mono text-xs text-slate-400">{challenge.payload.intro}</p>
            {challenge.payload.segments.map((seg) => {
              const checked = flags.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() =>
                    setFlags((prev) =>
                      prev.includes(seg.id) ? prev.filter((x) => x !== seg.id) : [...prev, seg.id],
                    )
                  }
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition ${
                    checked
                      ? "border-rose-400 bg-rose-500/15 text-white"
                      : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  <span className="mt-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px]">
                    {checked ? "FLAGGED" : "OK"}
                  </span>
                  <span>{seg.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {challenge.payload.kind === "choice" && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-300">{challenge.payload.prompt}</p>
            <div className="grid gap-2">
              {challenge.payload.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() => setChoiceId(opt.id)}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    choiceId === opt.id
                      ? "border-teal-400 bg-teal-500/15 text-white"
                      : "border-slate-700 bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <p className="font-semibold text-teal-300">{opt.label}</p>
                  <p className="mt-1">{opt.text}</p>
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain concretely why your chosen option wins…"
              disabled={Boolean(result)}
            />
          </div>
        )}

        {challenge.payload.kind === "workflow" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 rounded-xl border border-slate-700 p-3">
              <p className="font-mono text-[11px] text-slate-400">Available Pipeline Blocks (Click to add)</p>
              {challenge.payload.steps.map((st) => {
                const added = workflowIds.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={added || Boolean(result)}
                    onClick={() => setWorkflowIds((w) => [...w, st.id])}
                    className={`block w-full rounded-lg border p-2 text-left text-xs ${
                      added ? "border-slate-800 opacity-40" : "border-slate-700 bg-slate-900/70 hover:border-teal-400"
                    }`}
                  >
                    <p className="font-semibold text-white">{st.label}</p>
                    <p className="text-[11px] text-slate-400">{st.detail}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 rounded-xl border border-teal-500/30 bg-slate-900/50 p-3">
              <p className="font-mono text-[11px] text-teal-300">Active Pipeline Sequence ({workflowIds.length})</p>
              {workflowIds.map((id, idx) => {
                const st = challenge.payload.steps.find((s) => s.id === id);
                return (
                  <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 text-xs">
                    <span>{idx + 1}. {st?.label}</span>
                    {!result && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (idx === 0) return;
                            const next = [...workflowIds];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            setWorkflowIds(next);
                          }}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (idx === workflowIds.length - 1) return;
                            const next = [...workflowIds];
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            setWorkflowIds(next);
                          }}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="text-rose-400"
                          onClick={() => setWorkflowIds((w) => w.filter((x) => x !== id))}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {challenge.payload.kind === "risk" && (
          <div className="space-y-2">
            {challenge.payload.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs">
                <span className="max-w-md text-slate-200">{item.text}</span>
                <div className="flex gap-1.5">
                  {["low", "medium", "high"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={Boolean(result)}
                      onClick={() => setRiskMap((m) => ({ ...m, [item.id]: lvl }))}
                      className={`rounded-md border px-2.5 py-1 capitalize ${
                        riskMap[item.id] === lvl
                          ? lvl === "high"
                            ? "border-rose-400 bg-rose-500/25 text-white"
                            : lvl === "medium"
                              ? "border-amber-400 bg-amber-500/25 text-white"
                              : "border-emerald-400 bg-emerald-500/25 text-white"
                          : "border-slate-700 text-slate-400"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hints */}
        {!result && challenge.hints?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {hintsShown < challenge.hints.length && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setHintsShown((h) => h + 1)}
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5 text-amber-400" />
                Reveal Hint ({hintsShown}/{challenge.hints.length})
              </Button>
            )}
            {challenge.hints.slice(0, hintsShown).map((hint, idx) => (
              <span key={idx} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                {hint}
              </span>
            ))}
          </div>
        )}

        {/* Result Panel */}
        {result && (
          <div className="rounded-xl border border-teal-400/50 bg-slate-950/90 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 font-display text-2xl font-bold text-slate-950">
                  {result.breakdown.grade}
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-white">
                    Efficiency {result.breakdown.efficiency}% · Rubric {result.evaluation.score}/100
                  </p>
                  <p className="text-xs text-teal-300">
                    +{result.breakdown.xpEarned} XP · +{result.breakdown.coinsEarned} Coins · Evaluator: {result.evaluation.evaluator}
                  </p>
                </div>
              </div>
              <Button variant="hero" onClick={close}>Continue Exploration</Button>
            </div>

            {result.evaluation.strengths?.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-emerald-300">
                {result.evaluation.strengths.map((s, i) => (
                  <p key={i} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {s}</p>
                ))}
              </div>
            )}
            {result.evaluation.improvements?.length > 0 && (
              <div className="mt-2 space-y-1 text-xs text-amber-300">
                {result.evaluation.improvements.map((imp, i) => (
                  <p key={i} className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {imp}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="flex justify-end gap-2 border-t border-slate-700/70 pt-3">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="hero" disabled={busy} onClick={handleSubmit}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {busy ? "Evaluating…" : "Submit Solution"}
            </Button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
