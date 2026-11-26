# AI Provider Setup Guide (Groq + Google Gemini + Groq Whisper)

AI Arena separates deterministic gameplay scoring from external generative AI providers. When API keys are absent, AI Arena runs transparently in **Simulation Mode** and returns honest `503 unavailable` statuses from live AI endpoints rather than fabricating fake live AI answers.

## 1. Groq API (NOVA Coach, Live Playground, Hybrid Prompt Evaluation, Whisper Voice)

1. Create an API key in the Groq Console (`console.groq.com`).
2. Set in `.env`:
   - `GROQ_API_KEY=your_groq_api_key`
   - `GROQ_MODEL=llama-3.3-70b-versatile`
   - `GROQ_WHISPER_MODEL=whisper-large-v3-turbo`

## 2. Google Gemini API (Multimodal Visual Analysis)

1. Create an API key in Google AI Studio (`aistudio.google.com`).
2. Set in `.env`:
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `GEMINI_MODEL=gemini-2.0-flash`

## 3. Security & Quota Controls

- API keys stay exclusively in server environment variables and are never sent to the browser.
- Every actor has a configurable daily quota (`AI_DAILY_QUOTA_PER_USER=60`) plus prompt-injection sanitization in `server/services/ai/aiGateway.js`.
- All requests are logged in `ai_usage_logs` when PostgreSQL is connected.
