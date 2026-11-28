# AI Arena — Testing & Verification Guide

## 1. Test Suites

Run both client and server test suites together from the root directory:

```powershell
npm.cmd run test
```

Or run individually:
```powershell
npm.cmd run test:client
npm.cmd run test:server
```

### Client Unit & UI Tests (`tests/client/`)
Powered by **Vitest** + **Testing Library (`jsdom`)**:
- `tests/client/game-mechanics.test.js`: Speed/hint/turn efficiency scoring, junk quality gating, Simulation Mode honesty tags, AEI calculation, badge unlocks, assessment XP separation, and procedural dynamic challenges.
- `tests/client/game-ui.test.jsx`: Full `<App />` Title Screen rendering, `DynamicScenePreview` accessibility, `ai-arena.state.v1` -> `v2` migration, end-to-end **Quick Challenge -> Submit Solution** grading flow, and HUD **Leave** navigation. *(Uses a lightweight `PhaserViewport` mock for `jsdom`.)*

### Server Tests (`tests/server/`)
Powered by Node's built-in test runner (`node --test`):
- `tests/server/auth-and-health.test.js`: `/api/health` diagnostics, `401` auth guard, `403` admin RBAC check, and honest `503 unavailable` response when AI keys are absent (temporarily isolating `env.groqApiKey` in test).
- `tests/server/rewards-tx.test.js`: Mock transactional DB tests verifying `FOR UPDATE` coin deduction, insufficient-coin rejection, idempotency replay safety, and once-per-day bonus guard.
- `tests/server/ai-gateway.test.js`: Prompt-injection sanitization, per-actor quota tracking, and `AI_UNCONFIGURED` handling.

### End-to-End Browser Spec (`tests/e2e/`)
- `tests/e2e/game-flow.spec.js`: Playwright flow covering Title Screen launch, guest onboarding, HUD metrics, and World Map entry against a live running dev server.

## 2. Production Build Check

```powershell
npm.cmd run build
```

Confirms all React/JSX, Phaser 3 scenes, Tailwind v4 CSS, and `Chakra Petch` / `Share Tech Mono` fonts compile cleanly into `client/dist/`.
