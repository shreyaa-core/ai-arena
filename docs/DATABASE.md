# AI Arena — PostgreSQL Database Guide

AI Arena uses **PostgreSQL** (`pg`) and includes full compatibility with **pgAdmin 4**. When PostgreSQL is not configured, Guest Mode saves progress cleanly in browser `localStorage` (`ai-arena.state.v2`), automatically migrating legacy `ai-arena.state.v1` saves.

## 1. Schema Summary (27 Tables)

Defined in [`database/schema.sql`](../database/schema.sql) and bundled with seed data in [`database/pgadmin_full_setup.sql`](../database/pgadmin_full_setup.sql):

- **Identity & Auth:** `users`, `refresh_sessions`, `characters`, `profiles`, `player_settings`
- **Campaign & Progression:** `player_progress`, `worlds`, `missions`, `mission_attempts`, `tutorials`, `tutorial_progress`
- **Competency & Certification:** `assessments`, `assessment_details`, `skill_mastery`, `skill_tree`, `user_skill_unlocks`
- **Retention & Economy:** `achievements`, `player_achievements`, `quests`, `quest_progress`, `items`, `inventory`, `reward_transactions`
- **Social, Telemetry & Competition:** `leaderboards`, `ai_usage_logs`, `friends`, `multiplayer_matches`

## 2. pgAdmin 4 Setup (Recommended UI)

1. Open **pgAdmin 4** and connect to your PostgreSQL server.
2. Create a database named **`ai_arena_db`**.
3. Click **`ai_arena_db`** -> **Tools -> Query Tool**.
4. Open [`database/pgadmin_full_setup.sql`](../database/pgadmin_full_setup.sql) (clean UTF-8 without BOM) and execute (`F5`).
5. Refresh **`ai_arena_db -> Schemas -> public -> Tables`** to confirm all 27 tables exist.

## 3. CLI Migration & Seeding

1. Configure `PGHOST`, `PGPORT`, `PGDATABASE=ai_arena_db`, `PGUSER`, `PGPASSWORD` (or `DATABASE_URL`) in `.env`.
2. Run:
   ```powershell
   npm.cmd run migrate
   npm.cmd run seed
   ```

## 4. Transactional Integrity

- Cosmetic shop purchases (`server/services/rewards/rewardService.js`) lock `player_progress` with `SELECT ... FOR UPDATE`, verify `coins >= price_coins`, support replay-safe `idempotency_key` checks, and write immutable entries to `reward_transactions`.
- Attempt recording (`progressionService.js`) atomically logs `mission_attempts`, updates `skill_mastery`, recalculates weighted AEI, advances `player_progress`, writes `reward_transactions`, and refreshes `leaderboards`.
