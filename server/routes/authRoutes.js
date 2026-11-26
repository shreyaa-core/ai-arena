import { Router } from "express";
import { login, logout, me, migrateGuestProgress, refresh, register, updateMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);
router.post("/migrate-guest", requireAuth, migrateGuestProgress);

export default router;
