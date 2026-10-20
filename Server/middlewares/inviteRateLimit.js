import AppError from "../utils/AppError.js";
// Single-process development limiter; use a shared store before multi-instance deployment.
const windows = new Map();
const WINDOW = 60000;
export default function inviteRateLimit(req, res, next) {
  const now = Date.now();
  for (const [key, value] of windows) if (value.reset <= now) windows.delete(key);
  const keys = [`user:${req.userId}`, `ip:${req.ip}`];
  const blocked = keys.some(key => (windows.get(key)?.count || 0) >= 30);
  if (blocked) { res.set("Retry-After", "60"); return next(new AppError(429, "Too many invitation attempts. Try again in a minute.")); }
  for (const key of keys) { const value = windows.get(key) || { count: 0, reset: now + WINDOW }; value.count += 1; windows.set(key, value); }
  next();
}
