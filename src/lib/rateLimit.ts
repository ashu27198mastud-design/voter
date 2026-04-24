type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

// Periodic cleanup to prevent memory leaks in the in-memory store
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 300_000); // Clean every 5 minutes
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  store.set(key, existing);

  return { allowed: true, remaining: MAX_REQUESTS - existing.count };
}
