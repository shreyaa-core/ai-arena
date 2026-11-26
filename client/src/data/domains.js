import {
  Compass,
  Lightbulb,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  Workflow,
} from "lucide-react";

export const DOMAINS = [
  {
    id: "prompt",
    label: "Prompt Engineering",
    worldId: "prompt-academy",
    worldName: "Prompt Academy",
    accent: "#14b8a6",
    icon: MessageSquareText,
    blurb: "Brief AI with context, constraints and a clear output shape.",
  },
  {
    id: "evaluation",
    label: "Critical Evaluation",
    worldId: "verification-city",
    worldName: "Verification City",
    accent: "#f59e0b",
    icon: SearchCheck,
    blurb: "Spot hallucinations, weak claims and missing evidence.",
  },
  {
    id: "tools",
    label: "AI Tool Fluency",
    worldId: "tool-foundry",
    worldName: "Tool Foundry",
    accent: "#38bdf8",
    icon: Compass,
    blurb: "Pick the right tool and approach for the job.",
  },
  {
    id: "workflow",
    label: "Workflow Design",
    worldId: "workflow-nexus",
    worldName: "Workflow Nexus",
    accent: "#818cf8",
    icon: Workflow,
    blurb: "Chain AI steps with checks and human review.",
  },
  {
    id: "responsible",
    label: "Responsible AI",
    worldId: "guardian-citadel",
    worldName: "Guardian Citadel",
    accent: "#10b981",
    icon: ShieldCheck,
    blurb: "Weigh privacy, bias and harm before you ship.",
  },
  {
    id: "creative",
    label: "Creative Problem Solving",
    worldId: "creative-forge",
    worldName: "Creative Forge",
    accent: "#f472b6",
    icon: Lightbulb,
    blurb: "Use AI to widen options, then sharpen them.",
  },
];

export const domainById = (id) => DOMAINS.find((d) => d.id === id) || DOMAINS[0];

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export const TYPE_LABEL = {
  "prompt-write": "Write a prompt",
  "image-prompt": "Recreate an image",
  "spot-flaws": "Spot the flaws",
  "best-response": "Choose best response",
  "workflow-design": "Design a workflow",
  "risk-classify": "Classify risks",
  "improve-output": "Improve an output",
  "escape-room": "AI Escape Room",
  "prompt-duel": "Prompt Duel",
  "token-budget": "Token Challenge",
};

export const CRITERION_LABEL = {
  relevance: "Relevance",
  clarity: "Clarity",
  specificity: "Specificity",
  verification: "Verification & critical thinking",
  safety: "Safety & responsibility",
};

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Complete beginner", desc: "New to prompting and AI tools" },
  { id: "occasional", label: "Occasional AI user", desc: "Tried chat tools a few times" },
  { id: "regular", label: "Regular AI user", desc: "Use AI weekly for study or work" },
  { id: "advanced", label: "Advanced AI user", desc: "Build structured workflows and prompts" },
];
