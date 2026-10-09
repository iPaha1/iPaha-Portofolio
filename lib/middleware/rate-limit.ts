// =============================================================================
// lib/middleware/rate-limit.ts
// Redis-backed sliding window rate limiter
// Falls back to in-memory if Redis unavailable (development)
// =============================================================================

interface RateLimitParams {
  key:        string;   // Unique key — "apikey:{id}" or "ip:{address}"
  limit:      number;   // Max requests allowed in window
  windowSecs: number;   // Window duration in seconds
}

interface RateLimitResult {
  allowed:   boolean;
  limit:     number;
  remaining: number;
  resetAt:   Date;
}

// In-memory fallback store (development / non-Redis environments)
const memStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(params: RateLimitParams): Promise<RateLimitResult> {
  const { key, limit, windowSecs } = params;
  const now = Date.now();
  const resetAt = new Date(now + windowSecs * 1000);

  // ── In-memory implementation (always used until you add Redis) ───────────
  const entry = memStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    memStore.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
    return { allowed: true, limit, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return {
      allowed:   false,
      limit,
      remaining: 0,
      resetAt:   new Date(entry.resetAt),
    };
  }

  entry.count++;
  return {
    allowed:   true,
    limit,
    remaining: limit - entry.count,
    resetAt:   new Date(entry.resetAt),
  };

  // ── Production Redis implementation (uncomment when ready) ───────────────
  // const pipeline = redis.pipeline();
  // pipeline.incr(key);
  // pipeline.pttl(key);
  // const [[, count], [, ttl]] = await pipeline.exec();
  // if (count === 1) await redis.expire(key, windowSecs);
  // const resetAt = new Date(Date.now() + (ttl > 0 ? ttl : windowSecs * 1000));
  // return {
  //   allowed:   count <= limit,
  //   limit,
  //   remaining: Math.max(0, limit - count),
  //   resetAt,
  // };
}

// =============================================================================
// lib/middleware/cors.ts
// CORS headers for the API — per-company domain allowlist
// =============================================================================

/**
 * Adds CORS headers to an API response based on the company's allowed domains.
 * Called from within route handlers AFTER authentication resolves the company.
 *
 * @param origin - The request's Origin header
 * @param allowedDomains - JSON string array from company record
 */
export function getCorsHeaders(
  origin: string | null,
  allowedDomains: string | null
): Record<string, string> {
  // Always allow requests with no origin (server-to-server, Postman, etc.)
  if (!origin) {
    return {
      "Access-Control-Allow-Methods":  "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":  "Authorization, Content-Type, X-Request-ID",
      "Access-Control-Max-Age":        "86400",
    };
  }

  // Parse allowed domains
  let domains: string[] = [];
  if (allowedDomains) {
    try { domains = JSON.parse(allowedDomains); } catch {}
  }

  // Normalise: strip trailing slash, lowercase
  const normOrigin = origin.replace(/\/$/, "").toLowerCase();

  const allowed = domains.length === 0
    ? true  // No restriction configured — allow all
    : domains.some((d) => normOrigin === d || normOrigin.endsWith(`.${d}`));

  if (!allowed) return {};  // Return no CORS headers — browser will block preflight

  return {
    "Access-Control-Allow-Origin":      origin,
    "Access-Control-Allow-Methods":     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":     "Authorization, Content-Type, X-Request-ID",
    "Access-Control-Allow-Credentials": "false",  // API keys don't use cookies
    "Access-Control-Max-Age":           "86400",
    "Vary":                             "Origin",
  };
}

/**
 * Handles OPTIONS preflight requests.
 * Add this to every route file:
 *   export const OPTIONS = handlePreflight;
 */
export function handlePreflight(req: Request): Response {
  const origin = req.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin, null),
  });
}