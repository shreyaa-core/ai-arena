# Database Setup Guide (PostgreSQL + pgAdmin 4)

AI Arena uses PostgreSQL (`pg`) with a 26-table relational schema. Guest gameplay saves automatically in `localStorage` even when PostgreSQL is offline or unconfigured, while signed-in accounts persist full progression, Skill Passports, inventories, quests, and leaderboards to PostgreSQL.

## Option A — Setup via pgAdmin 4 (Recommended UI)

1. Open **pgAdmin 4** and connect to your local PostgreSQL server.
2. Right-click **Databases** -> **Create** -> **Database...** and name it `ai_arena_db`.
3. Open **Query Tool** on `ai_arena_db`.
4. Open and execute [`database/schema.sql`](database/schema.sql) to create all tables, constraints, and indexes.
5. Open and execute [`database/seeds/seed.sql`](database/seeds/seed.sql) to load characters, the 6 territories + Grandmaster Arena, tutorials, skill tree nodes, achievements, daily quests, and cosmetic shop items.

## Option B — Automated CLI Migration & Seeding

1. Copy `.env.example` to `.env` and fill `DATABASE_URL` (or `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`).
2. Run migrations and seeds from the project root (`ai-arena/`):

```bash
npm run migrate
npm run seed
```

## Option C — Docker Compose

Run PostgreSQL + Express backend + Nginx client in one command:

```bash
docker compose up --build
```
