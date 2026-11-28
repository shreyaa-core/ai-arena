# AI Arena — System Architecture

AI Arena is structured as a decoupled pure-JavaScript ES6+ workspace separating the Phaser 3 interactive game client, the Express 5 REST + Socket.IO server, and the 27-table PostgreSQL relational database.

## 1. Repository Layout

```text
ai-arena/
├── client/                  # React 19 + Phaser 3 + Vite 6 + Tailwind CSS v4
│   ├── public/              # Static mission visuals & icons
│   └── src/
│       ├── components/
│       │   ├── game/        # PhaserViewport, TitleScreen, GameHUD, Onboarding, NOVA, Settings
│       │   ├── modes/       # MissionModal, GameplayModesModal, ProgressionModals
│       │   └── ui/          # Button, Input, Textarea, Progress, Sonner
│       ├── context/         # GameContext (bridging localStorage + backend sync + i18n)
│       ├── data/            # Worlds, Challenges, Characters, Tutorials, Skill Tree, Shop
│       ├── engine/          # Scoring rubrics, AEI calculator, Hybrid evaluator, Simulator
│       ├── game/            # Phaser config, gameEvents bus, Title/WorldMap/Territory scenes
│       ├── i18n/            # English (en), Bengali (bn), Hindi (hi)
│       ├── services/        # apiClient.js (CSRF + cookies) & socketService.js
│       └── utils/           # storage.js (v1->v2 migration), sound.js (Web Audio), speech.js
├── server/                  # Node.js + Express 5 + Socket.IO + pg
│   ├── config/              # env.js, db.js (graceful unconfigured/error reporting)
│   ├── controllers/         # auth, game, ai, passport, admin
│   ├── middleware/          # JWT auth/RBAC, CSRF double-submit, rateLimit, helmet/CORS
│   ├── repositories/        # SQL data access (userRepository, gameRepository)
│   ├── routes/              # /api/{auth,game,ai,passport,admin}
│   ├── services/
│   │   ├── ai/              # groqAdapter, geminiAdapter, aiGateway, hybridEvaluator
│   │   ├── progression/     # progressionService (attempts, AEI, formal assessments, skills)
│   │   └── rewards/         # rewardService (FOR UPDATE coin shop & daily bonuses)
│   ├── sockets/             # socketHandler.js (Prompt Duel / Co-op rooms)
│   └── validators/          # Zod request validation schemas
├── database/                # schema.sql, migrations/, seeds/, pgadmin_full_setup.sql, migrate/seed JS
├── tests/                   # client/ (Vitest), server/ (node --test), e2e/ (Playwright)
└── docs/                    # Architecture, Game Design, API, Database, Deployment, Testing
```

## 2. Phaser 3 & React Bridge

- **Rendering & Movement:** `PhaserViewport.jsx` mounts a `Phaser.Game` (`TitleScene`, `WorldMapScene`, `TerritoryScene`) with Arcade physics (`WASD`, Arrow keys, click-to-move, `[E]` interaction prompts).
- **Event Bus:** Scenes communicate with React overlays via `gameEvents` (`world:select`, `station:activate`) rather than coupling Phaser internals to React state.
- **Keyboard Safety:** `TerritoryScene` calls `disableGlobalCapture()`, `clearCaptures()`, and registers movement keys with `enableCapture = false`. While any modal is open or an input/textarea/select is focused, scene keyboard movement pauses so typing never gets intercepted.

## 3. Core Separation Rules

1. **Deterministic Gameplay vs. External AI:** Core rubric scoring (`client/src/engine/scoring.js`) and Simulation Mode (`simulator.js`) run locally without network dependencies. When `GROQ_API_KEY` or `GEMINI_API_KEY` are absent, live AI endpoints return HTTP `503` (`status: "unavailable"`) rather than fabricating live AI responses.
2. **Gameplay Progression vs. Formal AEI Assessment:** Training/campaign missions grant XP and Coins (with repeat diminishing returns), while baseline/checkpoint assessments (`mode: "assessment"`) are stored separately so diagnostic runs never inflate XP.
3. **Human Players vs. Bot Opponents:** Multiplayer matches and leaderboards explicitly flag AI bots (`isBot: true` / `is_bot_opponent`) alongside verified human entries.
