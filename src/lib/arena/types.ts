export type DomainId = "prompt" | "evaluation" | "tools" | "workflow" | "responsible" | "creative";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type ChallengeType =
  | "prompt-write"
  | "image-prompt"
  | "spot-flaws"
  | "best-response"
  | "workflow-design"
  | "risk-classify"
  | "improve-output";
export type Criterion = "relevance" | "clarity" | "specificity" | "verification" | "safety";
export type RiskLevel = "low" | "medium" | "high";
export type Grade = "S" | "A" | "B" | "C" | "D";

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

export interface DynamicSceneSpec {
  seed: number;
  subject: "station" | "rover" | "lighthouse" | "observatory" | "drone" | "monolith";
  setting: "orbit" | "crater" | "coast" | "cavern" | "dunes";
  lighting: "cyan-amber" | "magenta-sunset" | "violet-teal" | "solar-gold";
  framing: "isometric" | "wide" | "closeup" | "low-angle";
  style: "vector" | "blueprint" | "retro-poster" | "geometric";
  prop: "moons" | "comet" | "rings" | "mist";
}

export interface TextPayload {
  kind: "text";
  starter?: string;
  source?: { label: string; text: string };
  referenceImage?: { src: string; alt: string; caption?: string } | undefined;
  sceneSpec?: DynamicSceneSpec | undefined;
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
  dynamic?: boolean | undefined;
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
  details?: { id: string; ok: boolean; label: string; note: string }[] | undefined;
  evaluator: "rubric-v1" | "llm";
}

export interface EfficiencyBreakdown {
  /** Overall 0–100 AI Efficiency Score combining quality, speed, turns, and independence. */
  efficiency: number;
  grade: Grade;
  rubricScore: number;
  speedScore: number;
  turnScore: number;
  hintScore: number;
  parSeconds: number;
  xpEarned: number;
  bonuses: string[];
  signalDensity?: "Concise" | "Balanced" | "Verbose" | "Too Brief" | undefined;
}

export interface Submission {
  id: string;
  challengeId: string;
  score: number;
  efficiency?: number;
  grade?: Grade;
  xp?: number;
  hintsUsed?: number;
  turnsUsed?: number;
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
export interface BlitzRecord {
  id: string;
  preset: string;
  averageEfficiency: number;
  grade: Grade;
  totalSeconds: number;
  xpEarned: number;
  at: string;
}
export interface ArenaState {
  version: 1;
  profile: Profile;
  submissions: Submission[];
  saved: string[];
  blitzRuns?: BlitzRecord[];
}
