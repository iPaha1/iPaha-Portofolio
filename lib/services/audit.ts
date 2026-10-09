// =============================================================================
// lib/services/audit.ts
// Audit log and API request log helpers
// All functions are fire-and-forget safe (never throw)
// =============================================================================

import { prismadb } from "../db";



// -----------------------------------------------------------------------------
// AUDIT LOG
// Records who did what to which resource
// -----------------------------------------------------------------------------
interface AuditLogInput {
  companyId:   string;
  actorType:   "api_key" | "admin_user" | "system";
  actorId:     string;
  actorName?:  string;
  action:      string;         // "booking.created"
  entityType?: string;         // "booking"
  entityId?:   string;
  ipAddress?:  string;
  userAgent?:  string;
  requestId?:  string;
  before?:     unknown;
  after?:      unknown;
  metadata?:   unknown;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prismadb.companyAuditLog.create({
      data: {
        companyId:   input.companyId,
        actorType:   input.actorType,
        actorId:     input.actorId,
        actorName:   input.actorName,
        action:      input.action,
        entityType:  input.entityType,
        entityId:    input.entityId,
        ipAddress:   input.ipAddress,
        userAgent:   input.userAgent,
        requestId:   input.requestId,
        before:      input.before ? JSON.stringify(input.before) : undefined,
        after:       input.after  ? JSON.stringify(input.after)  : undefined,
        metadata:    input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
  } catch (err) {
    // Never throw from audit — don't let logging break the main request
    console.error("[AuditLog] Failed to write:", err);
  }
}

// -----------------------------------------------------------------------------
// API REQUEST LOG
// Records every inbound API request for analytics and debugging
// -----------------------------------------------------------------------------
interface ApiRequestLogInput {
  requestId:    string;
  companyId?:   string;
  method:       string;
  path:         string;
  queryParams?: Record<string, unknown>;
  apiKeyId?:    string;
  statusCode:   number;
  responseMs:   number;
  errorCode?:   string;
  ipAddress?:   string;
  userAgent?:   string;
  origin?:      string;
}

export async function logApiRequest(input: ApiRequestLogInput): Promise<void> {
  try {
    await prismadb.apiRequestLog.create({
      data: {
        requestId:   input.requestId,
        companyId:   input.companyId,
        method:      input.method,
        path:        input.path,
        queryParams: input.queryParams ? JSON.stringify(input.queryParams) : undefined,
        apiKeyId:    input.apiKeyId,
        statusCode:  input.statusCode,
        responseMs:  input.responseMs,
        errorCode:   input.errorCode,
        ipAddress:   input.ipAddress,
        userAgent:   input.userAgent,
        origin:      input.origin,
      },
    });
  } catch (err) {
    console.error("[RequestLog] Failed to write:", err);
  }
}