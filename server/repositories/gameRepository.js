import { query } from "../config/db.js";

export async function fetchPlayerStateSnapshot(userId) {
  const [attempts, mastery, unlocks, achievements, quests, inventory, assessments] = await Promise.all([
    query(
      `SELECT id, mission_id, mode, rubric_score, efficiency, grade, xp_earned, coins_earned, seconds_spent, hints_used, turns_used, evaluator_type, created_at
         FROM mission_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId],
    ),
    query(`SELECT domain, mastery_score, attempts_count, best_score FROM skill_mastery WHERE user_id = $1`, [userId]),
    query(`SELECT skill_id, unlocked_at FROM user_skill_unlocks WHERE user_id = $1`, [userId]),
    query(
      `SELECT pa.achievement_id, a.name, a.description, pa.unlocked_at
         FROM player_achievements pa JOIN achievements a ON a.id = pa.achievement_id
        WHERE pa.user_id = $1`,
      [userId],
    ),
    query(
      `SELECT q.id, q.title, q.quest_type, q.target_count, q.reward_xp, q.reward_coins,
              COALESCE(qp.current_count, 0) AS current_count, COALESCE(qp.completed, FALSE) AS completed, qp.claimed_at
         FROM quests q LEFT JOIN quest_progress qp ON qp.quest_id = q.id AND qp.user_id = $1`,
      [userId],
    ),
    query(
      `SELECT i.id, i.name, i.slot, i.price_coins, inv.quantity, inv.equipped
         FROM inventory inv JOIN items i ON i.id = inv.item_id
        WHERE inv.user_id = $1`,
      [userId],
    ),
    query(
      `SELECT id, assessment_type, overall_aei, proficiency_band, certificate_code, created_at
         FROM assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId],
    ),
  ]);

  return {
    attempts: attempts.rows,
    mastery: mastery.rows,
    skillUnlocks: unlocks.rows,
    achievements: achievements.rows,
    quests: quests.rows,
    inventory: inventory.rows,
    assessments: assessments.rows,
  };
}

export async function fetchLeaderboard(limit = 30) {
  const { rows } = await query(
    `SELECT user_id, alias, rank_title, average_efficiency, aei_score, total_xp, missions_cleared, best_streak, updated_at
       FROM leaderboards
      ORDER BY average_efficiency DESC, total_xp DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function fetchPublicPassportByCode(code) {
  const { rows } = await query(
    `SELECT a.id, a.assessment_type, a.overall_aei, a.proficiency_band, a.certificate_code, a.created_at,
            p.alias, p.character_id, pp.rank_title
       FROM assessments a
       JOIN profiles p ON p.user_id = a.user_id
       JOIN player_progress pp ON pp.user_id = a.user_id
      WHERE a.certificate_code = $1
      LIMIT 1`,
    [code],
  );
  if (!rows[0]) return null;
  const details = await query(
    `SELECT domain, score, strengths, weaknesses FROM assessment_details WHERE assessment_id = $1`,
    [rows[0].id],
  );
  return { ...rows[0], domains: details.rows };
}
