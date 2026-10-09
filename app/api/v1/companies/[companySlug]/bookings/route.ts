// app/api/v1/companies/[companySlug]/bookings/route.ts
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { apiCreated, errors } from "@/lib/api/response";
import { prismadb } from "@/lib/db";
import { BookingLocation } from "@/lib/generated/prisma/enums";


export const POST = withAuth(
  async (req, ctx, routeParams) => {
    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    // Cast body once for type safety
    const bodyRecord = body as Record<string, unknown>;

    // Basic validation
    const { clientName, clientEmail, clientMessage, serviceType, location, metadata } = bodyRecord;
    
    if (!clientName || !clientEmail) {
      return errors.validation(ctx.requestId, {
        clientName: ["Client name is required"],
        clientEmail: ["Client email is required"],
      });
    }
    console.log("Creating booking with data:", bodyRecord); // Debug log to check incoming data

    const booking = await prismadb.booking.create({
      data: {
        companyId: ctx.companyId,
        clientName: String(clientName),
        clientEmail: String(clientEmail),
        clientPhone: bodyRecord.clientPhone ? String(bodyRecord.clientPhone) : undefined,
        clientCompany: bodyRecord.clientCompany ? String(bodyRecord.clientCompany) : undefined,
        clientMessage: clientMessage ? String(clientMessage) : undefined,
        serviceType: serviceType ? String(serviceType) : "consultation",
        location: location ? (location as BookingLocation) : BookingLocation.VIDEO_CALL,
        status: "PENDING",
        source: bodyRecord.source ? String(bodyRecord.source) : "api",
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
    console.log("Created booking:", booking); // Debug log to check created booking

    return apiCreated(booking, ctx.requestId);
  },
  { requiredScope: "bookings:write" }
);



// // =============================================================================
// // app/api/v1/companies/[companySlug]/bookings/route.ts
// // GET  /api/v1/companies/:slug/bookings  — list bookings
// // POST /api/v1/companies/:slug/bookings  — create booking
// // =============================================================================

// import { NextRequest } from "next/server";
// import { withAuth } from "@/lib/middleware/authenticate";
// import { handlePreflight } from "@/lib/middleware/rate-limit";
// import { apiList, apiCreated, errors } from "@/lib/api/response";
// import {
//   BookingFilterSchema,
//   BookingCreateSchema,
//   parseSortParam,
// } from "@/lib/api/validators";
// import { prismadb } from "@/lib/db";
// import { createAuditLog } from "@/lib/services/audit";
// import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";


// // ── CORS preflight ──────────────────────────────────────────────────────────
// export const OPTIONS = handlePreflight;

// // ── GET — List bookings ──────────────────────────────────────────────────────
// export const GET = withAuth(
//   async (req, ctx) => {
//     const { searchParams } = new URL(req.url);

//     // Parse and validate query params
//     const parsed = BookingFilterSchema.safeParse(
//       Object.fromEntries(searchParams.entries())
//     );
//     if (!parsed.success) {
//       return errors.validation(
//         ctx.requestId,
//         parsed.error.flatten().fieldErrors as Record<string, string[]>
//       );
//     }

//     const { page, pageSize, sort, search, status, email, from, to } = parsed.data;
//     const skip = (page - 1) * pageSize;

//     // Build WHERE clause — always scope to companyId
//     const where = {
//       companyId: ctx.companyId,   // TENANT ISOLATION — always first
//       ...(status && { status }),
//       ...(email  && { clientEmail: { contains: email } }),
//       ...(search && {
//         OR: [
//           { clientName:  { contains: search } },
//           { clientEmail: { contains: search } },
//           { clientCompany: { contains: search } },
//         ],
//       }),
//       ...(from || to
//         ? {
//             createdAt: {
//               ...(from && { gte: new Date(from) }),
//               ...(to   && { lte: new Date(to) }),
//             },
//           }
//         : {}),
//     };

//     const [bookings, total] = await Promise.all([
//       prismadb.booking.findMany({
//         where,
//         orderBy: parseSortParam(sort),
//         skip,
//         take: pageSize,
//         select: {
//           id:            true,
//           clientName:    true,
//           clientEmail:   true,
//           clientPhone:   true,
//           clientCompany: true,
//           clientMessage: true,
//           serviceType:   true,
//           preferredDate: true,
//           confirmedDate: true,
//           duration:      true,
//           location:      true,
//           meetingUrl:    true,
//           status:        true,
//           source:        true,
//           createdAt:     true,
//           updatedAt:     true,
//           // companyId intentionally omitted — client already knows their company
//         },
//       }),
//       prismadb.booking.count({ where }),
//     ]);

//     return apiList(bookings, total, { page, pageSize }, ctx.requestId);
//   },
//   { requiredScope: "bookings:read" }
// );

// // ── POST — Create booking ────────────────────────────────────────────────────
// export const POST = withAuth(
//   async (req, ctx) => {
//     // Parse and validate body
//     let body: unknown;
//     try {
//       body = await req.json();
//     } catch {
//       return errors.validation(ctx.requestId, { body: ["Invalid JSON"] });
//     }

//     const parsed = BookingCreateSchema.safeParse(body);
//     if (!parsed.success) {
//       return errors.validation(
//         ctx.requestId,
//         parsed.error.flatten().fieldErrors as Record<string, string[]>
//       );
//     }

//     const { metadata, ...data } = parsed.data;

//     const booking = await prismadb.booking.create({
//       data: {
//         ...data,
//         companyId:   ctx.companyId,   // TENANT SCOPE
//         preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
//         metadata:    metadata ? JSON.stringify(metadata) : undefined,
//       },
//     });

//     // Audit log (fire-and-forget)
//     createAuditLog({
//       companyId:  ctx.companyId,
//       actorType:  "api_key",
//       actorId:    ctx.apiKeyId,
//       action:     "booking.created",
//       entityType: "booking",
//       entityId:   booking.id,
//       after:      booking,
//       requestId:  ctx.requestId,
//     }).catch(() => {});

//     // Dispatch webhook event (fire-and-forget)
//     dispatchWebhookEvent({
//       companyId:   ctx.companyId,
//       companySlug: ctx.companySlug,
//       eventType:   "booking.created",
//       entityType:  "booking",
//       entityId:    booking.id,
//       data:        booking,
//     }).catch(() => {});

//     return apiCreated(booking, ctx.requestId);
//   },
//   { requiredScope: "bookings:write" }
// );