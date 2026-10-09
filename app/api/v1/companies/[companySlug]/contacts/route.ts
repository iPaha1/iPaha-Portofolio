// =============================================================================
// app/api/v1/companies/[companySlug]/contacts/route.ts
// GET  /api/v1/companies/:slug/contacts  — list contacts
// POST /api/v1/companies/:slug/contacts  — create contact
// =============================================================================


import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiList, apiCreated, errors } from "@/lib/api/response";
import {
  ContactFilterSchema,
  ContactCreateSchema,
  parseSortParam,
} from "@/lib/api/validators";
import { createAuditLog } from "@/lib/services/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";
import { prismadb } from "@/lib/db";

export const OPTIONS = handlePreflight;

export const GET = withAuth(
  async (req, ctx, routeParams) => {
    // routeParams.params is a Promise in Next.js 15
    const { searchParams } = new URL(req.url);

    const parsed = ContactFilterSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { page, pageSize, sort, search, company, tag } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where = {
      companyId: ctx.companyId,
      ...(search && {
        OR: [
          { firstName:  { contains: search } },
          { lastName:   { contains: search } },
          { email:      { contains: search } },
          { company:    { contains: search } },
        ],
      }),
      ...(company && { company: { contains: company } }),
      ...(tag && { tags: { contains: tag } }),
    };

    const [contacts, total] = await Promise.all([
      prismadb.companyContact.findMany({
        where,
        orderBy: parseSortParam(sort),
        skip,
        take: pageSize,
        select: {
          id: true, firstName: true, lastName: true, email: true,
          phone: true, company: true, jobTitle: true, notes: true,
          tags: true, source: true, isActive: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prismadb.companyContact.count({ where }),
    ]);

    const normalised = contacts.map((c) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
    }));

    return apiList(normalised, total, { page, pageSize }, ctx.requestId);
  },
  { requiredScope: "contacts:read" }
);

export const POST = withAuth(
  async (req, ctx, routeParams) => {
    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = ContactCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { tags, metadata, ...data } = parsed.data;

    const existing = await prismadb.companyContact.findUnique({
      where: { companyId_email: { companyId: ctx.companyId, email: data.email } },
    });
    if (existing) {
      return errors.conflict(ctx.requestId, "A contact with this email already exists.");
    }

    const contact = await prismadb.companyContact.create({
      data: {
        ...data,
        companyId: ctx.companyId,
        tags:      tags     ? JSON.stringify(tags)     : undefined,
        metadata:  metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    createAuditLog({
      companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
      action: "contact.created", entityType: "contact", entityId: contact.id,
      after: contact, requestId: ctx.requestId,
    }).catch(() => {});

    dispatchWebhookEvent({
      companyId: ctx.companyId, companySlug: ctx.companySlug,
      eventType: "contact.created", entityType: "contact",
      entityId: contact.id, data: { ...contact, tags: tags ?? [] },
    }).catch(() => {});

    return apiCreated({ ...contact, tags: tags ?? [] }, ctx.requestId);
  },
  { requiredScope: "contacts:write" }
);




// // =============================================================================
// // app/api/v1/companies/[companySlug]/contacts/route.ts
// // GET  /api/v1/companies/:slug/contacts  — list contacts
// // POST /api/v1/companies/:slug/contacts  — create contact
// // =============================================================================

// import { NextRequest } from "next/server";
// import { withAuth } from "@/lib/middleware/authenticate";
// import { handlePreflight } from "@/lib/middleware/rate-limit";
// import { apiList, apiCreated, errors } from "@/lib/api/response";
// import {
//   ContactFilterSchema,
//   ContactCreateSchema,
//   parseSortParam,
// } from "@/lib/api/validators";
// import { createAuditLog } from "@/lib/services/audit";
// import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";
// import { prismadb } from "@/lib/db";

// export const OPTIONS = handlePreflight;

// export const GET = withAuth(
//   async (req, ctx) => {
//     const { searchParams } = new URL(req.url);

//     const parsed = ContactFilterSchema.safeParse(
//       Object.fromEntries(searchParams.entries())
//     );
//     if (!parsed.success) {
//       return errors.validation(
//         ctx.requestId,
//         parsed.error.flatten().fieldErrors as Record<string, string[]>
//       );
//     }

//     const { page, pageSize, sort, search, company, tag } = parsed.data;
//     const skip = (page - 1) * pageSize;

//     const where = {
//       companyId: ctx.companyId,
//       ...(search && {
//         OR: [
//           { firstName:  { contains: search } },
//           { lastName:   { contains: search } },
//           { email:      { contains: search } },
//           { company:    { contains: search } },
//         ],
//       }),
//       ...(company && { company: { contains: company } }),
//       ...(tag && { tags: { contains: tag } }),
//     };

//     const [contacts, total] = await Promise.all([
//       prismadb.companyContact.findMany({
//         where,
//         orderBy: parseSortParam(sort),
//         skip,
//         take: pageSize,
//         select: {
//           id: true, firstName: true, lastName: true, email: true,
//           phone: true, company: true, jobTitle: true, notes: true,
//           tags: true, source: true, isActive: true,
//           createdAt: true, updatedAt: true,
//         },
//       }),
//       prismadb.companyContact.count({ where }),
//     ]);

//     // Deserialise tags from JSON string → array
//     const normalised = contacts.map((c) => ({
//       ...c,
//       tags: c.tags ? JSON.parse(c.tags) : [],
//     }));

//     return apiList(normalised, total, { page, pageSize }, ctx.requestId);
//   },
//   { requiredScope: "contacts:read" }
// );

// export const POST = withAuth(
//   async (req, ctx) => {
//     let body: unknown;
//     try { body = await req.json(); }
//     catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

//     const parsed = ContactCreateSchema.safeParse(body);
//     if (!parsed.success) {
//       return errors.validation(
//         ctx.requestId,
//         parsed.error.flatten().fieldErrors as Record<string, string[]>
//       );
//     }

//     const { tags, metadata, ...data } = parsed.data;

//     // Prevent duplicate email within company
//     const existing = await prismadb.companyContact.findUnique({
//       where: { companyId_email: { companyId: ctx.companyId, email: data.email } },
//     });
//     if (existing) {
//       return errors.conflict(ctx.requestId, "A contact with this email already exists.");
//     }

//     const contact = await prismadb.companyContact.create({
//       data: {
//         ...data,
//         companyId: ctx.companyId,
//         tags:      tags     ? JSON.stringify(tags)     : undefined,
//         metadata:  metadata ? JSON.stringify(metadata) : undefined,
//       },
//     });

//     createAuditLog({
//       companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
//       action: "contact.created", entityType: "contact", entityId: contact.id,
//       after: contact, requestId: ctx.requestId,
//     }).catch(() => {});

//     dispatchWebhookEvent({
//       companyId: ctx.companyId, companySlug: ctx.companySlug,
//       eventType: "contact.created", entityType: "contact",
//       entityId: contact.id, data: { ...contact, tags: tags ?? [] },
//     }).catch(() => {});

//     return apiCreated({ ...contact, tags: tags ?? [] }, ctx.requestId);
//   },
//   { requiredScope: "contacts:write" }
// );
