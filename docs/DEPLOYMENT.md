# AI Arena — Local & Docker Deployment Guide

## 1. Local Development

### Prerequisites
- Node.js 20+ (tested on Node 24)
- Optional: PostgreSQL 16+ / 18 + pgAdmin 4
- Optional: Groq API key & Google Gemini API key

### Install & Run
```powershell
npm.cmd --prefix client install
npm.cmd --prefix server install
Copy-Item .env.example .env
npm.cmd run dev
```

*(In Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy restricts `.ps1` wrappers.)*

- **Client:** `http://localhost:5173/` (Phaser 3 + React + Vite proxy)
- **Server:** `http://localhost:5000` (`/api/*` and Socket.IO)

## 2. Environment Variables (`.env`)

Copy [`.env.example`](../.env.example) to `.env` (gitignored). Key settings:

- `PORT=5000`, `CLIENT_ORIGIN=http://localhost:5173`
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` (or `DATABASE_URL`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (required non-default values when `NODE_ENV=production`)
- `GROQ_API_KEY`, `GROQ_MODEL=llama-3.1-8b-instant`, `GROQ_WHISPER_MODEL=whisper-large-v3-turbo`
- `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.0-flash`
- `AI_DAILY_QUOTA_PER_USER=60`, `MULTIPLAYER_ENABLED=true`

## 3. Docker Compose + Nginx

Run the full production stack (`postgres:16-alpine` + Node Express server + Nginx static React/Phaser client) with:

```bash
docker compose up --build
```

- `nginx.conf` serves the built Vite SPA (`client/dist`) on port `80` and proxies `/api/` and WebSocket `/socket.io/` traffic cleanly to `server:5000`.
- `postgres` automatically runs `database/schema.sql` and `database/seeds/seed.sql` on first container initialization.
