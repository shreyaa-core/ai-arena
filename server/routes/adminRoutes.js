import { Router } from "express";
import { getAdminAnalytics, listMissions } from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin", "educator"));
router.get("/analytics", getAdminAnalytics);
router.get("/missions", listMissions);

export default router;
