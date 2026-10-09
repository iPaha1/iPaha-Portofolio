// =============================================================================
// app/api/v1/companies/[companySlug]/forms/submit/route.ts
// POST /api/v1/companies/:slug/forms/submit
// Generic form submission — accepts any form from the company's websites
// =============================================================================

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiCreated, errors } from "@/lib/api/response";
import { FormSubmissionSchema } from "@/lib/api/validators";
import { createAuditLog } from "@/lib/services/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";
import { prismadb } from "@/lib/db";

export const OPTIONS = handlePreflight;

export const POST = withAuth(
  async (req, ctx) => {
    let body: unknown;
    try { body = await req.json(); }
    catch { return errors.validation(ctx.requestId, { body: ["Invalid JSON"] }); }

    const parsed = FormSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return errors.validation(
        ctx.requestId,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const submission = await prismadb.formSubmission.create({
      data: {
        companyId: ctx.companyId,
        formId:    parsed.data.formId,
        data:      JSON.stringify(parsed.data.data),
        source:    parsed.data.source,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    createAuditLog({
      companyId: ctx.companyId, actorType: "api_key", actorId: ctx.apiKeyId,
      action: "form.submitted", entityType: "form_submission",
      entityId: submission.id, requestId: ctx.requestId,
    }).catch(() => {});

    dispatchWebhookEvent({
      companyId: ctx.companyId, companySlug: ctx.companySlug,
      eventType: "form.submitted", entityType: "form_submission",
      entityId: submission.id,
      data: { ...submission, data: parsed.data.data },
    }).catch(() => {});

    return apiCreated(
      { id: submission.id, formId: submission.formId, createdAt: submission.createdAt },
      ctx.requestId
    );
  },
  { requiredScope: "forms:write" }
);
