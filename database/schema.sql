-- AI Arena PostgreSQL Schema (pgAdmin 4 compatible)
-- Database: ai_arena_db

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'educator', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Refresh Sessions (HTTP-only refresh token rotation)
CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user ON refresh_sessions(user_id);

-- 3. Player Characters & Cosmetics Reference
CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  archetype VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  accent_color VARCHAR(16) NOT NULL,
  starter_unlocked BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  alias VARCHAR(80) NOT NULL,
  character_id VARCHAR(64) REFERENCES characters(id) ON DELETE SET NULL DEFAULT 'nova-cadet',
  avatar_color VARCHAR(16) NOT NULL DEFAULT '#14B8A6',
  visor_style VARCHAR(32) NOT NULL DEFAULT 'cyan-visor',
  language VARCHAR(12) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'bn', 'hi')),
  experience_level VARCHAR(32) NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'occasional', 'regular', 'advanced')),
  learning_goal VARCHAR(120) NOT NULL DEFAULT 'practical-mastery',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Player Progress (Gameplay XP/Coins strictly separated from AEI competency)
CREATE TABLE IF NOT EXISTS player_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  rank_level INTEGER NOT NULL DEFAULT 1 CHECK (rank_level >= 1),
  rank_title VARCHAR(64) NOT NULL DEFAULT 'Prompt Novice',
  coins INTEGER NOT NULL DEFAULT 100 CHECK (coins >= 0),
  aei_score INTEGER NOT NULL DEFAULT 0 CHECK (aei_score BETWEEN 0 AND 100),
  aei_band VARCHAR(64) NOT NULL DEFAULT 'AI Beginner',
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  daily_login_streak INTEGER NOT NULL DEFAULT 1 CHECK (daily_login_streak >= 0),
  last_daily_bonus_at TIMESTAMPTZ,
  unlocked_worlds JSONB NOT NULL DEFAULT '["prompt-academy"]'::jsonb,
  restored_worlds JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Worlds
CREATE TABLE IF NOT EXISTS worlds (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  domain VARCHAR(32) NOT NULL,
  theme_color VARCHAR(16) NOT NULL,
  unlock_order INTEGER NOT NULL,
  required_xp INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  boss_mission_id VARCHAR(64)
);

-- 7. Missions
CREATE TABLE IF NOT EXISTS missions (
  id VARCHAR(64) PRIMARY KEY,
  world_id VARCHAR(64) NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  title VARCHAR(140) NOT NULL,
  domain VARCHAR(32) NOT NULL,
  difficulty VARCHAR(24) NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  mission_type VARCHAR(40) NOT NULL,
  mode VARCHAR(24) NOT NULL DEFAULT 'campaign' CHECK (mode IN ('training', 'campaign', 'assessment', 'boss')),
  is_boss BOOLEAN NOT NULL DEFAULT FALSE,
  minutes INTEGER NOT NULL DEFAULT 6,
  summary TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_missions_world ON missions(world_id);

-- 8. Mission Attempts
CREATE TABLE IF NOT EXISTS mission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id VARCHAR(64) NOT NULL,
  mode VARCHAR(24) NOT NULL DEFAULT 'campaign' CHECK (mode IN ('training', 'campaign', 'blitz', 'duel', 'boss')),
  rubric_score INTEGER NOT NULL CHECK (rubric_score BETWEEN 0 AND 100),
  efficiency INTEGER NOT NULL CHECK (efficiency BETWEEN 0 AND 100),
  grade CHAR(1) NOT NULL CHECK (grade IN ('S', 'A', 'B', 'C', 'D')),
  xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  coins_earned INTEGER NOT NULL DEFAULT 0 CHECK (coins_earned >= 0),
  seconds_spent INTEGER NOT NULL DEFAULT 0 CHECK (seconds_spent >= 0),
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  turns_used INTEGER NOT NULL DEFAULT 0 CHECK (turns_used >= 0),
  evaluator_type VARCHAR(32) NOT NULL DEFAULT 'deterministic',
  response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_mission ON mission_attempts(user_id, mission_id);

-- 9. Assessments (Strictly separated from gameplay progression)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type VARCHAR(32) NOT NULL CHECK (assessment_type IN ('onboarding', 'checkpoint', 'final')),
  overall_aei INTEGER NOT NULL CHECK (overall_aei BETWEEN 0 AND 100),
  proficiency_band VARCHAR(64) NOT NULL,
  certificate_code VARCHAR(40) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);

-- 10. Assessment Details
CREATE TABLE IF NOT EXISTS assessment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  domain VARCHAR(32) NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_assessment_details_parent ON assessment_details(assessment_id);

-- 11. Skill Mastery (6 competency domains)
CREATE TABLE IF NOT EXISTS skill_mastery (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(32) NOT NULL,
  mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, domain)
);

-- 12. Skill Tree Unlocks
CREATE TABLE IF NOT EXISTS skill_tree (
  id VARCHAR(64) PRIMARY KEY,
  domain VARCHAR(32) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  cost_points INTEGER NOT NULL DEFAULT 1,
  prerequisite_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS user_skill_unlocks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id VARCHAR(64) NOT NULL REFERENCES skill_tree(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- 13. Tutorials
CREATE TABLE IF NOT EXISTS tutorials (
  id VARCHAR(64) PRIMARY KEY,
  world_id VARCHAR(64) NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 14. Tutorial Progress
CREATE TABLE IF NOT EXISTS tutorial_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id VARCHAR(64) NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, tutorial_id)
);

-- 15. Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'mastery',
  reward_coins INTEGER NOT NULL DEFAULT 25
);

-- 16. Player Achievements
CREATE TABLE IF NOT EXISTS player_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(64) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- 17. Quests (Daily / Weekly / Story)
CREATE TABLE IF NOT EXISTS quests (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  quest_type VARCHAR(24) NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'story')),
  target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count > 0),
  reward_xp INTEGER NOT NULL DEFAULT 50,
  reward_coins INTEGER NOT NULL DEFAULT 30,
  criteria_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 18. Quest Progress
CREATE TABLE IF NOT EXISTS quest_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id VARCHAR(64) NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, quest_id)
);

-- 19. Cosmetic & Utility Shop Items (Zero pay-to-win)
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slot VARCHAR(32) NOT NULL CHECK (slot IN ('suit', 'visor', 'companion', 'badge_frame', 'hint_token')),
  price_coins INTEGER NOT NULL CHECK (price_coins >= 0),
  description TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 20. Inventory
CREATE TABLE IF NOT EXISTS inventory (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id VARCHAR(64) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- 21. Reward Transactions Ledger (Server-authoritative auditing)
CREATE TABLE IF NOT EXISTS reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(40) NOT NULL,
  source_ref VARCHAR(120) NOT NULL,
  xp_delta INTEGER NOT NULL DEFAULT 0,
  coin_delta INTEGER NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reward_tx_user ON reward_transactions(user_id);

-- 22. Leaderboards Snapshot
CREATE TABLE IF NOT EXISTS leaderboards (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  alias VARCHAR(80) NOT NULL,
  rank_title VARCHAR(64) NOT NULL,
  average_efficiency INTEGER NOT NULL DEFAULT 0,
  aei_score INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  missions_cleared INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaderboards_sort ON leaderboards(average_efficiency DESC, total_xp DESC);

-- 23. AI Usage Logs (Quota, Cost, Audit)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider VARCHAR(32) NOT NULL CHECK (provider IN ('groq', 'gemini', 'whisper', 'deterministic')),
  endpoint VARCHAR(64) NOT NULL,
  model_name VARCHAR(80),
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_day ON ai_usage_logs(user_id, created_at);

-- 24. Player Settings & Accessibility
CREATE TABLE IF NOT EXISTS player_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sfx_volume NUMERIC(3,2) NOT NULL DEFAULT 0.80 CHECK (sfx_volume BETWEEN 0 AND 1),
  music_volume NUMERIC(3,2) NOT NULL DEFAULT 0.35 CHECK (music_volume BETWEEN 0 AND 1),
  music_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voice_narration BOOLEAN NOT NULL DEFAULT FALSE,
  high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
  large_text BOOLEAN NOT NULL DEFAULT FALSE,
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Friends / Party
CREATE TABLE IF NOT EXISTS friends (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

-- 26. Multiplayer Matches (Human PvP / Co-op / AI Bot Duel distinctly labeled)
CREATE TABLE IF NOT EXISTS multiplayer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL,
  mode VARCHAR(24) NOT NULL CHECK (mode IN ('duel', 'coop', 'bot-duel')),
  challenge_id VARCHAR(64) NOT NULL,
  host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_bot_opponent BOOLEAN NOT NULL DEFAULT FALSE,
  host_score INTEGER DEFAULT 0,
  guest_score INTEGER DEFAULT 0,
  winner_side VARCHAR(16),
  status VARCHAR(24) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room ON multiplayer_matches(room_code);
