// =============================================================================
// app/api/v1/companies/[companySlug]/invoices/[invoiceId]/route.ts
// GET    /api/v1/companies/:slug/invoices/:id
// PATCH  /api/v1/companies/:slug/invoices/:id  — update status, mark paid
// =============================================================================

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiOk, errors } from "@/lib/api/response";
import { InvoiceUpdateSchema } from "@/lib/api/validators";
import { createAuditLog } from "@/lib/services/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";
import { prismadb } from "@/lib/db";

export const OPTIONS = handlePreflight;

export const GET = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const invoice = await prismadb.invoice.findFirst({
      where: { id: params.invoiceId, companyId: ctx.companyId },
    });
    if (!invoice) return errors.notFound(ctx.requestId, "Invoice");

    const { companyId: _cid, ...safe } = invoice;
    return apiOk(
      { ...safe, lineItems: JSON.parse(invoice.lineItems) },
      ctx.requestId
    );
  },
  { requiredScope: "invoices:read" }
);

export const PATCH = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const existing = await prismadb.invoice.findFirst({
      where: { id: params.invoiceId, companyId: ctx.companyId },
    });
    if (!existing) return errors.notFound(ctx.requestId, "Invoice");

    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = InvoiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { paidAt, ...updateData } = parsed.data;

    const updated = await prismadb.invoice.update({
      where: { id: params.invoiceId },
      data: {
        ...updateData,
        ...(paidAt ? { paidAt: new Date(paidAt), status: "PAID" } : {}),
      },
    });

    // Determine specific event type for paid/overdue
    const eventType =
      updated.status === "PAID"    ? "invoice.paid"    :
      updated.status === "OVERDUE" ? "invoice.overdue" :
      "invoice.updated";

    createAuditLog({
      companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
      action: eventType, entityType: "invoice", entityId: updated.id,
      before: existing, after: updated, requestId: ctx.requestId,
    }).catch(() => {});

    dispatchWebhookEvent({
      companyId: ctx.companyId, companySlug: ctx.companySlug,
      eventType, entityType: "invoice", entityId: updated.id, data: updated,
    }).catch(() => {});

    const { companyId: _cid, ...safe } = updated;
    return apiOk(
      { ...safe, lineItems: JSON.parse(updated.lineItems) },
      ctx.requestId
    );
  },
  { requiredScope: "invoices:write" }
);
