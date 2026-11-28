# AI Arena — API & Socket.IO Reference

Base HTTP URL (local): `http://localhost:5000` (proxied at `/api` and `/socket.io` by Vite).

## 1. Security & Session Model

- **Authentication:** `ai_arena_access` (15m JWT) + `ai_arena_refresh` (HTTP-only rotating refresh session cookie) or `Authorization: Bearer <token>`.
- **CSRF Protection:** State-changing cookie-authenticated requests require `X-CSRF-Token` matching the `ai_arena_csrf` cookie (automatically handled by `client/src/services/apiClient.js`).
- **Validation & Rate Limiting:** All request bodies are validated with Zod (`server/validators/schemas.js`), protected by Helmet, CORS, general API limits, stricter auth limits, and per-actor AI daily quotas.

## 2. Health

- `GET /api/health` — Returns service health, PostgreSQL status (`connected` | `unconfigured` | `error`), AI readiness (`groqConfigured`, `geminiConfigured`, `whisperConfigured`), and `multiplayer` flag.

## 3. Auth (`/api/auth`)

| Method & Path | Auth | Purpose |
| :--- | :--- | :--- |
| `POST /api/auth/register` | Public | Create user, profile, initial progress, settings, starter suit |
| `POST /api/auth/login` | Public | Verify credentials and issue access + refresh cookies |
| `POST /api/auth/refresh` | Refresh Cookie | Rotate refresh session and issue new access JWT |
| `POST /api/auth/logout` | Optional | Revoke refresh session and clear auth cookies |
| `GET /api/auth/me` | Required | Fetch full user profile, progression, and accessibility settings |
| `PATCH /api/auth/me` | Required | Update profile customization, language, and settings |
| `POST /api/auth/migrate-guest` | Required | Import local `ai-arena.state.v2` guest progress safely |

## 4. Gameplay & Progression (`/api/game`)

| Method & Path | Auth | Purpose |
| :--- | :--- | :--- |
| `GET /api/game/state` | Required | Snapshot of attempts, skill mastery, unlocks, achievements, quests, inventory, assessments |
| `POST /api/game/attempts` | Required | Record mission attempt, update domain mastery, recalculate AEI & leaderboard |
| `POST /api/game/assessments` | Required | Record formal assessment & generate unique `AIA-*` certificate code |
| `GET /api/game/shop` | Public | List cosmetic shop items |
| `POST /api/game/shop/buy` | Required | Transaction-safe (`FOR UPDATE`) cosmetic purchase with `idempotencyKey` |
| `POST /api/game/daily-bonus` | Required | Claim once-per-UTC-day coin bonus |
| `POST /api/game/skills/unlock` | Required | Unlock skill tree node checking prerequisite unlocks |
| `GET /api/game/leaderboard` | Public | Top ranked leaderboard rows |

## 5. AI Gateway (`/api/ai`)

All endpoints return HTTP `503` with `{ status: "unavailable", configured: false }` when required API keys are absent.

| Method & Path | Provider | Purpose |
| :--- | :--- | :--- |
| `GET /api/ai/status` | — | Capability & daily quota summary |
| `POST /api/ai/chat` | Groq | NOVA guide coaching (with prompt-injection sanitization & `en`/`bn`/`hi` support) |
| `POST /api/ai/evaluate` | Groq | Qualitative prompt evaluation JSON (`aiScore`, `strengths`, `improvements`, `summary`) |
| `POST /api/ai/playground` | Groq | Live Training Lab execution with configurable `temperature` & `maxTokens` |
| `POST /api/ai/vision` | Gemini | Multimodal visual prompt inspection |
| `POST /api/ai/stt` | Groq Whisper | Speech-to-text audio transcription |

## 6. Skill Passport & Admin

- `GET /api/passport/me` (Required) — Authenticated explorer's Skill Passport report.
- `GET /api/passport/verify/:code` (Public) — Public credential lookup by certificate code.
- `GET /api/admin/analytics` & `GET /api/admin/missions` (Required, Role `admin` or `educator`) — Platform analytics & mission catalog.

## 7. Socket.IO Multiplayer Events

- Client emits: `room:create`, `room:join`, `room:submit`
- Server broadcasts: `room:update` (`waiting` | `active` | `finished` | `abandoned`)
