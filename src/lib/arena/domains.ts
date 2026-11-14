import { Compass, Lightbulb, MessageSquareText, SearchCheck, ShieldCheck, Workflow, type LucideIcon } from "lucide-react";
import type { ChallengeType, Criterion, Difficulty, DomainId } from "./types";

export const DOMAINS: { id: DomainId; label: string; icon: LucideIcon; blurb: string }[] = [
  { id: "prompt", label: "Prompt Engineering", icon: MessageSquareText, blurb: "Brief AI with context, constraints and a clear output shape." },
  { id: "evaluation", label: "Critical Evaluation", icon: SearchCheck, blurb: "Spot hallucinations, weak claims and missing evidence." },
  { id: "tools", label: "AI Tool Fluency", icon: Compass, blurb: "Pick the right tool and approach for the job." },
  { id: "workflow", label: "Workflow Design", icon: Workflow, blurb: "Chain AI steps with checks and human review." },
  { id: "responsible", label: "Responsible AI", icon: ShieldCheck, blurb: "Weigh privacy, bias and harm before you ship." },
  { id: "creative", label: "Creative Problem Solving", icon: Lightbulb, blurb: "Use AI to widen options, then sharpen them." },
];
export const domainById = (id: DomainId) => DOMAINS.find((d) => d.id === id)!;

export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export const TYPE_LABEL: Record<ChallengeType, string> = {
  "prompt-write": "Write a prompt",
  "spot-flaws": "Spot the flaws",
  "best-response": "Choose best response",
  "workflow-design": "Design a workflow",
  "risk-classify": "Classify risks",
  "improve-output": "Improve an output",
};

export const CRITERION_LABEL: Record<Criterion, string> = {
  relevance: "Relevance",
  clarity: "Clarity",
  specificity: "Specificity",
  verification: "Verification & critical thinking",
  safety: "Safety & responsibility",
};
