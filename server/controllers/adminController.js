import { query } from "../config/db.js";

export async function getAdminAnalytics(_req, res, next) {
  try {
    const [usersCount, attemptsCount, aiLogs, recentAttempts] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM users`),
      query(`SELECT COUNT(*)::int AS total, COALESCE(ROUND(AVG(efficiency)),0)::int AS avg_efficiency FROM mission_attempts`),
      query(`SELECT provider, status, COUNT(*)::int AS calls, COALESCE(SUM(prompt_tokens + completion_tokens),0)::int AS tokens
               FROM ai_usage_logs GROUP BY provider, status`),
      query(`SELECT mission_id, COUNT(*)::int AS runs, COALESCE(ROUND(AVG(efficiency)),0)::int AS avg_eff
               FROM mission_attempts GROUP BY mission_id ORDER BY runs DESC LIMIT 12`),
    ]);

    return res.json({
      users: usersCount.rows[0]?.total || 0,
      attempts: attemptsCount.rows[0] || { total: 0, avg_efficiency: 0 },
      aiUsage: aiLogs.rows,
      missionStats: recentAttempts.rows,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listMissions(_req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM missions ORDER BY world_id, title`);
    return res.json({ missions: rows });
  } catch (err) {
    return next(err);
  }
}
