export const TUTORIALS = {
  "tut-prompt-101": {
    id: "tut-prompt-101",
    worldId: "prompt-academy",
    title: "Anatomy of a Clear Prompt",
    steps: [
      {
        title: "Assign Role & Audience",
        body: "Start by telling the AI who it is acting as ('You are a senior analyst') and who will read the answer ('a non-technical manager deciding by Friday').",
      },
      {
        title: "Lock Output Format & Word Budget",
        body: "Specify exact shape (bullets, table, JSON) and concrete limits ('under 200 words') so you don't get an unfocused wall of text.",
      },
      {
        title: "Add Verification & Grounding Rules",
        body: "Instruct the model to cite sources, flag uncertainty, and never invent facts or quotes.",
      },
    ],
  },
  "tut-verify-101": {
    id: "tut-verify-101",
    worldId: "verification-city",
    title: "Spotting Fluent Hallucinations",
    steps: [
      {
        title: "Audit Unsourced Statistics",
        body: "Confidence does not equal truth. Precise percentages without named institutions or real links are classic hallucinations.",
      },
      {
        title: "Verify Origin Stories & Rules",
        body: "Models regularly blend similar names, companies, dates, or civic laws. Spot-check proper nouns before shipping.",
      },
      {
        title: "Separate Correlation from Cause",
        body: "Watch out for sweeping guarantees ('will certainly triple') and unvalidated causal leaps.",
      },
    ],
  },
  "tut-tools-101": {
    id: "tut-tools-101",
    worldId: "tool-forge",
    title: "Choosing Tools & Managing Tokens",
    steps: [
      {
        title: "Respect Context Windows",
        body: "Dumping 10,000 CSV rows or 400-page PDFs into chat causes silent truncation and skyrockets latency.",
      },
      {
        title: "Combine Sampling with Code Execution",
        body: "Draft categories on a 300-row sample, classify all rows with code, and spot-check a human sample by hand.",
      },
    ],
  },
  "tut-workflow-101": {
    id: "tut-workflow-101",
    worldId: "automation-factory",
    title: "Human-in-the-Loop Automation Gates",
    steps: [
      {
        title: "Redact Personal Data First",
        body: "Strip card numbers, emails, and secrets before calling external AI models.",
      },
      {
        title: "Gate Risky Outcomes",
        body: "Low-confidence drafts or actions touching money, refunds, or public policy must pass a human reviewer.",
      },
    ],
  },
  "tut-ethics-101": {
    id: "tut-ethics-101",
    worldId: "ethics-citadel",
    title: "Privacy, Fairness & AI Risk Triage",
    steps: [
      {
        title: "Keep Secrets Out of Public Bots",
        body: "API keys, customer lists, and unreleased financials belong behind strict enterprise policies—never in free public chat.",
      },
      {
        title: "Judge Impact & Reversibility",
        body: "Automated rejection of people (hiring, loans, medical beds) without human review is always high risk.",
      },
    ],
  },
  "tut-creative-101": {
    id: "tut-creative-101",
    worldId: "creative-studio",
    title: "Escaping Generic AI Clichés",
    steps: [
      {
        title: "Replace Superlatives with Concrete Specifics",
        body: "Trade empty phrases like 'the best in town' for real sensory details (own-roasted beans, open until midnight).",
      },
      {
        title: "Use AI as a Challenger, Not a Yes-Machine",
        body: "Ask for multiple perspectives, rank ideas by effort vs. impact, and request devil's-advocate critiques.",
      },
    ],
  },
};
