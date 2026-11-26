import { withTransaction } from "../../config/db.js";

export const RANK_THRESHOLDS = [
  { level: 1, title: "Prompt Novice", minXp: 0 },
  { level: 2, title: "Signal Seeker", minXp: 150 },
  { level: 3, title: "Tactical Operator", minXp: 350 },
  { level: 4, title: "Workflow Architect", minXp: 650 },
  { level: 5, title: "Verification Ace", minXp: 1050 },
  { level: 6, title: "AI Grandmaster", minXp: 1600 },
];

export function resolveRankFromXp(xp) {
  let rank = RANK_THRESHOLDS[0];
  for (const tier of RANK_THRESHOLDS) {
    if (xp >= tier.minXp) rank = tier;
  }
  return rank;
}

/**
 * Transaction-safe shop item purchase using row-level lock (`FOR UPDATE`).
 */
export async function purchaseShopItem({ userId, itemId, idempotencyKey }, db = { withTransaction }) {
  return db.withTransaction(async (client) => {
    if (idempotencyKey) {
      const dup = await client.query(
        `SELECT id FROM reward_transactions WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey],
      );
      if (dup.rows.length > 0) {
        return { duplicate: true, itemId };
      }
    }

    const itemRes = await client.query(
      `SELECT id, name, slot, price_coins FROM items WHERE id = $1 LIMIT 1`,
      [itemId],
    );
    const item = itemRes.rows[0];
    if (!item) {
      const err = new Error("Shop item not found");
      err.statusCode = 404;
      throw err;
    }

    const progRes = await client.query(
      `SELECT coins FROM player_progress WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    const progress = progRes.rows[0];
    if (!progress) {
      const err = new Error("Player progress record not found");
      err.statusCode = 404;
      throw err;
    }

    if (progress.coins < item.price_coins) {
      const err = new Error("Insufficient coins for purchase");
      err.statusCode = 400;
      throw err;
    }

    const updatedProg = await client.query(
      `UPDATE player_progress SET coins = coins - $2, updated_at = NOW() WHERE user_id = $1 RETURNING coins`,
      [userId, item.price_coins],
    );

    await client.query(
      `INSERT INTO inventory (user_id, item_id, quantity, equipped)
       VALUES ($1, $2, 1, TRUE)
       ON CONFLICT (user_id, item_id)
       DO UPDATE SET quantity = inventory.quantity + 1, equipped = TRUE`,
      [userId, item.id],
    );

    await client.query(
      `INSERT INTO reward_transactions (user_id, source_type, source_ref, xp_delta, coin_delta, idempotency_key)
       VALUES ($1, 'shop_purchase', $2, 0, $3, $4)`,
      [userId, item.id, -item.price_coins, idempotencyKey || null],
    );

    return {
      purchased: item,
      coinsRemaining: updatedProg.rows[0].coins,
      duplicate: false,
    };
  });
}

export async function claimDailyReward(userId, db = { withTransaction }) {
  return db.withTransaction(async (client) => {
    const res = await client.query(
      `SELECT coins, daily_login_streak, last_daily_bonus_at FROM player_progress WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    const row = res.rows[0];
    if (!row) {
      const err = new Error("Player not found");
      err.statusCode = 404;
      throw err;
    }

    const today = new Date().toISOString().slice(0, 10);
    const lastDay = row.last_daily_bonus_at ? new Date(row.last_daily_bonus_at).toISOString().slice(0, 10) : null;
    if (lastDay === today) {
      return { alreadyClaimed: true, coins: row.coins, streak: row.daily_login_streak };
    }

    const nextStreak = (row.daily_login_streak || 0) + 1;
    const coinBonus = Math.min(80, 25 + nextStreak * 5);

    const updated = await client.query(
      `UPDATE player_progress
          SET coins = coins + $2,
              daily_login_streak = $3,
              last_daily_bonus_at = NOW(),
              updated_at = NOW()
        WHERE user_id = $1
        RETURNING coins, daily_login_streak`,
      [userId, coinBonus, nextStreak],
    );

    await client.query(
      `INSERT INTO reward_transactions (user_id, source_type, source_ref, xp_delta, coin_delta)
       VALUES ($1, 'daily_bonus', $2, 0, $3)`,
      [userId, today, coinBonus],
    );

    return {
      alreadyClaimed: false,
      coinBonus,
      coins: updated.rows[0].coins,
      streak: updated.rows[0].daily_login_streak,
    };
  });
}
