# AI Arena — Game Design & Progression

## 1. Storyline & Six Playable Worlds

Six interconnected AI-powered territories have become unstable due to vague instructions, hallucinations, context-window misuse, missing human checkpoints, privacy leaks, and generic output clichés. Players customize an explorer character and work alongside **NOVA** (companion drone and tactical AI coach) to restore each sector and unlock **Grandmaster Arena**.

| Order | Territory | Skill Domain | Required XP | Boss Mission |
| :---: | :--- | :--- | :---: | :--- |
| 1 | Prompt Academy | `prompt` | `0` | Boss: Restore the Prompt Reactor |
| 2 | Verification City | `evaluation` | `100` | Boss: Unmask the Civic Bot Mirage |
| 3 | Tool Forge | `tools` | `250` | BOSS: 10,000-Row CSV Pipeline |
| 4 | Automation Factory | `workflow` | `420` | Boss: Stabilise the Workflow Grid |
| 5 | Ethics Citadel | `responsible` | `600` | Boss: Defend the Ethics Citadel |
| 6 | Creative Studio | `creative` | `800` | Boss: Awaken the Creative Core |
| 7 | Grandmaster Arena | `all` | `1100` | Final Seal: Ethics & Synthesis |

Each sector contains an animated NPC mentor, tutorial codex (`?`), mission terminals (`◆`), collectible shard (`Golden Prompt Shard`, etc.), side-quest mode portal (`◈`), and a Boss Core (`⚔`). Clearing a territory's boss (`score >= 60`) restores the sector with golden environmental effects.

## 2. Game Modes

- **Campaign & Exploration:** Walk/click across Phaser territories, talk to NPCs, collect shards, and restore Boss Cores.
- **Training Grounds / AI Lab:** Live Groq or Simulation prompt testing playground with system role, temperature, and output inspection.
- **Dynamic Missions:** Procedural SVG scene reverse-engineering (`Live visual prompt forge`) and rotating prompting scenarios (`Live brief roulette`) with on-demand re-roll.
- **Efficiency Blitz:** 90-second speed gauntlet across core AI decision scenarios.
- **Escape Room:** Multi-lock security puzzle defending against prompt injection and secret exposure.
- **Prompt Duel Arena:** Real-time Socket.IO private rooms (`Create` / `Join` by room code) or practice duels against labeled `ArenaBot-Alpha`.

## 3. Scoring, Grading & AI Efficiency Index (AEI)

- **Efficiency Formula (`computeEfficiency`):** Blends Rubric Quality (`65%`), Speed vs. Par (`15%`), Simulator Turn Economy (`10%`), and Hint Economy (`10%`), gated so low-quality `<40` responses cannot earn high efficiency.
- **Grades:** `S` (`90+`), `A` (`80–89`), `B` (`65–79`), `C` (`50–64`), `D` (`<50`).
- **Anti-Farming Decay:** Repeating the same mission scales XP/Coin rewards (`100%` -> `50%` -> `25%` -> `10%`).
- **Weighted AEI (`0–100`):**
  - Prompt Engineering (`25%`)
  - Critical Evaluation (`20%`)
  - Workflow Design (`20%`)
  - Responsible AI (`15%`)
  - Tool Selection (`10%`)
  - Creative Synthesis (`10%`)
- **Proficiency Bands:** `0–39` AI Beginner, `40–59` AI Practitioner, `60–74` AI Problem Solver, `75–89` AI Strategist, `90–100` AI Grandmaster.
- **Economy:** Arena Coins unlock strictly cosmetic suits, visors, companion shells, and Skill Passport frames—zero pay-to-win mechanics.
