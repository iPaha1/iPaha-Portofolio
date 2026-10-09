// =============================================================================
// lib/middleware/authenticate.ts
// Updated for Next.js 15 — params is now a Promise
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { errors } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/types";
import crypto from "crypto";
import { prismadb } from "../db";
import { checkRateLimit } from "./rate-limit";
import { logApiRequest } from "../services/audit";

// ... (keep the hashApiKey and safeEqual functions as they are)

function hashApiKey(rawKey: string): string {
  return createHmac("sha256", process.env.API_KEY_HASH_SECRET!)
    .update(rawKey)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// -----------------------------------------------------------------------------
// Updated type for route params (Promise-based for Next.js 15)
// -----------------------------------------------------------------------------
type AuthenticatedHandler = (
  req: NextRequest,
  apiCtx: ApiContext,
  routeParams: { params: Promise<Record<string, string>> | Record<string, string> }
) => Promise<NextResponse>;

interface AuthOptions {
  requiredScope: string;
}

export function withAuth(handler: AuthenticatedHandler, opts: AuthOptions) {
  return async (
    req: NextRequest,
    routeParams: { params: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startMs = Date.now();
    let companyId: string | undefined;
    let apiKeyId: string | undefined;

    try {
      // ── STEP 1: Extract Bearer token ──────────────────────────────────────
      const authHeader = req.headers.get("authorization") ?? "";
      if (!authHeader.startsWith("Bearer ")) {
        return errors.missingKey(requestId);
      }
      const rawKey = authHeader.slice(7).trim();
      if (!rawKey) return errors.missingKey(requestId);

      // ── STEP 2: Hash and look up key ──────────────────────────────────────
      const keyHash = hashApiKey(rawKey);
      const apiKey = await prismadb.companyApiKey.findUnique({
        where: { keyHash },
        include: { company: { select: { id: true, slug: true, isActive: true, isSuspended: true, planTier: true } } },
      });

      if (!apiKey) return errors.invalidKey(requestId);
      apiKeyId = apiKey.id;

      // ── STEP 3: Check lifecycle ────────────────────────────────────────────
      if (!apiKey.isActive || apiKey.revokedAt) return errors.revokedKey(requestId);
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return errors.expiredKey(requestId);

      // ── STEP 4: IP allowlist ───────────────────────────────────────────────
      if (apiKey.allowedIps) {
        const allowedIps: string[] = JSON.parse(apiKey.allowedIps);
        if (allowedIps.length > 0) {
          const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            ?? req.headers.get("x-real-ip")
            ?? "";
          if (!allowedIps.includes(requestIp)) {
            return errors.ipBlocked(requestId);
          }
        }
      }

      // ── STEP 5: Domain allowlist ───────────────────────────────────────────
      if (apiKey.allowedDomains) {
        const allowedDomains: string[] = JSON.parse(apiKey.allowedDomains);
        if (allowedDomains.length > 0) {
          const origin = req.headers.get("origin") ?? "";
          const normalised = origin.replace(/\/$/, "");
          if (!allowedDomains.some((d) => normalised === d || normalised.endsWith(`.${d}`))) {
            return errors.domainBlocked(requestId);
          }
        }
      }

      // ── STEP 6: Resolve company from URL slug (FIX: await params) ─────────────
      // IMPORTANT: params is a Promise in Next.js 15
      const resolvedParams = await routeParams.params;
      const slugFromUrl = resolvedParams?.companySlug as string;
      
      if (!slugFromUrl) {
                return errors.companyNotFound(requestId);
      }
      
      const company = await prismadb.company.findUnique({
        where: { slug: slugFromUrl },
        select: { id: true, slug: true, isActive: true, isSuspended: true },
      });

      if (!company || !company.isActive) return errors.companyNotFound(requestId);
      if (company.isSuspended) return errors.companySuspended(requestId);
      companyId = company.id;

      // ── STEP 7: Company mismatch check ────────────────────────────────────
      if (!safeEqual(apiKey.company.id, company.id)) {
        return errors.companyMismatch(requestId);
      }

      // ── STEP 8: Rate limiting ─────────────────────────────────────────────
      const rateLimit = apiKey.rateLimit ?? getPlanRateLimit(apiKey.company.planTier || "STARTER");
      const rateLimitResult = await checkRateLimit({
        key:        `apikey:${apiKey.id}`,
        limit:      rateLimit,
        windowSecs: apiKey.rateLimitWindow || 60,
      });

      if (!rateLimitResult.allowed) {
        return errors.rateLimit(requestId, rateLimitResult.resetAt);
      }

      // ── STEP 9: Scope check ────────────────────────────────────────────────
      const keyScopes: string[] = JSON.parse(apiKey.scopes);
      if (!keyScopes.includes(opts.requiredScope)) {
        return errors.insufficientScope(requestId, opts.requiredScope);
      }

      // ── STEP 10: Build context and call handler ────────────────────────────
      const apiCtx: ApiContext = {
        requestId,
        companyId:   company.id,
        companySlug: company.slug,
        apiKeyId:    apiKey.id,
        scopes:      keyScopes,
        rateLimitInfo: {
          limit:     rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetAt:   rateLimitResult.resetAt,
        },
      };

      // Fire-and-forget: update key usage stats
      prismadb.companyApiKey.update({
        where: { id: apiKey.id },
        data: {
          lastUsedAt: new Date(),
          lastUsedIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          totalRequests: { increment: 1 },
        },
      }).catch(() => {});

      const response = await handler(req, apiCtx, routeParams);

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit",     String(rateLimitResult.limit));
      response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
      response.headers.set("X-RateLimit-Reset",     rateLimitResult.resetAt.toISOString());

      // Log request
      logApiRequest({
        requestId,
        companyId:   company.id,
        method:      req.method,
        path:        new URL(req.url).pathname,
        apiKeyId:    apiKey.id,
        statusCode:  response.status,
        responseMs:  Date.now() - startMs,
        ipAddress:   req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
        userAgent:   req.headers.get("user-agent") ?? undefined,
        origin:      req.headers.get("origin") ?? undefined,
      }).catch(() => {});

      return response;
    } catch (err) {
      console.error(`[API] Internal error — requestId:${requestId}`, err);

      logApiRequest({
        requestId,
        companyId,
        method:    req.method,
        path:      new URL(req.url).pathname,
        apiKeyId,
        statusCode: 500,
        responseMs: Date.now() - startMs,
      }).catch(() => {});

      return errors.internal(requestId);
    }
  };
}

function getPlanRateLimit(tier: string): number {
  const limits: Record<string, number> = {
    STARTER:    60,
    GROWTH:     200,
    PRO:        500,
    ENTERPRISE: 2000,
  };
  return limits[tier] ?? 60;
}





// // =============================================================================
// // lib/middleware/authenticate.ts
// // API key authentication middleware — runs on EVERY /api/v1/* request
// //
// // Pipeline:
// //   1. Extract Bearer token from Authorization header
// //   2. Hash the token and look up in DB (never store raw key)
// //   3. Validate: not expired, not revoked
// //   4. Check IP allowlist (if configured)
// //   5. Check origin/domain allowlist (if configured)
// //   6. Resolve company from URL slug
// //   7. Verify key belongs to that company (prevent cross-tenant access)
// //   8. Check company is active and not suspended
// //   9. Check rate limit
// //  10. Verify required scope for the endpoint
// //  11. Attach ApiContext to request and call handler
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { createHmac, timingSafeEqual } from "crypto";
// import { errors } from "@/lib/api/response";
// import type { ApiContext } from "@/lib/api/types";
// import crypto from "crypto";
// import { prismadb } from "../db";
// import { checkRateLimit } from "./rate-limit";
// import { logApiRequest } from "../services/audit";

// // -----------------------------------------------------------------------------
// // Hash a raw API key for DB lookup
// // We use HMAC-SHA256 with a server-side secret so even if the DB leaks,
// // raw keys cannot be reconstructed
// // -----------------------------------------------------------------------------
// function hashApiKey(rawKey: string): string {
//   return createHmac("sha256", process.env.API_KEY_HASH_SECRET!)
//     .update(rawKey)
//     .digest("hex");
// }

// // Constant-time string comparison — prevents timing attacks
// function safeEqual(a: string, b: string): boolean {
//   if (a.length !== b.length) return false;
//   return timingSafeEqual(Buffer.from(a), Buffer.from(b));
// }

// // -----------------------------------------------------------------------------
// // Route handler wrapper
// // Use this instead of defining plain Next.js route handlers
// //
// // Usage:
// //   export const GET = withAuth(
// //     async (req, ctx) => { ... },
// //     { requiredScope: "bookings:read" }
// //   );
// // -----------------------------------------------------------------------------
// type AuthenticatedHandler = (
//   req: NextRequest,
//   apiCtx: ApiContext,
//   routeParams: { params: Record<string, string> }
// ) => Promise<NextResponse>;

// interface AuthOptions {
//   requiredScope: string;   // e.g. "bookings:read"
// }

// export function withAuth(handler: AuthenticatedHandler, opts: AuthOptions) {
//   return async (
//     req: NextRequest,
//     routeParams: { params: Record<string, string> }
//   ): Promise<NextResponse> => {
//     const requestId = crypto.randomUUID();
//     const startMs = Date.now();
//     let companyId: string | undefined;
//     let apiKeyId: string | undefined;

//     try {
//       // ── STEP 1: Extract Bearer token ──────────────────────────────────────
//       const authHeader = req.headers.get("authorization") ?? "";
//       if (!authHeader.startsWith("Bearer ")) {
//         return errors.missingKey(requestId);
//       }
//       const rawKey = authHeader.slice(7).trim();
//       if (!rawKey) return errors.missingKey(requestId);

//       // ── STEP 2: Hash and look up key ──────────────────────────────────────
//       const keyHash = hashApiKey(rawKey);
//       const apiKey = await prismadb.companyApiKey.findUnique({
//         where: { keyHash },
//         include: { company: { select: { id: true, slug: true, isActive: true, isSuspended: true } } },
//       });

//       if (!apiKey) return errors.invalidKey(requestId);
//       apiKeyId = apiKey.id;

//       // ── STEP 3: Check lifecycle ────────────────────────────────────────────
//       if (!apiKey.isActive || apiKey.revokedAt) return errors.revokedKey(requestId);
//       if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return errors.expiredKey(requestId);

//       // ── STEP 4: IP allowlist ───────────────────────────────────────────────
//       if (apiKey.allowedIps) {
//         const allowedIps: string[] = JSON.parse(apiKey.allowedIps);
//         if (allowedIps.length > 0) {
//           const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
//             ?? req.headers.get("x-real-ip")
//             ?? "";
//           if (!allowedIps.includes(requestIp)) {
//             return errors.ipBlocked(requestId);
//           }
//         }
//       }

//       // ── STEP 5: Domain allowlist ───────────────────────────────────────────
//       if (apiKey.allowedDomains) {
//         const allowedDomains: string[] = JSON.parse(apiKey.allowedDomains);
//         if (allowedDomains.length > 0) {
//           const origin = req.headers.get("origin") ?? "";
//           const normalised = origin.replace(/\/$/, "");
//           if (!allowedDomains.some((d) => normalised === d || normalised.endsWith(`.${d}`))) {
//             return errors.domainBlocked(requestId);
//           }
//         }
//       }

//       // ── STEP 6: Resolve company from URL slug ─────────────────────────────
//       const slugFromUrl = routeParams.params?.companySlug as string;
//       const company = await prismadb.company.findUnique({
//         where: { slug: slugFromUrl },
//         select: { id: true, slug: true, isActive: true, isSuspended: true },
//       });

//       if (!company || !company.isActive) return errors.companyNotFound(requestId);
//       if (company.isSuspended) return errors.companySuspended(requestId);
//       companyId = company.id;

//       // ── STEP 7: Company mismatch check ────────────────────────────────────
//       // A key for iPaha Ltd must NOT access iPahaStores Ltd data
//       if (!safeEqual(apiKey.company.id, company.id)) {
//         return errors.companyMismatch(requestId);
//       }

//       // ── STEP 8: Rate limiting ─────────────────────────────────────────────
//       const rateLimit = apiKey.rateLimit ?? getPlanRateLimit(/* company.planTier */ "STARTER");
//       const rateLimitResult = await checkRateLimit({
//         key:        `apikey:${apiKey.id}`,
//         limit:      rateLimit,
//         windowSecs: apiKey.rateLimitWindow,
//       });

//       if (!rateLimitResult.allowed) {
//         return errors.rateLimit(requestId, rateLimitResult.resetAt);
//       }

//       // ── STEP 9: Scope check ────────────────────────────────────────────────
//       const keyScopes: string[] = JSON.parse(apiKey.scopes);
//       if (!keyScopes.includes(opts.requiredScope)) {
//         return errors.insufficientScope(requestId, opts.requiredScope);
//       }

//       // ── STEP 10: Build context and call handler ────────────────────────────
//       const apiCtx: ApiContext = {
//         requestId,
//         companyId:   company.id,
//         companySlug: company.slug,
//         apiKeyId:    apiKey.id,
//         scopes:      keyScopes,
//         rateLimitInfo: {
//           limit:     rateLimitResult.limit,
//           remaining: rateLimitResult.remaining,
//           resetAt:   rateLimitResult.resetAt,
//         },
//       };

//       // Fire-and-forget: update key usage stats (don't await — not on critical path)
//       prismadb.companyApiKey.update({
//         where: { id: apiKey.id },
//         data: {
//           lastUsedAt: new Date(),
//           lastUsedIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
//           totalRequests: { increment: 1 },
//         },
//       }).catch(() => {});  // Swallow — usage tracking is non-critical

//       const response = await handler(req, apiCtx, routeParams);

//       // Add rate limit headers to every response
//       response.headers.set("X-RateLimit-Limit",     String(rateLimitResult.limit));
//       response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
//       response.headers.set("X-RateLimit-Reset",     rateLimitResult.resetAt.toISOString());

//       // Log request (fire-and-forget)
//       logApiRequest({
//         requestId,
//         companyId:   company.id,
//         method:      req.method,
//         path:        new URL(req.url).pathname,
//         apiKeyId:    apiKey.id,
//         statusCode:  response.status,
//         responseMs:  Date.now() - startMs,
//         ipAddress:   req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
//         userAgent:   req.headers.get("user-agent") ?? undefined,
//         origin:      req.headers.get("origin") ?? undefined,
//       }).catch(() => {});

//       return response;
//     } catch (err) {
//       // Log unexpected errors with companyId and apiKeyId for debugging
//       console.error(`[API] Internal error — requestId:${requestId}`, err);

//       // Log failed request
//       logApiRequest({
//         requestId,
//         companyId,
//         method:    req.method,
//         path:      new URL(req.url).pathname,
//         apiKeyId,
//         statusCode: 500,
//         responseMs: Date.now() - startMs,
//       }).catch(() => {});

//       return errors.internal(requestId);
//     }
//   };
// }

// // Default rate limits by plan tier (requests per minute)
// function getPlanRateLimit(tier: string): number {
//   const limits: Record<string, number> = {
//     STARTER:    60,
//     GROWTH:     200,
//     PRO:        500,
//     ENTERPRISE: 2000,
//   };
//   return limits[tier] ?? 60;
// }