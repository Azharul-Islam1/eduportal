/**
 * In-memory rate limiter for Next.js API routes (Node.js runtime).
 * Each Next.js process instance has its own store, so this provides
 * best-effort rate limiting suitable for single-server deployments.
 * For multi-instance deployments, replace the store with Redis.
 */

interface Entry {
  count: number;
  resetAt: number;
}

// Module-level store — persists across requests within the same process
const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  },
  5 * 60 * 1000
);

/**
 * Check if a key is within the rate limit.
 * @returns { allowed, remaining, resetAt }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Preset limiters.
 *
 * loginRateLimit(ip)   — 5 attempts / 60s  per IP
 * apiRateLimit(userId) — 120 requests / 60s per user
 * uploadRateLimit(ip)  — 10 uploads / 60s  per IP
 */
export const loginRateLimit = (ip: string) =>
  checkRateLimit(`login:${ip}`, 5, 60_000);

export const apiRateLimit = (userId: string) =>
  checkRateLimit(`api:${userId}`, 120, 60_000);

export const uploadRateLimit = (ip: string) =>
  checkRateLimit(`upload:${ip}`, 10, 60_000);

/**
 * HOF — wrap a route handler with rate limiting.
 *
 * @example
 * export const POST = withRateLimit(
 *   (req) => req.headers.get("x-forwarded-for") ?? "unknown",
 *   { limit: 5, windowMs: 60_000 }
 * )(myHandler);
 */
export function withRateLimit(
  getKey: (req: Request) => string,
  opts: { limit: number; windowMs: number }
) {
  return function <T extends unknown[]>(handler: (...args: T) => Promise<Response>) {
    return async function (...args: T): Promise<Response> {
      const req = args[0] as Request;
      const key = getKey(req);
      const { allowed, remaining, resetAt } = checkRateLimit(key, opts.limit, opts.windowMs);

      if (!allowed) {
        const { NextResponse } = await import("next/server");
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
              "X-RateLimit-Limit": String(opts.limit),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

      const res = await handler(...args);
      // Attach rate limit headers to successful responses
      if (res instanceof Response) {
        res.headers.set("X-RateLimit-Limit", String(opts.limit));
        res.headers.set("X-RateLimit-Remaining", String(remaining));
      }
      return res;
    };
  };
}
