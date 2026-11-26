import { Router } from "express";
import { aiEvaluate, aiPlayground, aiSpeechTranscribe, aiStatus, aiVisionAnalyze, novaChat } from "../controllers/aiController.js";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/status", aiStatus);
router.post("/chat", optionalAuth, aiLimiter, novaChat);
router.post("/evaluate", optionalAuth, aiLimiter, aiEvaluate);
router.post("/playground", optionalAuth, aiLimiter, aiPlayground);
router.post("/vision", optionalAuth, aiLimiter, aiVisionAnalyze);
router.post("/stt", optionalAuth, aiLimiter, aiSpeechTranscribe);

export default router;
