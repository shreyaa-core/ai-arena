import { Router } from "express";
import { getMyPassport, getPublicCertificate } from "../controllers/passportController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getMyPassport);
router.get("/verify/:code", getPublicCertificate);

export default router;
