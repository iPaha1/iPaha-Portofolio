// =============================================================================
// lib/api/types.ts
// Shared types for the entire API layer — import these everywhere
// =============================================================================

import type { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// API CONTEXT
// Populated by middleware and passed to every handler
// -----------------------------------------------------------------------------
export interface ApiContext {
  requestId: string;          // UUID — echoed in X-Request-ID response header
  companyId: string;          // Resolved from slug — used to scope ALL DB queries
  companySlug: string;        // Original slug from URL
  apiKeyId: string;           // ID of the authenticated key
  scopes: string[];           // e.g. ["bookings:read", "bookings:write"]
  rateLimitInfo: {
    limit: number;
    remaining: number;
    resetAt: Date;
  };
}

// Attach context to Next.js request
export interface AuthenticatedRequest extends NextRequest {
  apiContext?: ApiContext;
}

// -----------------------------------------------------------------------------
// RESPONSE ENVELOPES
// Every API response wraps data in a consistent structure
// -----------------------------------------------------------------------------
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string[]>;   // Validation errors: { field: [messages] }
  };
  requestId: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// -----------------------------------------------------------------------------
// ERROR CODES
// Machine-readable — clients should branch on these, not on HTTP status
// -----------------------------------------------------------------------------
export type ApiErrorCode =
  // Auth
  | "MISSING_API_KEY"           // No Authorization header
  | "INVALID_API_KEY"           // Key not found / hash mismatch
  | "EXPIRED_API_KEY"           // Key past expiresAt
  | "REVOKED_API_KEY"           // Key manually revoked
  | "IP_NOT_ALLOWED"            // Request IP not in allowedIps
  | "DOMAIN_NOT_ALLOWED"        // Request Origin not in allowedDomains
  | "INSUFFICIENT_SCOPE"        // Key lacks required permission
  | "COMPANY_MISMATCH"          // Key belongs to different company than slug
  | "COMPANY_NOT_FOUND"         // Slug doesn't match any active company
  | "COMPANY_SUSPENDED"         // Company account suspended

  // Request
  | "VALIDATION_ERROR"          // Body/query failed schema validation
  | "NOT_FOUND"                 // Resource not found (or not in this company)
  | "CONFLICT"                  // Duplicate resource
  | "METHOD_NOT_ALLOWED"

  // Rate limiting
  | "RATE_LIMIT_EXCEEDED"       // Too many requests

  // Server
  | "INTERNAL_ERROR"            // Unexpected server error (log and alert)

// -----------------------------------------------------------------------------
// PERMISSION SCOPES
// Format: "resource:action"
// Add new scopes here as you build new resource endpoints
// -----------------------------------------------------------------------------
export const SCOPES = {
  // Bookings
  BOOKINGS_READ:    "bookings:read",
  BOOKINGS_WRITE:   "bookings:write",
  BOOKINGS_DELETE:  "bookings:delete",

  // Contacts
  CONTACTS_READ:    "contacts:read",
  CONTACTS_WRITE:   "contacts:write",
  CONTACTS_DELETE:  "contacts:delete",

  // Invoices
  INVOICES_READ:    "invoices:read",
  INVOICES_WRITE:   "invoices:write",

  // Media
  MEDIA_READ:       "media:read",
  MEDIA_WRITE:      "media:write",

  // Forms
  FORMS_READ:       "forms:read",
  FORMS_WRITE:      "forms:write",

  // Webhooks
  WEBHOOKS_READ:    "webhooks:read",
  WEBHOOKS_WRITE:   "webhooks:write",
} as const;

export type Scope = typeof SCOPES[keyof typeof SCOPES];

// Convenience: which HTTP methods require which action scope
export const METHOD_SCOPE_MAP: Record<string, "read" | "write" | "delete"> = {
  GET:    "read",
  HEAD:   "read",
  POST:   "write",
  PUT:    "write",
  PATCH:  "write",
  DELETE: "delete",
};

// -----------------------------------------------------------------------------
// QUERY PARAMS
// Standard list endpoint parameters — used by all GET list routes
// -----------------------------------------------------------------------------
export interface ListQueryParams {
  page?:     number;    // default: 1
  pageSize?: number;    // default: 20, max: 100
  sort?:     string;    // e.g. "createdAt" | "-createdAt" (prefix - = desc)
  search?:   string;    // Full-text search on relevant fields
  include?:  string[];  // Related resources to include
  fields?:   string[];  // Sparse fieldsets — only return these fields
  [key: string]: unknown; // Resource-specific filters (status, email, etc.)
}

// -----------------------------------------------------------------------------
// WEBHOOK PAYLOAD
// Shape of the JSON posted to registered webhook URLs
// -----------------------------------------------------------------------------
export interface WebhookPayload {
  id:         string;       // Unique delivery ID
  eventType:  string;       // "booking.created"
  companyId:  string;
  companySlug: string;
  timestamp:  string;       // ISO 8601
  data:       unknown;      // The resource that changed
}