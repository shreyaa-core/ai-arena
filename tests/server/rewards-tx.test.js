import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claimDailyReward, purchaseShopItem } from "../../server/services/rewards/rewardService.js";

function createMockDb({ initialCoins = 200, itemPrice = 140, duplicateKey = false, lastBonusDate = null } = {}) {
  const queries = [];
  const state = { coins: initialCoins, txCount: 0, streak: 2 };

  const client = {
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (sql.includes("FROM reward_transactions WHERE idempotency_key")) {
        return { rows: duplicateKey ? [{ id: "existing-tx" }] : [] };
      }
      if (sql.includes("FROM items WHERE id")) {
        return { rows: [{ id: params[0], name: "Solar Gold Suit", slot: "suit", price_coins: itemPrice }] };
      }
      if (sql.includes("SELECT coins FROM player_progress")) {
        return { rows: [{ coins: state.coins }] };
      }
      if (sql.includes("UPDATE player_progress SET coins = coins -")) {
        state.coins -= params[1];
        return { rows: [{ coins: state.coins }] };
      }
      if (sql.includes("INSERT INTO reward_transactions")) {
        state.txCount++;
        return { rows: [] };
      }
      if (sql.includes("SELECT coins, daily_login_streak")) {
        return {
          rows: [{ coins: state.coins, daily_login_streak: state.streak, last_daily_bonus_at: lastBonusDate }],
        };
      }
      if (sql.includes("daily_login_streak = $3")) {
        state.coins += params[1];
        state.streak = params[2];
        return { rows: [{ coins: state.coins, daily_login_streak: state.streak }] };
      }
      return { rows: [] };
    },
  };

  return {
    state,
    queries,
    withTransaction: async (fn) => fn(client),
  };
}

describe("Transaction-safe reward & shop services (mock DB)", () => {
  it("deducts coins atomically and writes ledger row on valid purchase", async () => {
    const mockDb = createMockDb({ initialCoins: 200, itemPrice: 140 });
    const res = await purchaseShopItem({ userId: "u1", itemId: "suit-gold-astrolabe", idempotencyKey: "k1" }, mockDb);
    assert.equal(res.duplicate, false);
    assert.equal(res.coinsRemaining, 60);
    assert.equal(mockDb.state.txCount, 1);
  });

  it("blocks overspending when player lacks enough coins", async () => {
    const mockDb = createMockDb({ initialCoins: 50, itemPrice: 140 });
    await assert.rejects(
      () => purchaseShopItem({ userId: "u1", itemId: "suit-gold-astrolabe" }, mockDb),
      (err) => err.statusCode === 400 && /Insufficient coins/.test(err.message),
    );
    assert.equal(mockDb.state.coins, 50);
  });

  it("prevents duplicate purchase charges on idempotency replay", async () => {
    const mockDb = createMockDb({ initialCoins: 200, duplicateKey: true });
    const res = await purchaseShopItem({ userId: "u1", itemId: "suit-gold-astrolabe", idempotencyKey: "dup" }, mockDb);
    assert.equal(res.duplicate, true);
    assert.equal(mockDb.state.coins, 200);
  });

  it("prevents double-claiming daily bonus on the same UTC date", async () => {
    const todayIso = new Date().toISOString();
    const mockDb = createMockDb({ initialCoins: 100, lastBonusDate: todayIso });
    const res = await claimDailyReward("u1", mockDb);
    assert.equal(res.alreadyClaimed, true);
    assert.equal(mockDb.state.coins, 100);
  });
});
