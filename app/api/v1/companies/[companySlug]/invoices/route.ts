// =============================================================================
// app/api/v1/companies/[companySlug]/invoices/route.ts
// GET  /api/v1/companies/:slug/invoices  — list invoices
// POST /api/v1/companies/:slug/invoices  — create invoice
// =============================================================================

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiList, apiCreated, errors } from "@/lib/api/response";
import {
  PaginationSchema,
  InvoiceCreateSchema,
  parseSortParam,
} from "@/lib/api/validators";
import { createAuditLog } from "@/lib/services/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";
import { z } from "zod";
import { prismadb } from "@/lib/db";

export const OPTIONS = handlePreflight;

const InvoiceFilterSchema = PaginationSchema.extend({
  status:      z.enum(["DRAFT","SENT","VIEWED","PAID","OVERDUE","CANCELLED"]).optional(),
  clientEmail: z.string().email().optional(),
});

export const GET = withAuth(
  async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const parsed = InvoiceFilterSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { page, pageSize, sort, status, clientEmail } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where = {
      companyId: ctx.companyId,
      ...(status      && { status }),
      ...(clientEmail && { clientEmail: { contains: clientEmail } }),
    };

    const [invoices, total] = await Promise.all([
      prismadb.invoice.findMany({
        where,
        orderBy: parseSortParam(sort),
        skip,
        take: pageSize,
        select: {
          id: true, invoiceNumber: true, clientName: true, clientEmail: true,
          status: true, subtotal: true, taxRate: true, taxAmount: true,
          total: true, currency: true, issuedAt: true, dueAt: true,
          paidAt: true, createdAt: true, updatedAt: true,
        },
      }),
      prismadb.invoice.count({ where }),
    ]);

    return apiList(invoices, total, { page, pageSize }, ctx.requestId);
  },
  { requiredScope: "invoices:read" }
);

export const POST = withAuth(
  async (req, ctx) => {
    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = InvoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const data = parsed.data;

    // Prevent duplicate invoice number within company
    const dup = await prismadb.invoice.findUnique({
      where: { companyId_invoiceNumber: { companyId: ctx.companyId, invoiceNumber: data.invoiceNumber } },
    });
    if (dup) {
      return errors.conflict(ctx.requestId, `Invoice number ${data.invoiceNumber} already exists.`);
    }

    // Auto-calculate totals from line items
    const subtotal = data.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice, 0
    );
    const taxAmount = subtotal * (data.taxRate / 100);
    const total     = subtotal + taxAmount;

    const invoice = await prismadb.invoice.create({
      data: {
        companyId:     ctx.companyId,
        invoiceNumber: data.invoiceNumber,
        clientName:    data.clientName,
        clientEmail:   data.clientEmail,
        clientAddress: data.clientAddress,
        lineItems:     JSON.stringify(data.lineItems),
        subtotal,
        taxRate:       data.taxRate,
        taxAmount,
        total,
        currency:      data.currency,
        dueAt:         data.dueAt ? new Date(data.dueAt) : undefined,
        notes:         data.notes,
        metadata:      data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    createAuditLog({
      companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
      action: "invoice.created", entityType: "invoice", entityId: invoice.id,
      after: invoice, requestId: ctx.requestId,
    }).catch(() => {});

    dispatchWebhookEvent({
      companyId: ctx.companyId, companySlug: ctx.companySlug,
      eventType: "invoice.created", entityType: "invoice",
      entityId: invoice.id, data: { ...invoice, lineItems: data.lineItems },
    }).catch(() => {});

    return apiCreated(
      { ...invoice, lineItems: data.lineItems },
      ctx.requestId
    );
  },
  { requiredScope: "invoices:write" }
);
