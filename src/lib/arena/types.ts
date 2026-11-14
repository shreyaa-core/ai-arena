export type DomainId = "prompt" | "evaluation" | "tools" | "workflow" | "responsible" | "creative";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type ChallengeType =
  | "prompt-write"
  | "spot-flaws"
  | "best-response"
  | "workflow-design"
  | "risk-classify"
  | "improve-output";
export type Criterion = "relevance" | "clarity" | "specificity" | "verification" | "safety";
export type RiskLevel = "low" | "medium" | "high";

/** A regex-detectable signal of quality in free text. */
export interface Signal {
  re: string;
  label: string;
  tip: string;
}
export interface TextCriterion {
  criterion: Criterion;
  weight: number;
  /** Number of signals needed for full marks. */
  need: number;
  signals: Signal[];
}

export interface TextPayload {
  kind: "text";
  starter?: string;
  source?: { label: string; text: string };
  placeholder: string;
  minWords: number;
  rubric: TextCriterion[];
}
export interface FlawPayload {
  kind: "flags";
  intro: string;
  segments: { id: string; text: string; flawed: boolean; why: string }[];
}
export interface ChoicePayload {
  kind: "choice";
  prompt: string;
  options: { id: string; label: string; text: string; quality: number; why: string }[];
  justification: TextCriterion;
}
export interface WorkflowStep {
  id: string;
  label: string;
  detail: string;
  /** Defined = required step; ascending order is the ideal sequence. */
  order?: number;
  verify?: boolean;
  risky?: boolean;
  why: string;
}
export interface WorkflowPayload {
  kind: "workflow";
  goal: string;
  steps: WorkflowStep[];
}
export interface RiskPayload {
  kind: "risk";
  items: { id: string; text: string; level: RiskLevel; why: string }[];
}
export type Payload = TextPayload | FlawPayload | ChoicePayload | WorkflowPayload | RiskPayload;

export interface Challenge {
  id: string;
  title: string;
  domain: DomainId;
  difficulty: Difficulty;
  minutes: number;
  type: ChallengeType;
  summary: string;
  scenario: string;
  task: string;
  hints: string[];
  requirements: string[];
  payload: Payload;
}

export type ChallengeResponse =
  | { kind: "text"; text: string }
  | { kind: "flags"; ids: string[] }
  | { kind: "choice"; id: string | null; justification: string }
  | { kind: "workflow"; ids: string[] }
  | { kind: "risk"; answers: Record<string, RiskLevel> };

export interface CriterionScore {
  criterion: Criterion;
  score: number;
  max: number;
  feedback: string;
}
export interface EvaluationResult {
  /** Normalized 0–100. */
  score: number;
  criteria: CriterionScore[];
  strengths: string[];
  improvements: string[];
  details?: { id: string; ok: boolean; label: string; note: string }[];
  evaluator: "rubric-v1" | "llm";
}

export interface Submission {
  id: string;
  challengeId: string;
  score: number;
  criteria: CriterionScore[];
  seconds: number;
  at: string;
}
export type Experience = "new" | "regular" | "power";
export type Goal = "career" | "study" | "productivity" | "creativity";
export interface Profile {
  alias: string;
  experience: Experience | null;
  goal: Goal | null;
  onboarded: boolean;
  email: string | null;
}
export interface ArenaState {
  version: 1;
  profile: Profile;
  submissions: Submission[];
  saved: string[];
}
