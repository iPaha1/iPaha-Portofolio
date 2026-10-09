// =============================================================================
// lib/middleware/portal-auth.ts
// Updated for Next.js 15+ (params is now a Promise)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prismadb } from "@/lib/db";
import { errors } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/types";
import crypto from "crypto";

// Portal session context
export interface PortalContext {
  requestId: string;
  companyId: string;
  companySlug: string;
  contactId: string;
  email: string;
  sessionId: string;
}

// Public company context
export interface PublicCompanyContext {
  requestId: string;
  companyId: string;
  companySlug: string;
}

// Hash token helper
function hashToken(raw: string): string {
  return createHmac("sha256", process.env.API_KEY_HASH_SECRET!)
    .update(raw)
    .digest("hex");
}

// -----------------------------------------------------------------------------
// withPortalAuth — requires logged-in portal user
// -----------------------------------------------------------------------------
type PortalHandler = (
  req: NextRequest,
  portalCtx: PortalContext,
  routeParams: { params: Promise<{ companySlug: string }> }  // ← Updated type
) => Promise<NextResponse>;

export function withPortalAuth(handler: PortalHandler) {
  return async (
    req: NextRequest,
    routeParams: { params: Promise<{ companySlug: string }> }  // ← params is Promise
  ): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();

    try {
      const authHeader = req.headers.get("authorization") ?? "";
      const portalHeader = req.headers.get("x-portal-token") ?? "";
      const rawToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : portalHeader.trim();

      if (!rawToken) {
        return errors.missingKey(requestId);
      }

      const tokenHash = hashToken(rawToken);

      const session = await prismadb.portalSession.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          companyId: true,
          contactId: true,
          email: true,
          expiresAt: true,
        },
      });

      if (!session) return errors.invalidKey(requestId);
      if (session.expiresAt < new Date()) return errors.expiredKey(requestId);

      // === KEY FIX ===
      const params = await routeParams.params;                    // ← Await here
      const slugFromUrl = params.companySlug as string;

      if (!slugFromUrl) return errors.companyNotFound(requestId);

      const company = await prismadb.company.findUnique({
        where: { slug: slugFromUrl },
        select: { id: true, slug: true, isActive: true },
      });

      if (!company || !company.isActive) return errors.companyNotFound(requestId);
      if (company.id !== session.companyId) return errors.companyMismatch(requestId);

      // Touch lastUsedAt
      prismadb.portalSession.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      const portalCtx: PortalContext = {
        requestId,
        companyId: session.companyId,
        companySlug: company.slug,
        contactId: session.contactId,
        email: session.email,
        sessionId: session.id,
      };

      return handler(req, portalCtx, { params: Promise.resolve(params) }); // Pass resolved params if needed
    } catch (err) {
      console.error("[PortalAuth] Error:", err);
      return errors.internal(requestId);
    }
  };
}

// -----------------------------------------------------------------------------
// withPublicCompany — for send-code, verify, etc.
// -----------------------------------------------------------------------------
type PublicHandler = (
  req: NextRequest,
  companyCtx: PublicCompanyContext,
  routeParams: { params: Promise<{ companySlug: string }> }  // ← Updated type
) => Promise<NextResponse>;

export function withPublicCompany(handler: PublicHandler) {
  return async (
    req: NextRequest,
    routeParams: { params: Promise<{ companySlug: string }> }  // ← params is Promise
  ): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();

    try {
      // === KEY FIX ===
      const params = await routeParams.params;                    // ← Await here
      const slugFromUrl = params.companySlug as string;

      if (!slugFromUrl) return errors.companyNotFound(requestId);

      const company = await prismadb.company.findUnique({
        where: { slug: slugFromUrl },
        select: { id: true, slug: true, isActive: true, isSuspended: true },
      });

      if (!company || !company.isActive) return errors.companyNotFound(requestId);
      if (company.isSuspended) return errors.companySuspended(requestId);

      const companyCtx: PublicCompanyContext = {
        requestId,
        companyId: company.id,
        companySlug: company.slug,
      };

      return handler(req, companyCtx, { params: Promise.resolve(params) });
    } catch (err) {
      console.error("[PublicCompany] Error:", err);
      return errors.internal(requestId);
    }
  };
}