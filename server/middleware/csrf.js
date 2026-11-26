import crypto from "node:crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function issueCsrfToken(res) {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie("ai_arena_csrf", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
}

/**
 * Enforces CSRF check on mutating routes authenticated via cookies (Bearer tokens skip).
 */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.headers.authorization?.startsWith("Bearer ")) return next();
  if (!req.cookies?.ai_arena_access && !req.cookies?.ai_arena_refresh) return next();

  const cookieToken = req.cookies?.ai_arena_csrf;
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }
  return next();
}
