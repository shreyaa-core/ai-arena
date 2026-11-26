import crypto from "node:crypto";
import { withTransaction } from "../../config/db.js";
import { resolveRankFromXp } from "../rewards/rewardService.js";

const DOMAIN_AEI_WEIGHTS = {
  prompt: 0.25,
  evaluation: 0.2,
  workflow: 0.2,
  responsible: 0.15,
  tools: 0.1,
  creative: 0.1,
};

export function aeiBandFromScore(aei) {
  if (aei >= 90) return "AI Grandmaster";
  if (aei >= 75) return "AI Strategist";
  if (aei >= 60) return "AI Problem Solver";
  if (aei >= 40) return "AI Practitioner";
  return "AI Beginner";
}

export async function recordMissionAttempt(userId, attempt, db = { withTransaction }) {
  return db.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO mission_attempts
        (user_id, mission_id, mode, rubric_score, efficiency, grade, xp_earned, coins_earned, seconds_spent, hints_used, turns_used, evaluator_type, response_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        userId,
        attempt.missionId,
        attempt.mode,
        attempt.rubricScore,
        attempt.efficiency,
        attempt.grade,
        attempt.xpEarned,
        attempt.coinsEarned,
        attempt.secondsSpent,
        attempt.hintsUsed,
        attempt.turnsUsed,
        attempt.evaluatorType,
        JSON.stringify(attempt.responseJson || {}),
      ],
    );

    // Upsert domain skill mastery
    await client.query(
      `INSERT INTO skill_mastery (user_id, domain, mastery_score, attempts_count, best_score)
       VALUES ($1, $2, $3, 1, $3)
       ON CONFLICT (user_id, domain)
       DO UPDATE SET
         attempts_count = skill_mastery.attempts_count + 1,
         best_score = GREATEST(skill_mastery.best_score, EXCLUDED.best_score),
         mastery_score = ROUND((skill_mastery.mastery_score * 0.65) + (EXCLUDED.best_score * 0.35)),
         updated_at = NOW()`,
      [userId, attempt.domain, attempt.efficiency],
    );

    // Compute fresh weighted AEI from skill_mastery
    const masteryRows = await client.query(
      `SELECT domain, best_score FROM skill_mastery WHERE user_id = $1`,
      [userId],
    );
    let weighted = 0;
    for (const row of masteryRows.rows) {
      weighted += (row.best_score || 0) * (DOMAIN_AEI_WEIGHTS[row.domain] || 0);
    }
    const aeiScore = Math.round(weighted);
    const aeiBand = aeiBandFromScore(aeiScore);

    // Update gameplay progression
    const progRes = await client.query(
      `SELECT xp, coins, current_streak, best_streak FROM player_progress WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    const prog = progRes.rows[0] || { xp: 0, coins: 0, current_streak: 0, best_streak: 0 };
    const nextXp = prog.xp + attempt.xpEarned;
    const nextCoins = prog.coins + attempt.coinsEarned;
    const nextStreak = attempt.efficiency >= 70 ? prog.current_streak + 1 : 0;
    const nextBestStreak = Math.max(prog.best_streak, nextStreak);
    const nextRank = resolveRankFromXp(nextXp);

    await client.query(
      `UPDATE player_progress
          SET xp = $2,
              rank_level = $3,
              rank_title = $4,
              coins = $5,
              aei_score = $6,
              aei_band = $7,
              current_streak = $8,
              best_streak = $9,
              updated_at = NOW()
        WHERE user_id = $1`,
      [userId, nextXp, nextRank.level, nextRank.title, nextCoins, aeiScore, aeiBand, nextStreak, nextBestStreak],
    );

    await client.query(
      `INSERT INTO reward_transactions (user_id, source_type, source_ref, xp_delta, coin_delta)
       VALUES ($1, 'mission_clear', $2, $3, $4)`,
      [userId, attempt.missionId, attempt.xpEarned, attempt.coinsEarned],
    );

    // Update leaderboard snapshot
    const statsRes = await client.query(
      `SELECT p.alias, COUNT(DISTINCT CASE WHEN ma.rubric_score >= 50 THEN ma.mission_id END) AS cleared,
              COALESCE(ROUND(AVG(ma.efficiency)), 0) AS avg_eff
         FROM profiles p
         LEFT JOIN mission_attempts ma ON ma.user_id = p.user_id
        WHERE p.user_id = $1
        GROUP BY p.alias`,
      [userId],
    );
    const lb = statsRes.rows[0] || { alias: "Operator", cleared: 0, avg_eff: attempt.efficiency };

    await client.query(
      `INSERT INTO leaderboards (user_id, alias, rank_title, average_efficiency, aei_score, total_xp, missions_cleared, best_streak)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         alias = EXCLUDED.alias,
         rank_title = EXCLUDED.rank_title,
         average_efficiency = EXCLUDED.average_efficiency,
         aei_score = EXCLUDED.aei_score,
         total_xp = EXCLUDED.total_xp,
         missions_cleared = EXCLUDED.missions_cleared,
         best_streak = EXCLUDED.best_streak,
         updated_at = NOW()`,
      [userId, lb.alias, nextRank.title, Number(lb.avg_eff), aeiScore, nextXp, Number(lb.cleared), nextBestStreak],
    );

    return {
      xp: nextXp,
      coins: nextCoins,
      rank: nextRank,
      aeiScore,
      aeiBand,
      currentStreak: nextStreak,
      bestStreak: nextBestStreak,
    };
  });
}

export async function recordFormalAssessment(userId, payload, db = { withTransaction }) {
  return db.withTransaction(async (client) => {
    let weighted = 0;
    let weightSum = 0;
    for (const item of payload.domainScores) {
      const w = DOMAIN_AEI_WEIGHTS[item.domain] || 0.15;
      weighted += item.score * w;
      weightSum += w;
    }
    const overallAei = Math.round(weightSum > 0 ? weighted / weightSum : 0);
    const band = aeiBandFromScore(overallAei);
    const certCode = `AIA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const res = await client.query(
      `INSERT INTO assessments (user_id, assessment_type, overall_aei, proficiency_band, certificate_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, assessment_type, overall_aei, proficiency_band, certificate_code, created_at`,
      [userId, payload.assessmentType, overallAei, band, certCode],
    );
    const assessment = res.rows[0];

    for (const item of payload.domainScores) {
      await client.query(
        `INSERT INTO assessment_details (assessment_id, domain, score, strengths, weaknesses)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assessment.id,
          item.domain,
          item.score,
          JSON.stringify(item.strengths || []),
          JSON.stringify(item.weaknesses || []),
        ],
      );
    }

    await client.query(
      `UPDATE player_progress SET aei_score = $2, aei_band = $3, updated_at = NOW() WHERE user_id = $1`,
      [userId, overallAei, band],
    );

    return assessment;
  });
}

export async function unlockSkillNode(userId, skillId, db = { withTransaction }) {
  return db.withTransaction(async (client) => {
    const skillRes = await client.query(`SELECT id, prerequisite_id FROM skill_tree WHERE id = $1 LIMIT 1`, [skillId]);
    const skill = skillRes.rows[0];
    if (!skill) {
      const err = new Error("Skill node not found");
      err.statusCode = 404;
      throw err;
    }
    if (skill.prerequisite_id) {
      const prereq = await client.query(
        `SELECT 1 FROM user_skill_unlocks WHERE user_id = $1 AND skill_id = $2`,
        [userId, skill.prerequisite_id],
      );
      if (prereq.rows.length === 0) {
        const err = new Error(`Requires prerequisite skill: ${skill.prerequisite_id}`);
        err.statusCode = 400;
        throw err;
      }
    }
    await client.query(
      `INSERT INTO user_skill_unlocks (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, skillId],
    );
    return { unlocked: skillId };
  });
}
