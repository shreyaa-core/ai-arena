# AI Arena — Story-Driven AI Skill & Assessment Game

**AI Arena** is a pure JavaScript ES6+ interactive video game built with **React 19**, **Phaser 3**, **Node.js / Express 5**, **PostgreSQL (`pg`)**, **Socket.IO**, **Groq API**, and **Google Gemini API**.

Players explore six interconnected AI territories, learn practical prompting, fact verification, tool mastery, automation safety, governance, and creative synthesis, defeat territory Boss Cores, earn XP/Coins, and build a verifiable **AI Efficiency Index (AEI)** Skill Passport.

## Tech Stack
- **Frontend & Game Engine**: React 19, Phaser 3, React Router v7, Tailwind CSS v4, Recharts, Web Audio API, Browser Speech Synthesis.
- **Backend & Real-Time**: Node.js, Express 5, PostgreSQL (`pg`), JWT + `bcryptjs` + CSRF protection, Socket.IO, Zod.
- **External AI**: Groq API (Llama 3.3 + Whisper STT) & Google Gemini Vision API (optional; Simulation Mode works offline when unconfigured).
- **Testing & Deployment**: Vitest, Node Test Runner, Playwright, Docker Compose + Nginx.

## Quick Start (Local)

1. Install dependencies:
```bash
npm --prefix client install
npm --prefix server install
```
2. Optional: configure `.env` using `.env.example` and see [`DATABASE_SETUP.md`](DATABASE_SETUP.md) & [`API_SETUP.md`](API_SETUP.md).
3. Start client + server together:
```bash
npm run dev
```
- Game Client: `http://localhost:5173`
- Express Backend: `http://localhost:5000`

## Verification Commands
```bash
npm test
npm run build
```
