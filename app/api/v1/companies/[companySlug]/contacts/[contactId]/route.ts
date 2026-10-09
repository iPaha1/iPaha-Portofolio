// =============================================================================
// app/api/v1/companies/[companySlug]/contacts/[contactId]/route.ts
// GET    /api/v1/companies/:slug/contacts/:id
// PATCH  /api/v1/companies/:slug/contacts/:id
// DELETE /api/v1/companies/:slug/contacts/:id
// =============================================================================

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiOk, apiNoContent, errors } from "@/lib/api/response";
import { ContactUpdateSchema } from "@/lib/api/validators";
import { createAuditLog } from "@/lib/services/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";
import { prismadb } from "@/lib/db";

export const OPTIONS = handlePreflight;

export const GET = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const contact = await prismadb.companyContact.findFirst({
      where: { id: params.contactId, companyId: ctx.companyId },
    });
    if (!contact) return errors.notFound(ctx.requestId, "Contact");

    const { companyId: _cid, ...safe } = contact;
    return apiOk(
      { ...safe, tags: safe.tags ? JSON.parse(safe.tags) : [] },
      ctx.requestId
    );
  },
  { requiredScope: "contacts:read" }
);

export const PATCH = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const existing = await prismadb.companyContact.findFirst({
      where: { id: params.contactId, companyId: ctx.companyId },
    });
    if (!existing) return errors.notFound(ctx.requestId, "Contact");

    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = ContactUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { tags, metadata, ...updateData } = parsed.data;

    // If updating email, check uniqueness within company
    if (updateData.email && updateData.email !== existing.email) {
      const dup = await prismadb.companyContact.findUnique({
        where: { companyId_email: { companyId: ctx.companyId, email: updateData.email } },
      });
      if (dup) return errors.conflict(ctx.requestId, "Email already in use by another contact.");
    }

    const updated = await prismadb.companyContact.update({
      where: { id: params.contactId },
      data: {
        ...updateData,
        ...(tags     !== undefined ? { tags:     JSON.stringify(tags) }     : {}),
        ...(metadata !== undefined ? { metadata: JSON.stringify(metadata) } : {}),
      },
    });

    createAuditLog({
      companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
      action: "contact.updated", entityType: "contact", entityId: updated.id,
      before: existing, after: updated, requestId: ctx.requestId,
    }).catch(() => {});

    dispatchWebhookEvent({
      companyId: ctx.companyId, companySlug: ctx.companySlug,
      eventType: "contact.updated", entityType: "contact",
      entityId: updated.id, data: updated,
    }).catch(() => {});

    const { companyId: _cid, ...safe } = updated;
    return apiOk(
      { ...safe, tags: safe.tags ? JSON.parse(safe.tags) : [] },
      ctx.requestId
    );
  },
  { requiredScope: "contacts:write" }
);

export const DELETE = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const existing = await prismadb.companyContact.findFirst({
      where: { id: params.contactId, companyId: ctx.companyId },
    });
    if (!existing) return errors.notFound(ctx.requestId, "Contact");

    await prismadb.companyContact.delete({ where: { id: params.contactId } });

    createAuditLog({
      companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
      action: "contact.deleted", entityType: "contact", entityId: params.contactId,
      before: existing, requestId: ctx.requestId,
    }).catch(() => {});

    return apiNoContent(ctx.requestId);
  },
  { requiredScope: "contacts:delete" }
);
