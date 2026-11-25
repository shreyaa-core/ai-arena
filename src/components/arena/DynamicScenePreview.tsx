import type { DynamicSceneSpec } from "@/lib/arena/types";

const PALETTES: Record<
  DynamicSceneSpec["lighting"],
  { skyTop: string; skyBot: string; primary: string; secondary: string; glow: string }
> = {
  "cyan-amber": {
    skyTop: "#030712",
    skyBot: "#0f172a",
    primary: "#22D3EE",
    secondary: "#F59E0B",
    glow: "rgba(34, 211, 238, 0.35)",
  },
  "magenta-sunset": {
    skyTop: "#090418",
    skyBot: "#3b0764",
    primary: "#FF006E",
    secondary: "#4F46E5",
    glow: "rgba(255, 0, 110, 0.35)",
  },
  "violet-teal": {
    skyTop: "#060516",
    skyBot: "#1e1b4b",
    primary: "#A855F7",
    secondary: "#2DD4BF",
    glow: "rgba(168, 85, 247, 0.35)",
  },
  "solar-gold": {
    skyTop: "#0b1120",
    skyBot: "#451a03",
    primary: "#FBBF24",
    secondary: "#38BDF8",
    glow: "rgba(251, 191, 36, 0.32)",
  },
};

function starPositions(seed: number) {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  for (let i = 0; i < 28; i++) {
    const x = Math.abs((seed * (i + 3) * 37) % 380) + 10;
    const y = Math.abs((seed * (i + 7) * 53) % 175) + 8;
    const r = ((seed + i) % 3) * 0.6 + 0.8;
    const o = 0.35 + ((i * 17) % 60) / 100;
    out.push({ x, y, r, o });
  }
  return out;
}

export function DynamicScenePreview({ spec }: { spec: DynamicSceneSpec }) {
  const p = PALETTES[spec.lighting];
  const stars = starPositions(spec.seed);
  const gradId = `sky-${spec.seed}`;
  const glowId = `glow-${spec.seed}`;

  const subjectScale =
    spec.framing === "closeup"
      ? "translate(200 140) scale(1.22)"
      : spec.framing === "wide"
        ? "translate(200 148) scale(0.84)"
        : spec.framing === "low-angle"
          ? "translate(200 130) scale(1.08) skewX(-4)"
          : "translate(200 142) rotate(-6) scale(1)";

  const strokeMode = spec.style === "blueprint";

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-[#030712]">
      <svg
        viewBox="0 0 400 280"
        role="img"
        aria-label={`Generated scene: ${spec.subject} in ${spec.setting}, ${spec.lighting}, ${spec.framing}, ${spec.style}`}
        className="block h-auto w-full"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeMode ? "#061530" : p.skyTop} />
            <stop offset="100%" stopColor={strokeMode ? "#0c2d5c" : p.skyBot} />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.primary} stopOpacity="0.45" />
            <stop offset="100%" stopColor={p.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Backdrop */}
        <rect width="400" height="280" fill={`url(#${gradId})`} />

        {/* Blueprint grid overlay when blueprint style */}
        {strokeMode && (
          <g stroke="#22D3EE" strokeOpacity="0.18" strokeWidth="0.75">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="280" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 25} x2="400" y2={i * 25} />
            ))}
          </g>
        )}

        {/* Stars */}
        {stars.map((s, idx) => (
          <circle key={idx} cx={s.x} cy={s.y} r={s.r} fill="#F8FAFC" opacity={s.o} />
        ))}

        {/* Prop layer */}
        {spec.prop === "moons" && (
          <g>
            <circle cx="84" cy="64" r="22" fill={p.secondary} opacity="0.85" />
            <circle cx="92" cy="59" r="20" fill={strokeMode ? "#061530" : p.skyTop} />
            <circle cx="328" cy="48" r="11" fill={p.primary} opacity="0.75" />
            <circle cx="332" cy="46" r="10" fill={strokeMode ? "#061530" : p.skyTop} />
          </g>
        )}
        {spec.prop === "comet" && (
          <g>
            <line x1="65" y1="36" x2="178" y2="92" stroke={p.primary} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <line x1="88" y1="34" x2="174" y2="78" stroke={p.secondary} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            <circle cx="178" cy="92" r="4" fill="#FFFFFF" />
          </g>
        )}
        {spec.prop === "rings" && (
          <g fill="none" stroke={p.primary} strokeOpacity="0.35">
            <circle cx="200" cy="140" r="68" strokeDasharray="5 4" />
            <circle cx="200" cy="140" r="96" strokeDasharray="3 6" />
            <circle cx="200" cy="140" r="126" strokeOpacity="0.18" />
          </g>
        )}
        {spec.prop === "mist" && (
          <g fill={p.primary} opacity="0.14">
            <ellipse cx="110" cy="215" rx="120" ry="22" />
            <ellipse cx="290" cy="226" rx="135" ry="24" />
          </g>
        )}

        {/* Ambient central halo */}
        <circle cx="200" cy="142" r="115" fill={`url(#${glowId})`} />

        {/* Setting layer */}
        {spec.setting === "orbit" && (
          <g>
            <path d="M -20 260 Q 200 185 420 260 L 420 290 L -20 290 Z" fill="#070d1f" stroke={p.primary} strokeWidth="3" />
          </g>
        )}
        {spec.setting === "crater" && (
          <g>
            <path d="M 0 218 L 75 186 L 145 208 L 235 196 L 325 182 L 400 215 L 400 280 L 0 280 Z" fill="#111827" stroke={p.primary} strokeWidth="1.5" />
            <path d="M 0 245 L 110 222 L 260 238 L 400 226 L 400 280 L 0 280 Z" fill="#030712" />
          </g>
        )}
        {spec.setting === "coast" && (
          <g>
            <path d="M 0 220 L 145 210 L 185 255 L 0 255 Z" fill="#111827" stroke={p.primary} strokeWidth="1.4" />
            <rect x="0" y="238" width="400" height="42" fill="#09152b" />
            <line x1="20" y1="248" x2="120" y2="248" stroke={p.primary} strokeOpacity="0.45" strokeWidth="1.5" />
            <line x1="210" y1="258" x2="355" y2="258" stroke={p.primary} strokeOpacity="0.45" strokeWidth="1.5" />
          </g>
        )}
        {spec.setting === "cavern" && (
          <g fill="#111827" stroke={p.primary} strokeWidth="1.2">
            <polygon points="15,0 55,0 32,68" />
            <polygon points="340,0 385,0 362,74" />
            <polygon points="0,280 0,210 95,245 140,280" />
            <polygon points="400,280 400,205 295,248 250,280" />
            <rect x="0" y="252" width="400" height="28" fill="#081427" />
          </g>
        )}
        {spec.setting === "dunes" && (
          <g>
            <path d="M 0 232 Q 110 185 220 226 T 400 218 L 400 280 L 0 280 Z" fill="#1e1b2e" stroke={p.secondary} strokeWidth="1.4" />
            <path d="M 0 256 Q 160 224 400 250 L 400 280 L 0 280 Z" fill="#0f1020" />
          </g>
        )}

        {/* Subject layer */}
        <g transform={subjectScale} stroke={p.primary} strokeWidth="1.8" strokeLinejoin="round">
          {spec.subject === "station" && (
            <g>
              {/* Solar wings */}
              <rect x="-112" y="-26" width="66" height="44" rx="2" fill={strokeMode ? "none" : "#1e293b"} />
              <line x1="-112" y1="-4" x2="-46" y2="-4" />
              <line x1="-79" y1="-26" x2="-79" y2="18" />
              <rect x="46" y="-26" width="66" height="44" rx="2" fill={strokeMode ? "none" : "#1e293b"} />
              <line x1="46" y1="-4" x2="112" y2="-4" />
              <line x1="79" y1="-26" x2="79" y2="18" />
              {/* Truss */}
              <line x1="-46" y1="-4" x2="46" y2="-4" strokeWidth="3" />
              {/* Core hub */}
              <rect x="-26" y="-24" width="52" height="48" rx="8" fill={strokeMode ? "none" : "#1e293b"} />
              <circle cx="0" cy="-24" r="18" fill={strokeMode ? "none" : "#334155"} />
              <rect x="-16" y="-8" width="10" height="8" rx="1" fill={p.secondary} stroke="none" />
              <rect x="6" y="-8" width="10" height="8" rx="1" fill={p.secondary} stroke="none" />
              <line x1="0" y1="-42" x2="0" y2="-58" />
              <circle cx="0" cy="-60" r="3" fill={p.secondary} />
            </g>
          )}

          {spec.subject === "rover" && (
            <g>
              <rect x="-56" y="-18" width="112" height="36" rx="6" fill={strokeMode ? "none" : "#1e293b"} />
              <rect x="-32" y="-38" width="44" height="20" rx="4" fill={strokeMode ? "none" : "#334155"} />
              <line x1="24" y1="-18" x2="40" y2="-48" strokeWidth="2.5" />
              <rect x="30" y="-58" width="26" height="14" rx="3" fill={strokeMode ? "none" : "#1e293b"} />
              <circle cx="48" cy="-51" r="4" fill={p.secondary} stroke="none" />
              {[-42, 0, 42].map((wx) => (
                <g key={wx}>
                  <circle cx={wx} cy="28" r="14" fill={strokeMode ? "none" : "#0f172a"} strokeWidth="2.5" />
                  <circle cx={wx} cy="28" r="5" fill={p.secondary} stroke="none" />
                </g>
              ))}
            </g>
          )}

          {spec.subject === "lighthouse" && (
            <g>
              <polygon points="-24,52 24,52 14,-44 -14,-44" fill={strokeMode ? "none" : "#1e293b"} />
              <rect x="-18" y="-62" width="36" height="18" rx="3" fill={strokeMode ? "none" : "#334155"} />
              <polygon points="-20,-62 20,-62 0,-80" fill={strokeMode ? "none" : "#4F46E5"} />
              <rect x="-8" y="-58" width="16" height="10" fill={p.secondary} stroke="none" />
              <polygon points="18,-53 145,-82 145,-24" fill={p.secondary} opacity="0.28" stroke="none" />
              <rect x="-6" y="18" width="12" height="16" rx="2" fill={p.secondary} stroke="none" />
            </g>
          )}

          {spec.subject === "observatory" && (
            <g>
              <rect x="-52" y="-6" width="104" height="52" rx="4" fill={strokeMode ? "none" : "#1e293b"} />
              <path d="M -46 -6 A 46 46 0 0 1 46 -6 Z" fill={strokeMode ? "none" : "#334155"} />
              <line x1="16" y1="-34" x2="62" y2="-66" strokeWidth="7" strokeLinecap="round" />
              <circle cx="62" cy="-66" r="5" fill={p.secondary} stroke="none" />
              {[-28, 0, 28].map((wx) => (
                <rect key={wx} x={wx - 6} y="12" width="12" height="16" rx="2" fill={p.secondary} stroke="none" />
              ))}
            </g>
          )}

          {spec.subject === "drone" && (
            <g>
              <line x1="-68" y1="-16" x2="68" y2="-16" strokeWidth="3" />
              <ellipse cx="-68" cy="-22" rx="24" ry="4" fill={p.primary} opacity="0.55" />
              <ellipse cx="68" cy="-22" rx="24" ry="4" fill={p.primary} opacity="0.55" />
              <polygon points="-34,-16 34,-16 22,16 -22,16" fill={strokeMode ? "none" : "#1e293b"} />
              <circle cx="0" cy="4" r="9" fill={p.secondary} stroke="none" />
              <polygon points="-10,16 10,16 34,68 -34,68" fill={p.primary} opacity="0.2" stroke="none" />
            </g>
          )}

          {spec.subject === "monolith" && (
            <g>
              <polygon points="0,-78 30,-22 22,52 0,68 -22,52 -30,-22" fill={strokeMode ? "none" : "#1e293b"} />
              <polygon points="0,-78 30,-22 0,68" fill={p.primary} opacity="0.24" stroke="none" />
              <line x1="0" y1="-78" x2="0" y2="68" />
              <circle cx="0" cy="-14" r="9" fill={p.secondary} stroke="none" />
            </g>
          )}
        </g>

        {/* Subtle style badge inside bottom-right corner */}
        {spec.style === "retro-poster" && (
          <rect x="10" y="10" width="380" height="260" fill="none" stroke={p.secondary} strokeOpacity="0.45" strokeWidth="1.5" />
        )}
      </svg>
    </div>
  );
}
