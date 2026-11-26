const SUBJECTS = [
  {
    id: "station",
    label: "Orbital space station with solar panels",
    signal: {
      re: "station|satellite|solar|panel|module",
      label: "Names the orbital station",
      tip: "Describe the orbital space station and its solar panels.",
    },
  },
  {
    id: "rover",
    label: "Six-wheeled exploration rover",
    signal: {
      re: "rover|wheel|robot|vehicle|probe",
      label: "Names the exploration rover",
      tip: "Identify the exploration rover.",
    },
  },
  {
    id: "lighthouse",
    label: "Tall cliffside beacon lighthouse",
    signal: {
      re: "lighthouse|beacon|tower|beam",
      label: "Names the beacon lighthouse",
      tip: "Describe the lighthouse and its beam.",
    },
  },
  {
    id: "observatory",
    label: "Domed astronomical observatory",
    signal: {
      re: "observatory|dome|telescope",
      label: "Names the domed observatory",
      tip: "Describe the domed observatory.",
    },
  },
  {
    id: "drone",
    label: "Hovering autonomous surveyor drone",
    signal: {
      re: "drone|quadcopter|hover|uav|craft",
      label: "Names the hovering drone",
      tip: "Identify the hovering surveyor drone.",
    },
  },
  {
    id: "monolith",
    label: "Floating crystal monolith",
    signal: {
      re: "monolith|crystal|obelisk|shard|pillar",
      label: "Names the crystal monolith",
      tip: "Describe the floating crystal monolith.",
    },
  },
];

const SETTINGS = [
  {
    id: "orbit",
    label: "deep space above a curved planet horizon",
    signal: {
      re: "space|orbit|planet|horizon|stars|starfield",
      label: "Sets the orbital space setting",
      tip: "Place the subject in orbit above a planet horizon.",
    },
  },
  {
    id: "crater",
    label: "a rocky volcanic crater rim",
    signal: {
      re: "crater|rocky|volcan|ridge|canyon|terrain",
      label: "Sets the rocky crater terrain",
      tip: "Describe the rocky crater / ridge setting.",
    },
  },
  {
    id: "coast",
    label: "dark ocean cliffs under night waves",
    signal: {
      re: "cliff|ocean|sea|coast|water|wave",
      label: "Sets the coastal cliff setting",
      tip: "Mention the coastal cliffs and water below.",
    },
  },
  {
    id: "cavern",
    label: "a crystalline ice cavern",
    signal: {
      re: "cavern|cave|ice|glacier|stalactite|frozen",
      label: "Sets the ice cavern setting",
      tip: "Describe the crystalline ice cavern.",
    },
  },
  {
    id: "dunes",
    label: "sweeping desert sand dunes",
    signal: {
      re: "dune|desert|sand|arid",
      label: "Sets the desert dunes setting",
      tip: "Mention the sweeping desert sand dunes.",
    },
  },
];

const LIGHTINGS = [
  {
    id: "cyan-amber",
    label: "electric cyan rim light with warm amber accents",
    signal: {
      re: "cyan|teal|aqua|amber|warm|orange",
      label: "Captures cyan & amber lighting",
      tip: "Specify the electric cyan rim light and warm amber accents.",
    },
  },
  {
    id: "magenta-sunset",
    label: "hot magenta & deep indigo twilight backlight",
    signal: {
      re: "magenta|pink|neon|indigo|twilight|sunset|backlight",
      label: "Captures magenta twilight lighting",
      tip: "Describe the magenta and indigo twilight backlight.",
    },
  },
  {
    id: "violet-teal",
    label: "nebula violet glow with cool teal shadows",
    signal: {
      re: "violet|purple|nebula|teal|bioluminescen|glow",
      label: "Captures violet & teal glow",
      tip: "Include the nebula violet and teal glow.",
    },
  },
  {
    id: "solar-gold",
    label: "crisp golden-hour directional sunlight",
    signal: {
      re: "gold|golden|sunlight|sun|warm light|spotlight",
      label: "Captures golden sunlight",
      tip: "Describe the golden-hour directional sunlight.",
    },
  },
];

const FRAMINGS = [
  {
    id: "isometric",
    label: "isometric three-quarter view",
    signal: {
      re: "isometric|three-?quarter|3/4|angled",
      label: "Specifies isometric framing",
      tip: "Specify an isometric or angled three-quarter view.",
    },
  },
  {
    id: "wide",
    label: "wide panoramic landscape shot",
    signal: {
      re: "wide|panoramic|landscape|establishing|horizon",
      label: "Specifies wide framing",
      tip: "Specify a wide panoramic landscape shot.",
    },
  },
  {
    id: "closeup",
    label: "centered close-up hero framing",
    signal: {
      re: "close-?up|centered|macro|detail|foreground",
      label: "Specifies centered close-up",
      tip: "Specify centered close-up framing.",
    },
  },
  {
    id: "low-angle",
    label: "dramatic low-angle upward shot",
    signal: {
      re: "low-?angle|looking up|worm|dramatic angle|hero shot",
      label: "Specifies low-angle framing",
      tip: "Mention the dramatic low-angle perspective.",
    },
  },
];

const STYLES = [
  {
    id: "vector",
    label: "clean painted vector illustration",
    signal: {
      re: "vector|illustration|stylized|clean art|digital art",
      label: "Specifies vector illustration style",
      tip: "Name the clean vector illustration style.",
    },
  },
  {
    id: "blueprint",
    label: "technical sci-fi blueprint schematic",
    signal: {
      re: "blueprint|schematic|technical|wireframe|cad|grid",
      label: "Specifies blueprint schematic style",
      tip: "Call out the technical blueprint schematic style.",
    },
  },
  {
    id: "retro-poster",
    label: "retro sci-fi book-cover poster art",
    signal: {
      re: "retro|poster|vintage|book.?cover|synth|arcade",
      label: "Specifies retro sci-fi poster style",
      tip: "Mention the retro sci-fi poster style.",
    },
  },
  {
    id: "geometric",
    label: "crisp flat geometric minimalism",
    signal: {
      re: "geometric|minimal|flat|sharp shape|polygon",
      label: "Specifies geometric style",
      tip: "Mention the flat geometric minimal style.",
    },
  },
];

const PROPS = [
  {
    id: "moons",
    label: "twin crescent moons in the sky",
    signal: {
      re: "moon|moons|crescent|twin",
      label: "Includes twin moons",
      tip: "Mention the twin moons in the background.",
    },
  },
  {
    id: "comet",
    label: "a streaking comet trail overhead",
    signal: {
      re: "comet|meteor|streak|trail",
      label: "Includes the comet trail",
      tip: "Mention the streaking comet trail overhead.",
    },
  },
  {
    id: "rings",
    label: "concentric signal rings radiating outward",
    signal: {
      re: "ring|rings|pulse|signal|wave|orbit",
      label: "Includes concentric signal rings",
      tip: "Include the radiating concentric signal rings.",
    },
  },
  {
    id: "mist",
    label: "layered atmospheric mist",
    signal: {
      re: "mist|fog|cloud|haze|atmosphere",
      label: "Includes atmospheric mist",
      tip: "Mention the layered atmospheric mist.",
    },
  },
];

function pick(arr, seed, offset) {
  const idx = Math.abs(Math.floor(seed * 9301 + offset * 49297)) % arr.length;
  return arr[idx];
}

export function generateDynamicVisualChallenge(seed = Date.now()) {
  const subject = pick(SUBJECTS, seed, 1);
  const setting = pick(SETTINGS, seed, 2);
  const lighting = pick(LIGHTINGS, seed, 3);
  const framing = pick(FRAMINGS, seed, 4);
  const style = pick(STYLES, seed, 5);
  const prop = pick(PROPS, seed, 6);

  const sceneSpec = {
    seed,
    subject: subject.id,
    setting: setting.id,
    lighting: lighting.id,
    framing: framing.id,
    style: style.id,
    prop: prop.id,
  };

  return {
    id: "dynamic-visual-forge",
    title: "Live visual prompt forge",
    domain: "prompt",
    worldId: "prompt-academy",
    difficulty: "Intermediate",
    minutes: 5,
    type: "image-prompt",
    dynamic: true,
    summary: "Procedurally generated target scene — write one prompt to recreate what appears on screen.",
    scenario:
      "Every round renders a brand-new target scene. Study the subject, environment, lighting, framing, extra atmospheric detail, and rendering style — then write one tight prompt that recreates it.",
    task: "Write a prompt describing this exact generated scene, including style and a no-text exclusion.",
    hints: [
      `Subject & setting: ${subject.label} in ${setting.label}.`,
      `Framing & mood: ${framing.label} with ${lighting.label}.`,
      `Style & detail: ${style.label}, including ${prop.label}, with no text or watermarks.`,
    ],
    requirements: [
      "Identifies the main subject and environment",
      "Specifies lighting palette and background detail",
      "Defines camera framing and rendering style",
      "Excludes text, letters, and watermarks",
    ],
    payload: {
      kind: "text",
      sceneSpec,
      placeholder: "Describe the subject, setting, framing, lighting, style, and exclusions…",
      minWords: 28,
      rubric: [
        {
          criterion: "relevance",
          weight: 30,
          need: 2,
          signals: [subject.signal, setting.signal],
        },
        {
          criterion: "clarity",
          weight: 25,
          need: 2,
          signals: [framing.signal, style.signal],
        },
        {
          criterion: "specificity",
          weight: 25,
          need: 2,
          signals: [lighting.signal, prop.signal],
        },
        {
          criterion: "safety",
          weight: 20,
          need: 1,
          signals: [
            {
              re: "no text|without text|no letters|no watermark|no logo|clean",
              label: "Excludes text & watermarks",
              tip: "Add 'no text, no letters, no watermark' so the generator keeps it clean.",
            },
          ],
        },
      ],
    },
  };
}

const BRIEF_CASES = [
  {
    topic: "an outage post-mortem for a payment API",
    audience: "enterprise customers",
    format: "a 3-section status email (what happened, impact, fix)",
    constraint: "under 180 words with zero technical blame",
    topicSignal: { re: "outage|incident|post-?mortem|payment|api", label: "Anchors on the outage topic", tip: "Name the payment API outage post-mortem." },
    audienceSignal: { re: "enterprise|customer|client", label: "Names the customer audience", tip: "Target enterprise customers." },
    formatSignal: { re: "email|3-?section|three section|bullet|heading", label: "Defines the email structure", tip: "Specify the 3-section email format." },
    constraintSignal: { re: "180|word|blame|apolog|calm|clear", label: "Sets length & tone constraints", tip: "Set the under-180-word limit and calm no-blame tone." },
  },
  {
    topic: "a 2-week onboarding checklist for a remote product designer",
    audience: "a newly hired junior designer",
    format: "a day-by-day markdown table",
    constraint: "max 5 tasks per week with concrete deliverables",
    topicSignal: { re: "onboard|checklist|2-?week|two.?week|designer", label: "Anchors on design onboarding", tip: "Specify the 2-week designer onboarding checklist." },
    audienceSignal: { re: "junior|new hire|designer|remote", label: "Defines the new hire audience", tip: "Specify the remote junior designer audience." },
    formatSignal: { re: "table|markdown|day-?by-?day|schedule", label: "Requests a markdown table", tip: "Ask for a markdown table format." },
    constraintSignal: { re: "5|five|deliverable|outcome|concise", label: "Constrains task count", tip: "Cap tasks per week and require concrete deliverables." },
  },
  {
    topic: "a competitive comparison of three cloud storage vendors",
    audience: "a non-technical CFO deciding budget today",
    format: "an executive brief with a pros/cons table",
    constraint: "under 250 words, citing only verified pricing tiers",
    topicSignal: { re: "cloud|storage|vendor|compar|competit", label: "Anchors on vendor comparison", tip: "Mention the 3 cloud storage vendors comparison." },
    audienceSignal: { re: "cfo|finance|executive|non-?technical|budget", label: "Targets the CFO reader", tip: "Tailor the tone to a non-technical CFO." },
    formatSignal: { re: "table|pros|cons|brief|bullet|summary", label: "Defines brief + table format", tip: "Ask for a pros/cons comparison table." },
    constraintSignal: { re: "250|word|pricing|tier|budget", label: "Sets word & pricing scope", tip: "Constrain to under 250 words focused on pricing tiers." },
  },
  {
    topic: "user-interview synthesis from 18 support transcripts",
    audience: "the mobile product squad before sprint planning",
    format: "top 5 pain points ranked by frequency with quotes",
    constraint: "do not invent quotes and flag small sample sizes",
    topicSignal: { re: "interview|transcript|support|synthes|pain point", label: "Anchors on transcript synthesis", tip: "Reference the 18 support transcripts." },
    audienceSignal: { re: "product|squad|sprint|team|pm", label: "Names the product squad", tip: "Address the mobile product squad." },
    formatSignal: { re: "top 5|ranked|rank|quote|frequency|bullet", label: "Defines ranked output shape", tip: "Ask for top 5 pain points ranked with quotes." },
    constraintSignal: { re: "18|sample|frequency|count|short|concise", label: "Includes sample & count scope", tip: "Include frequency counts and the 18-transcript scope." },
  },
];

export function generateDynamicBriefChallenge(seed = Date.now()) {
  const c = BRIEF_CASES[Math.abs(Math.floor(seed)) % BRIEF_CASES.length];

  return {
    id: "dynamic-brief-roulette",
    title: "Live brief roulette",
    domain: "prompt",
    worldId: "prompt-academy",
    difficulty: "Intermediate",
    minutes: 6,
    type: "prompt-write",
    dynamic: true,
    summary: "Rotating real-world prompting scenario — brief the AI cleanly in a single shot.",
    scenario: `Fresh assignment: You need an AI assistant to draft ${c.topic} for ${c.audience}. The output must be ${c.format}, ${c.constraint}.`,
    task: "Write one complete, self-contained prompt that gets a usable result on the first try.",
    hints: [
      `State the role, audience (${c.audience}), and topic (${c.topic}).`,
      `Lock the output shape (${c.format}) and limits (${c.constraint}).`,
      "Add a grounding rule forbidding fabricated stats, quotes, or facts.",
    ],
    requirements: [
      "Defines audience and core topic",
      "Specifies output format and structure",
      "Applies length or scope constraints",
      "Adds verification / no-fabrication guardrails",
    ],
    payload: {
      kind: "text",
      placeholder: "You are a…",
      minWords: 35,
      rubric: [
        {
          criterion: "relevance",
          weight: 25,
          need: 2,
          signals: [c.topicSignal, c.audienceSignal],
        },
        {
          criterion: "clarity",
          weight: 25,
          need: 2,
          signals: [
            c.formatSignal,
            { re: "you are|act as|role|tone|plain|concise", label: "Sets role or tone", tip: "Give the AI a clear role or tone." },
          ],
        },
        {
          criterion: "specificity",
          weight: 25,
          need: 1,
          signals: [c.constraintSignal],
        },
        {
          criterion: "verification",
          weight: 25,
          need: 1,
          signals: [
            {
              re: "don'?t (invent|make up|fabricat)|only use|cite|source|flag uncertain|if unsure",
              label: "Adds grounding guardrail",
              tip: "Forbid invented facts and ask it to flag uncertainty.",
            },
          ],
        },
      ],
    },
  };
}

export function materializeChallenge(challenge, seed) {
  if (!challenge || !challenge.dynamic) return challenge;
  if (challenge.id === "dynamic-visual-forge") return generateDynamicVisualChallenge(seed);
  if (challenge.id === "dynamic-brief-roulette") return generateDynamicBriefChallenge(seed);
  return challenge;
}
