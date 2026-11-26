import { CRITERION_LABEL } from "../data/domains.js";

/**
 * Deterministic, rubric-based scoring. Pure functions, no network.
 * Returns normalized 0-100 score, criterion breakdown, strengths, and improvements.
 */
export function wordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function scoreCriterion(c, text, factor = 1) {
  const hits = c.signals.filter((s) => new RegExp(s.re, "im").test(text));
  const missing = c.signals.filter((s) => !hits.includes(s));
  const raw = Math.min(1, hits.length / c.need);
  const score = Math.round(c.weight * raw * factor);
  const feedback = hits.length
    ? `Found: ${hits.map((h) => h.label.toLowerCase()).join("; ")}.${raw < 1 && missing[0] ? ` Next: ${missing[0].tip}` : ""}`
    : `No evidence yet. ${missing[0]?.tip ?? ""}`;
  return {
    result: { criterion: c.criterion, score, max: c.weight, feedback },
    hits,
    missing: raw < 1 ? missing : [],
  };
}

function finalize(criteria, strengths, improvements, details) {
  const max = criteria.reduce((a, c) => a + c.max, 0) || 1;
  const total = criteria.reduce((a, c) => a + c.score, 0);
  return {
    score: Math.max(0, Math.min(100, Math.round((total / max) * 100))),
    criteria,
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5),
    details,
    evaluator: "rubric-v1",
  };
}

export function evaluateText(p, text) {
  const words = wordCount(text);
  if (p.starter && text.trim().toLowerCase() === p.starter.trim().toLowerCase()) {
    return finalize(
      p.rubric.map((c) => ({
        criterion: c.criterion,
        score: 0,
        max: c.weight,
        feedback: "Unchanged from the starting prompt.",
      })),
      [],
      ["Rewrite the starting prompt — the original was submitted unchanged."],
    );
  }
  const factor = words >= p.minWords ? 1 : words / p.minWords;
  const strengths = [];
  const improvements = [];
  if (factor < 1) {
    improvements.push(`Add more detail — ${words} words is below the ~${p.minWords} this task usually needs.`);
  }
  const criteria = p.rubric.map((c) => {
    const r = scoreCriterion(c, text, factor);
    strengths.push(...r.hits.map((h) => h.label));
    improvements.push(...r.missing.slice(0, 1).map((m) => m.tip));
    return r.result;
  });
  return finalize(criteria, strengths, improvements);
}

export function evaluateFlags(p, ids) {
  const flawed = p.segments.filter((s) => s.flawed);
  const picked = new Set(ids);
  const caught = flawed.filter((s) => picked.has(s.id)).length;
  const falsePos = p.segments.filter((s) => !s.flawed && picked.has(s.id)).length;
  const recall = flawed.length ? caught / flawed.length : 1;
  const precision = picked.size ? caught / picked.size : 0;
  const criteria = [
    {
      criterion: "verification",
      score: Math.round(60 * recall),
      max: 60,
      feedback: `You caught ${caught} of ${flawed.length} flawed sentences.`,
    },
    {
      criterion: "specificity",
      score: Math.round(40 * precision),
      max: 40,
      feedback: falsePos
        ? `${falsePos} accurate sentence${falsePos > 1 ? "s were" : " was"} flagged by mistake.`
        : picked.size
          ? "No accurate sentences were wrongly flagged."
          : "Nothing was flagged.",
    },
  ];
  const details = p.segments.map((s) => ({
    id: s.id,
    ok: s.flawed === picked.has(s.id),
    label: s.text,
    note: s.why,
  }));
  return finalize(
    criteria,
    [
      recall === 1 && "Caught every flawed claim",
      precision === 1 && picked.size > 0 && "Precise — no false alarms",
    ].filter(Boolean),
    [
      recall < 1 && "Check names, dates and statistics against a primary source.",
      falsePos > 0 && "Don't distrust everything — hedged, verifiable statements can stand.",
    ].filter(Boolean),
    details,
  );
}

export function evaluateChoice(p, id, justification) {
  const opt = p.options.find((o) => o.id === id);
  const best = p.options.reduce((a, b) => (b.quality > a.quality ? b : a));
  const jWords = wordCount(justification);
  const j = scoreCriterion(p.justification, justification, jWords >= 8 ? 1 : jWords / 8);
  const criteria = [
    {
      criterion: "relevance",
      score: Math.round(60 * (opt?.quality ?? 0)),
      max: 60,
      feedback: opt ? `${opt.label}: ${opt.why}` : "No response selected.",
    },
    j.result,
  ];
  return finalize(
    criteria,
    [opt?.id === best.id && `Picked the strongest option (${best.label})`, ...j.hits.map((h) => h.label)].filter(Boolean),
    [
      opt?.id !== best.id && `${best.label} was strongest: ${best.why}`,
      ...j.missing.slice(0, 2).map((m) => m.tip),
    ].filter(Boolean),
    p.options.map((o) => ({ id: o.id, ok: o.id === best.id, label: o.label, note: o.why })),
  );
}

export function evaluateWorkflow(p, ids) {
  const required = p.steps.filter((s) => s.order !== undefined);
  const risky = p.steps.filter((s) => s.risky);
  const chosen = ids.map((i) => p.steps.find((s) => s.id === i)).filter(Boolean);
  const chosenReq = chosen.filter((s) => s.order !== undefined);
  const coverage = required.length ? chosenReq.length / required.length : 1;
  let pairs = 0;
  let good = 0;
  for (let i = 0; i < chosenReq.length; i++) {
    for (let k = i + 1; k < chosenReq.length; k++) {
      const a = chosenReq[i];
      const b = chosenReq[k];
      if (!a || !b) continue;
      pairs++;
      if (a.order < b.order) good++;
    }
  }
  const orderScore = pairs ? good / pairs : 0;
  const verifySteps = required.filter((s) => s.verify);
  const verifyHit = verifySteps.filter((s) => ids.includes(s.id)).length / (verifySteps.length || 1);
  const riskyHit = chosen.filter((s) => s.risky);
  const safety = Math.max(0, 1 - riskyHit.length / Math.max(1, Math.ceil(risky.length / 2)));
  const missing = required.filter((s) => !ids.includes(s.id));
  const criteria = [
    {
      criterion: "relevance",
      score: Math.round(35 * coverage),
      max: 35,
      feedback: missing.length ? `Missing: ${missing.map((m) => m.label).join(", ")}.` : "All essential steps included.",
    },
    {
      criterion: "clarity",
      score: Math.round(25 * orderScore * coverage),
      max: 25,
      feedback: pairs ? `${good} of ${pairs} step pairs are in a sensible order.` : "Add at least two steps to evaluate order.",
    },
    {
      criterion: "verification",
      score: Math.round(20 * verifyHit),
      max: 20,
      feedback: verifyHit === 1 ? "Includes human review and quality checks." : "Add a review or measurement step.",
    },
    {
      criterion: "safety",
      score: Math.round(20 * safety),
      max: 20,
      feedback: riskyHit.length ? `Unsafe steps included: ${riskyHit.map((r) => r.label).join(", ")}.` : "No unsafe steps included.",
    },
  ];
  return finalize(
    criteria,
    [
      coverage === 1 && "Covered every essential step",
      orderScore === 1 && pairs > 0 && "Logical sequencing",
      verifyHit === 1 && "Human-in-the-loop checks",
      !riskyHit.length && chosen.length > 0 && "Avoided unsafe automation",
    ].filter(Boolean),
    [
      ...missing.map((m) => `Add "${m.label}" — ${m.why}`),
      ...riskyHit.map((r) => `Remove "${r.label}" — ${r.why}`),
      orderScore < 1 && pairs > 0 && "Revisit the order: protect data and gather inputs before generating.",
    ].filter(Boolean),
    p.steps.map((s) => ({
      id: s.id,
      ok: s.risky ? !ids.includes(s.id) : ids.includes(s.id),
      label: s.label,
      note: s.why,
    })),
  );
}

const LEVEL_N = { low: 0, medium: 1, high: 2 };

export function evaluateRisk(p, answers) {
  let acc = 0;
  for (const it of p.items) {
    const a = answers[it.id];
    if (!a) continue;
    const d = Math.abs(LEVEL_N[a] - LEVEL_N[it.level]);
    acc += d === 0 ? 1 : d === 1 ? 0.5 : 0;
  }
  const highs = p.items.filter((i) => i.level === "high");
  const highCaught = highs.filter((i) => answers[i.id] === "high").length;
  const criteria = [
    {
      criterion: "safety",
      score: Math.round(50 * (highs.length ? highCaught / highs.length : 1)),
      max: 50,
      feedback: `Identified ${highCaught} of ${highs.length} high-risk items.`,
    },
    {
      criterion: "specificity",
      score: Math.round(50 * (p.items.length ? acc / p.items.length : 1)),
      max: 50,
      feedback: `Calibration across all items: ${Math.round((acc / (p.items.length || 1)) * 100)}%. Adjacent levels earn half credit.`,
    },
  ];
  const wrong = p.items.filter((i) => answers[i.id] !== i.level);
  return finalize(
    criteria,
    [
      highCaught === highs.length && "Caught every high-risk case",
      wrong.length === 0 && "Perfectly calibrated",
    ].filter(Boolean),
    wrong.slice(0, 3).map((w) => `"${w.text}" is ${w.level} risk — ${w.why}`),
    p.items.map((i) => ({
      id: i.id,
      ok: answers[i.id] === i.level,
      label: `${i.text} → ${i.level}`,
      note: i.why,
    })),
  );
}

export function evaluateRubric(challenge, r) {
  const p = challenge.payload;
  if (p.kind === "text" && r.kind === "text") return evaluateText(p, r.text);
  if (p.kind === "flags" && r.kind === "flags") return evaluateFlags(p, r.ids);
  if (p.kind === "choice" && r.kind === "choice") return evaluateChoice(p, r.id, r.justification);
  if (p.kind === "workflow" && r.kind === "workflow") return evaluateWorkflow(p, r.ids);
  if (p.kind === "risk" && r.kind === "risk") return evaluateRisk(p, r.answers);
  throw new Error("Response does not match challenge type");
}

export const criterionLabel = (c) => CRITERION_LABEL[c] || c;
