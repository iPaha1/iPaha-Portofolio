// =============================================================================
// app/api/v1/companies/[companySlug]/bookings/[bookingId]/route.ts
// GET    /api/v1/companies/:slug/bookings/:id  — get single booking
// PATCH  /api/v1/companies/:slug/bookings/:id  — update booking
// DELETE /api/v1/companies/:slug/bookings/:id  — cancel booking
// =============================================================================

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiOk, apiNoContent, errors } from "@/lib/api/response";
import { BookingUpdateSchema } from "@/lib/api/validators";
import { prismadb } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";


export const OPTIONS = handlePreflight;

// ── GET — Single booking ─────────────────────────────────────────────────────
export const GET = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const booking = await prismadb.booking.findFirst({
      where: {
        id:        params.bookingId,
        companyId: ctx.companyId,   // TENANT ISOLATION
      },
    });

    if (!booking) return errors.notFound(ctx.requestId, "Booking");

    // Strip companyId from response — redundant for the client
    const { companyId: _cid, ...safeBooking } = booking;
    return apiOk(safeBooking, ctx.requestId);
  },
  { requiredScope: "bookings:read" }
);

// ── PATCH — Update booking ───────────────────────────────────────────────────
export const PATCH = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    // Verify the booking exists and belongs to this company
    const existing = await prismadb.booking.findFirst({
      where: { id: params.bookingId, companyId: ctx.companyId },
    });
    if (!existing) return errors.notFound(ctx.requestId, "Booking");

    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = BookingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { metadata, ...updateData } = parsed.data;

    const updated = await prismadb.booking.update({
      where: { id: params.bookingId },
      data: {
        ...updateData,
        ...(updateData.confirmedDate
          ? { confirmedDate: new Date(updateData.confirmedDate) }
          : {}),
        ...(metadata !== undefined
          ? { metadata: JSON.stringify(metadata) }
          : {}),
      },
    });

    // Determine event type (cancelled is a special case)
    const eventType = updated.status === "CANCELLED"
      ? "booking.cancelled"
      : "booking.updated";

    createAuditLog({
      companyId:  ctx.companyId,
      actorType:  "api_key",
      actorId:    ctx.apiKeyId,
      action:     eventType,
      entityType: "booking",
      entityId:   updated.id,
      before:     existing,
      after:      updated,
      requestId:  ctx.requestId,
    }).catch(() => {});

    dispatchWebhookEvent({
      companyId:   ctx.companyId,
      companySlug: ctx.companySlug,
      eventType,
      entityType:  "booking",
      entityId:    updated.id,
      data:        updated,
    }).catch(() => {});

    const { companyId: _cid, ...safe } = updated;
    return apiOk(safe, ctx.requestId);
  },
  { requiredScope: "bookings:write" }
);

// ── DELETE — Cancel booking ──────────────────────────────────────────────────
export const DELETE = withAuth(
  async (req, ctx, { params: paramsPromise }) => {
    const params = await paramsPromise;
    const existing = await prismadb.booking.findFirst({
      where: { id: params.bookingId, companyId: ctx.companyId },
    });
    if (!existing) return errors.notFound(ctx.requestId, "Booking");

    // Soft delete: set status to CANCELLED rather than hard delete
    await prismadb.booking.update({
      where: { id: params.bookingId },
      data:  { status: "CANCELLED" },
    });

    createAuditLog({
      companyId:  ctx.companyId,
      actorType:  "api_key",
      actorId:    ctx.apiKeyId,
      action:     "booking.cancelled",
      entityType: "booking",
      entityId:   params.bookingId,
      requestId:  ctx.requestId,
    }).catch(() => {});

    return apiNoContent(ctx.requestId);
  },
  { requiredScope: "bookings:delete" }
);