/**
 * Lightweight in-memory rate limiter for credential sign-in attempts.
 * Tracks failed attempts per key (email or IP) within a sliding window.
 * Not suitable for multi-instance deployments; use Redis/Upstash for scale.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Clean up expired entries every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if a key (email) has exceeded the rate limit.
 * Returns true if the request is allowed, false if rate limited.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired: start new window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Reset the rate limit for a key (call on successful sign-in).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
