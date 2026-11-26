import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import { signAccessToken } from "../middleware/auth.js";
import {
  createUserWithProfile,
  findUserByEmail,
  findUserById,
  findValidRefreshSession,
  revokeRefreshSession,
  saveRefreshSession,
  updateProfileAndSettings,
} from "../repositories/userRepository.js";
import {
  guestMigrateSchema,
  loginSchema,
  profilePatchSchema,
  registerSchema,
  settingsPatchSchema,
} from "../validators/schemas.js";
import { recordMissionAttempt } from "../services/progression/progressionService.js";

function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = env.nodeEnv === "production";
  res.cookie("ai_arena_access", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 15 * 60 * 1000,
    path: "/",
  });
  res.cookie("ai_arena_refresh", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: env.refreshTtlDays * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
  issueCsrfToken(res);
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid registration input", issues: parsed.error.issues });
    }
    const existing = await findUserByEmail(parsed.data.email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 11);
    const created = await createUserWithProfile({ ...parsed.data, passwordHash });
    const accessToken = signAccessToken(created);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + env.refreshTtlDays * 86400 * 1000);
    await saveRefreshSession(created.id, refreshToken, expiresAt);

    setAuthCookies(res, accessToken, refreshToken);
    const user = await findUserById(created.id);
    return res.status(201).json({ user, accessToken });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const userRow = await findUserByEmail(parsed.data.email);
    if (!userRow || !userRow.is_active) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(parsed.data.password, userRow.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = signAccessToken(userRow);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + env.refreshTtlDays * 86400 * 1000);
    await saveRefreshSession(userRow.id, refreshToken, expiresAt);

    setAuthCookies(res, accessToken, refreshToken);
    const user = await findUserById(userRow.id);
    return res.json({ user, accessToken });
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const rawRefresh = req.cookies?.ai_arena_refresh || req.body?.refreshToken;
    if (!rawRefresh) {
      return res.status(401).json({ error: "No refresh session provided" });
    }
    const session = await findValidRefreshSession(rawRefresh);
    if (!session) {
      return res.status(401).json({ error: "Refresh session expired or revoked" });
    }

    await revokeRefreshSession(rawRefresh);
    const nextRefresh = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + env.refreshTtlDays * 86400 * 1000);
    await saveRefreshSession(session.user_id, nextRefresh, expiresAt);

    const accessToken = signAccessToken({ id: session.user_id, email: session.email, role: session.role });
    setAuthCookies(res, accessToken, nextRefresh);
    return res.json({ accessToken });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const rawRefresh = req.cookies?.ai_arena_refresh;
    if (rawRefresh) {
      await revokeRefreshSession(rawRefresh);
    }
    res.clearCookie("ai_arena_access", { path: "/" });
    res.clearCookie("ai_arena_refresh", { path: "/api/auth" });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "Account not found" });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const profileParsed = profilePatchSchema.safeParse(req.body.profile || {});
    const settingsParsed = settingsPatchSchema.safeParse(req.body.settings || {});
    if (!profileParsed.success || !settingsParsed.success) {
      return res.status(400).json({ error: "Invalid profile or settings payload" });
    }
    const updated = await updateProfileAndSettings(req.user.id, profileParsed.data, settingsParsed.data);
    return res.json({ user: updated });
  } catch (err) {
    return next(err);
  }
}

export async function migrateGuestProgress(req, res, next) {
  try {
    const parsed = guestMigrateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid guest progress payload", issues: parsed.error.issues });
    }
    if (parsed.data.profile) {
      await updateProfileAndSettings(req.user.id, parsed.data.profile, {});
    }
    let migrated = 0;
    for (const sub of parsed.data.submissions.slice(0, 50)) {
      if (sub.mode === "assessment") continue;
      await recordMissionAttempt(req.user.id, {
        missionId: sub.challengeId,
        mode: "campaign",
        domain: "prompt",
        rubricScore: sub.score,
        efficiency: sub.efficiency ?? sub.score,
        grade: sub.grade || "B",
        xpEarned: Math.min(250, sub.xp ?? Math.round(sub.score * 0.9)),
        coinsEarned: 15,
        secondsSpent: sub.seconds ?? 120,
        hintsUsed: sub.hintsUsed ?? 0,
        turnsUsed: sub.turnsUsed ?? 0,
        evaluatorType: "guest-migration",
        responseJson: { migratedAt: sub.at || new Date().toISOString() },
      });
      migrated++;
    }
    const user = await findUserById(req.user.id);
    return res.json({ ok: true, migratedCount: migrated, user });
  } catch (err) {
    return next(err);
  }
}
