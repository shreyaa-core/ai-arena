import { query } from "../config/db.js";
import { fetchLeaderboard, fetchPlayerStateSnapshot } from "../repositories/gameRepository.js";
import {
  recordFormalAssessment,
  recordMissionAttempt,
  unlockSkillNode,
} from "../services/progression/progressionService.js";
import { claimDailyReward, purchaseShopItem } from "../services/rewards/rewardService.js";
import { assessmentSubmitSchema, attemptSchema, shopPurchaseSchema } from "../validators/schemas.js";

export async function getGameState(req, res, next) {
  try {
    const snapshot = await fetchPlayerStateSnapshot(req.user.id);
    return res.json(snapshot);
  } catch (err) {
    return next(err);
  }
}

export async function submitAttempt(req, res, next) {
  try {
    const parsed = attemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid mission attempt payload", issues: parsed.error.issues });
    }
    const progress = await recordMissionAttempt(req.user.id, parsed.data);
    return res.status(201).json({ progress });
  } catch (err) {
    return next(err);
  }
}

export async function submitAssessment(req, res, next) {
  try {
    const parsed = assessmentSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid assessment payload", issues: parsed.error.issues });
    }
    const assessment = await recordFormalAssessment(req.user.id, parsed.data);
    return res.status(201).json({ assessment });
  } catch (err) {
    return next(err);
  }
}

export async function listShopCatalog(_req, res, next) {
  try {
    const { rows } = await query(`SELECT id, name, slot, price_coins, description, metadata_json FROM items ORDER BY price_coins ASC`);
    return res.json({ items: rows });
  } catch (err) {
    return next(err);
  }
}

export async function buyShopItem(req, res, next) {
  try {
    const parsed = shopPurchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid shop purchase request" });
    }
    const result = await purchaseShopItem({
      userId: req.user.id,
      itemId: parsed.data.itemId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function claimDailyBonus(req, res, next) {
  try {
    const result = await claimDailyReward(req.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function unlockSkill(req, res, next) {
  try {
    const skillId = req.body?.skillId;
    if (!skillId || typeof skillId !== "string") {
      return res.status(400).json({ error: "skillId required" });
    }
    const result = await unlockSkillNode(req.user.id, skillId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getLeaderboard(_req, res, next) {
  try {
    const rows = await fetchLeaderboard(50);
    return res.json({ entries: rows });
  } catch (err) {
    return next(err);
  }
}
