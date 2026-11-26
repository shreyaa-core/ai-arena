import { Router } from "express";
import {
  buyShopItem,
  claimDailyBonus,
  getGameState,
  getLeaderboard,
  listShopCatalog,
  submitAssessment,
  submitAttempt,
  unlockSkill,
} from "../controllers/gameController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/state", requireAuth, getGameState);
router.post("/attempts", requireAuth, submitAttempt);
router.post("/assessments", requireAuth, submitAssessment);
router.get("/shop", listShopCatalog);
router.post("/shop/buy", requireAuth, buyShopItem);
router.post("/daily-bonus", requireAuth, claimDailyBonus);
router.post("/skills/unlock", requireAuth, unlockSkill);
router.get("/leaderboard", getLeaderboard);

export default router;
