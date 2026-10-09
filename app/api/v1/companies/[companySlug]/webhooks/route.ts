// app/api/v1/companies/[companySlug]/webhooks/route.ts
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { WebhookCreateSchema } from "@/lib/api/validators";
import { apiOk, apiList, apiCreated, errors } from "@/lib/api/response";
import { prismadb } from "@/lib/db";
import { withAuth } from "@/lib/middleware/authenticate";

// GET — list webhook endpoints (safe — no signing secrets)
export const GET = withAuth(
  async (req: NextRequest, ctx: any) => {
    const endpoints = await prismadb.webhookEndpoint.findMany({
      where: { companyId: ctx.companyId },
      select: {
        id: true, url: true, description: true, events: true,
        isActive: true, totalDeliveries: true, totalFailures: true,
        lastDeliveryAt: true, lastFailureAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const normalised = endpoints.map((ep) => ({
      ...ep,
      events: JSON.parse(ep.events),
    }));

    return apiList(normalised, normalised.length, { page: 1, pageSize: 100 }, ctx.requestId);
  },
  { requiredScope: "webhooks:read" }
);

// POST — register webhook endpoint (returns signing secret ONCE)
export const POST = withAuth(
  async (req: NextRequest, ctx: any) => {
    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = WebhookCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const signingSecret = `whsec_${randomBytes(24).toString("hex")}`;

    const endpoint = await prismadb.webhookEndpoint.create({
      data: {
        companyId:   ctx.companyId,
        url:         parsed.data.url,
        description: parsed.data.description,
        events:      JSON.stringify(parsed.data.events),
        signingSecret,
      },
    });

    return apiCreated(
      {
        id:            endpoint.id,
        url:           endpoint.url,
        events:        parsed.data.events,
        signingSecret, // SHOW ONCE
        createdAt:     endpoint.createdAt,
      },
      ctx.requestId
    );
  },
  { requiredScope: "webhooks:write" }
);




// // =============================================================================
// // app/api/v1/companies/[companySlug]/webhooks/route.ts
// // GET  /api/v1/companies/:slug/webhooks  — list endpoints
// // POST /api/v1/companies/:slug/webhooks  — register endpoint
// // =============================================================================
// // Note: In Next.js App Router, create a separate file at the correct path.
// // This file is a reference — split into its own route.ts file.

// import { randomBytes } from "crypto";
// import { WebhookCreateSchema, WebhookUpdateSchema } from "@/lib/api/validators";
// import { apiOk, apiList, apiNoContent, errors, apiCreated } from "@/lib/api/response";
// import { prismadb } from "@/lib/db";
// import { withAuth } from "@/lib/middleware/authenticate";

// // GET — list webhook endpoints (safe — no signing secrets)
// export const getWebhooks = withAuth(
//   async (req, ctx) => {
//     const endpoints = await prismadb.webhookEndpoint.findMany({
//       where: { companyId: ctx.companyId },
//       select: {
//         id: true, url: true, description: true, events: true,
//         isActive: true, totalDeliveries: true, totalFailures: true,
//         lastDeliveryAt: true, lastFailureAt: true, createdAt: true,
//         // signingSecret intentionally excluded from list response
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     const normalised = endpoints.map((ep) => ({
//       ...ep,
//       events: JSON.parse(ep.events),
//     }));

//     return apiList(normalised, normalised.length, { page: 1, pageSize: 100 }, ctx.requestId);
//   },
//   { requiredScope: "webhooks:read" }
// );

// // POST — register webhook endpoint (returns signing secret ONCE)
// export const createWebhook = withAuth(
//   async (req, ctx) => {
//     let body: unknown;
//     try { body = await req.json(); }
//     catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

//     const parsed = WebhookCreateSchema.safeParse(body);
//     if (!parsed.success) {
//       return errors.validation(
//         ctx.requestId,
//         parsed.error.flatten().fieldErrors as Record<string, string[]>
//       );
//     }

//     const signingSecret = `whsec_${randomBytes(24).toString("hex")}`;

//     const endpoint = await prismadb.webhookEndpoint.create({
//       data: {
//         companyId:     ctx.companyId,
//         url:           parsed.data.url,
//         description:   parsed.data.description,
//         events:        JSON.stringify(parsed.data.events),
//         signingSecret,
//       },
//     });

//     // Return signingSecret ONCE — it won't appear again in GET responses
//     return apiCreated(
//       {
//         id:            endpoint.id,
//         url:           endpoint.url,
//         events:        parsed.data.events,
//         signingSecret,                        // SHOW ONCE
//         createdAt:     endpoint.createdAt,
//       },
//       ctx.requestId
//     );
//   },
//   { requiredScope: "webhooks:write" }
// );
