// =============================================================================
// lib/api/response.ts
// Response factory — every handler uses these, never raw NextResponse.json()
// =============================================================================

import { NextResponse } from "next/server";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorCode,
  PaginationMeta,
} from "./types";

// Standard CORS + request-ID headers added to every response
function baseHeaders(requestId: string, extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-Request-ID": requestId,
    "X-API-Version": "1",
    ...extra,
  };
}

// -----------------------------------------------------------------------------
// SUCCESS RESPONSES
// -----------------------------------------------------------------------------

/**
 * Single resource response
 * @example apiOk(booking, ctx.requestId)
 */
export function apiOk<T>(
  data: T,
  requestId: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, data, requestId },
    { status, headers: baseHeaders(requestId) }
  );
}

/**
 * Paginated list response
 * @example apiList(bookings, total, { page, pageSize }, requestId)
 */
export function apiList<T>(
  data: T[],
  total: number,
  params: { page: number; pageSize: number },
  requestId: string
): NextResponse<ApiSuccessResponse<T[]>> {
  const meta: PaginationMeta = {
    page:       params.page,
    pageSize:   params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize),
    hasMore:    params.page * params.pageSize < total,
  };

  return NextResponse.json(
    { success: true, data, meta, requestId },
    { status: 200, headers: baseHeaders(requestId) }
  );
}

/**
 * 201 Created response
 */
export function apiCreated<T>(
  data: T,
  requestId: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, data, requestId },
    { status: 201, headers: baseHeaders(requestId) }
  );
}

/**
 * 204 No Content — for DELETE operations
 */
export function apiNoContent(requestId: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: baseHeaders(requestId),
  });
}

// -----------------------------------------------------------------------------
// ERROR RESPONSES
// -----------------------------------------------------------------------------

/**
 * Generic error response
 * @example apiError("NOT_FOUND", "Booking not found", 404, requestId)
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  requestId: string,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details && { details }) },
      requestId,
    },
    { status, headers: baseHeaders(requestId) }
  );
}

// Convenience error constructors — keeps handlers DRY

export const errors = {
  missingKey: (rid: string) =>
    apiError("MISSING_API_KEY", "Authorization header required. Use: Bearer <api_key>", 401, rid),

  invalidKey: (rid: string) =>
    apiError("INVALID_API_KEY", "API key is invalid.", 401, rid),

  expiredKey: (rid: string) =>
    apiError("EXPIRED_API_KEY", "API key has expired.", 401, rid),

  revokedKey: (rid: string) =>
    apiError("REVOKED_API_KEY", "API key has been revoked.", 401, rid),

  ipBlocked: (rid: string) =>
    apiError("IP_NOT_ALLOWED", "Request IP address is not permitted for this key.", 403, rid),

  domainBlocked: (rid: string) =>
    apiError("DOMAIN_NOT_ALLOWED", "Request origin is not permitted for this key.", 403, rid),

  insufficientScope: (rid: string, required: string) =>
    apiError("INSUFFICIENT_SCOPE", `This key requires the '${required}' scope.`, 403, rid),

  companyMismatch: (rid: string) =>
    apiError("COMPANY_MISMATCH", "API key is not authorised for this company.", 403, rid),

  companyNotFound: (rid: string) =>
    apiError("COMPANY_NOT_FOUND", "Company not found or inactive.", 404, rid),

  companySuspended: (rid: string) =>
    apiError("COMPANY_SUSPENDED", "This company account is suspended.", 403, rid),

  notFound: (rid: string, resource = "Resource") =>
    apiError("NOT_FOUND", `${resource} not found.`, 404, rid),

  conflict: (rid: string, message = "Resource already exists.") =>
    apiError("CONFLICT", message, 409, rid),

  validation: (rid: string, details: Record<string, string[]>) =>
    apiError("VALIDATION_ERROR", "Request validation failed.", 422, rid, details),

  rateLimit: (rid: string, resetAt: Date) =>
    NextResponse.json(
      { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Rate limit exceeded." }, requestId: rid },
      {
        status: 429,
        headers: {
          ...baseHeaders(rid),
          "Retry-After": String(Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
          "X-RateLimit-Reset": resetAt.toISOString(),
        },
      }
    ),

  internal: (rid: string) =>
    apiError("INTERNAL_ERROR", "An unexpected error occurred. It has been logged.", 500, rid),
};


/**
 * Generic success response (no data wrapper needed)
 * @example apiSuccess({ message: "Code sent" }, requestId)
 */
export function apiSuccess<T>(
  data: T,
  requestId: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, data, requestId },
    { status, headers: baseHeaders(requestId) }
  );
}