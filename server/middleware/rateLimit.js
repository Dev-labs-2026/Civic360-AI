const windows = new Map();
let lastCleanup = Date.now();

// Small process-local fixed-window limiter. It is intentionally dependency-free;
// deployments with multiple instances should enforce limits at their gateway.
export const rateLimit = ({ windowMs = 60_000, max = 30, message = 'Too many requests. Please try again shortly.' } = {}) => (req, res, next) => {
  const now = Date.now();
  const routeKey = req.route?.path || req.path;
  const key = `${req.baseUrl}${routeKey}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  windows.set(key, entry);
  if (now - lastCleanup > windowMs) {
    for (const [storedKey, storedEntry] of windows) if (storedEntry.resetAt <= now) windows.delete(storedKey);
    lastCleanup = now;
  }
  res.set('RateLimit-Limit', String(max));
  res.set('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
  res.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
  if (entry.count > max) return res.status(429).json({ success: false, message });
  return next();
};

export const authRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 20 });
export const publicAnalysisRateLimit = rateLimit({ windowMs: 60_000, max: 30 });
