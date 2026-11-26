import crypto from "node:crypto";
import { query, withTransaction } from "../config/db.js";

function sha256(val) {
  return crypto.createHash("sha256").update(val).digest("hex");
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT id, email, password_hash, role, is_active, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function findUserById(userId) {
  const { rows } = await query(
    `SELECT u.id, u.email, u.role, u.is_active, u.created_at,
            p.alias, p.character_id, p.avatar_color, p.visor_style, p.language, p.experience_level, p.learning_goal, p.onboarding_completed,
            pp.xp, pp.rank_level, pp.rank_title, pp.coins, pp.aei_score, pp.aei_band,
            pp.current_streak, pp.best_streak, pp.daily_login_streak, pp.unlocked_worlds, pp.restored_worlds,
            ps.sfx_volume, ps.music_volume, ps.music_enabled, ps.voice_narration, ps.high_contrast, ps.large_text, ps.reduced_motion
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN player_progress pp ON pp.user_id = u.id
       LEFT JOIN player_settings ps ON ps.user_id = u.id
      WHERE u.id = $1
      LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function createUserWithProfile({
  email,
  passwordHash,
  role = "player",
  alias,
  characterId = "nova-cadet",
  language = "en",
  experienceLevel = "beginner",
  learningGoal = "practical-mastery",
}) {
  return withTransaction(async (client) => {
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
      [email.toLowerCase(), passwordHash, role],
    );
    const user = userRes.rows[0];
    const cleanAlias = alias || email.split("@")[0].slice(0, 24);

    await client.query(
      `INSERT INTO profiles (user_id, alias, character_id, language, experience_level, learning_goal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, cleanAlias, characterId, language, experienceLevel, learningGoal],
    );

    await client.query(
      `INSERT INTO player_progress (user_id) VALUES ($1)`,
      [user.id],
    );

    await client.query(
      `INSERT INTO player_settings (user_id) VALUES ($1)`,
      [user.id],
    );

    await client.query(
      `INSERT INTO inventory (user_id, item_id, quantity, equipped)
       VALUES ($1, 'suit-teal-vanguard', 1, TRUE)
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      [user.id],
    );

    return { ...user, alias: cleanAlias };
  });
}

export async function saveRefreshSession(userId, rawToken, expiresAt) {
  await query(
    `INSERT INTO refresh_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, sha256(rawToken), expiresAt],
  );
}

export async function findValidRefreshSession(rawToken) {
  const { rows } = await query(
    `SELECT rs.id, rs.user_id, rs.expires_at, rs.revoked_at, u.email, u.role, u.is_active
       FROM refresh_sessions rs
       JOIN users u ON u.id = rs.user_id
      WHERE rs.token_hash = $1
      LIMIT 1`,
    [sha256(rawToken)],
  );
  const row = rows[0];
  if (!row || row.revoked_at || !row.is_active || new Date(row.expires_at) <= new Date()) {
    return null;
  }
  return row;
}

export async function revokeRefreshSession(rawToken) {
  await query(`UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = $1`, [sha256(rawToken)]);
}

export async function updateProfileAndSettings(userId, profilePatch = {}, settingsPatch = {}) {
  if (Object.keys(profilePatch).length > 0) {
    await query(
      `UPDATE profiles
          SET alias = COALESCE($2, alias),
              character_id = COALESCE($3, character_id),
              avatar_color = COALESCE($4, avatar_color),
              visor_style = COALESCE($5, visor_style),
              language = COALESCE($6, language),
              experience_level = COALESCE($7, experience_level),
              learning_goal = COALESCE($8, learning_goal),
              onboarding_completed = COALESCE($9, onboarding_completed),
              updated_at = NOW()
        WHERE user_id = $1`,
      [
        userId,
        profilePatch.alias ?? null,
        profilePatch.characterId ?? null,
        profilePatch.avatarColor ?? null,
        profilePatch.visorStyle ?? null,
        profilePatch.language ?? null,
        profilePatch.experienceLevel ?? null,
        profilePatch.learningGoal ?? null,
        profilePatch.onboardingCompleted ?? null,
      ],
    );
  }
  if (Object.keys(settingsPatch).length > 0) {
    await query(
      `UPDATE player_settings
          SET sfx_volume = COALESCE($2, sfx_volume),
              music_volume = COALESCE($3, music_volume),
              music_enabled = COALESCE($4, music_enabled),
              voice_narration = COALESCE($5, voice_narration),
              high_contrast = COALESCE($6, high_contrast),
              large_text = COALESCE($7, large_text),
              reduced_motion = COALESCE($8, reduced_motion),
              updated_at = NOW()
        WHERE user_id = $1`,
      [
        userId,
        settingsPatch.sfxVolume ?? null,
        settingsPatch.musicVolume ?? null,
        settingsPatch.musicEnabled ?? null,
        settingsPatch.voiceNarration ?? null,
        settingsPatch.highContrast ?? null,
        settingsPatch.largeText ?? null,
        settingsPatch.reducedMotion ?? null,
      ],
    );
  }
  return findUserById(userId);
}
