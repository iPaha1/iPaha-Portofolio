// =============================================================================
// app/api/v1/companies/[companySlug]/portal/auth/verify/route.ts
//
// PUBLIC endpoint — no API key required.
// Verifies the OTP code and issues a portal session token.
// =============================================================================

import { NextRequest } from "next/server";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiOk, errors, apiError } from "@/lib/api/response";
import { prismadb } from "@/lib/db";
import { createHmac, randomBytes } from "crypto";

export const OPTIONS = handlePreflight;

const SESSION_TTL_DAYS = 30;

function hashToken(raw: string): string {
  return createHmac("sha256", process.env.API_KEY_HASH_SECRET!)
    .update(raw)
    .digest("hex");
}

export const POST = withPublicCompany(async (req, ctx) => {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return errors.validation(ctx.requestId, { body: ["Invalid JSON"] });
  }

  const email = body.email?.toLowerCase().trim() ?? "";
  const code  = body.code?.trim() ?? "";

  if (!email || !code) {
    return errors.validation(ctx.requestId, {
      ...(email ? {} : { email: ["Email is required"] }),
      ...(code  ? {} : { code:  ["Code is required"] }),
    });
  }

  // ── Look up the code record ───────────────────────────────────────────────
  const authCode = await prismadb.portalAuthCode.findUnique({
    where: { email },
  });

  // Always return the same error to prevent enumeration
  const invalidError = () =>
    apiError("INVALID_API_KEY", "Invalid or expired code.", 401, ctx.requestId);

  if (!authCode)                        return invalidError();
  if (authCode.companyId !== ctx.companyId) return invalidError();
  if (authCode.expiresAt < new Date())  return invalidError();
  if (authCode.attempts >= 5) {
    return apiError("RATE_LIMIT_EXCEEDED", "Too many failed attempts. Request a new code.", 429, ctx.requestId);
  }

  // ── Verify code ───────────────────────────────────────────────────────────
  if (authCode.code !== code) {
    // Increment attempt counter
    await prismadb.portalAuthCode.update({
      where: { email },
      data:  { attempts: { increment: 1 } },
    });
    return invalidError();
  }

  // ── Code is valid — delete it (one-time use) ──────────────────────────────
  await prismadb.portalAuthCode.delete({ where: { email } });

  // ── Look up the contact ───────────────────────────────────────────────────
  const contact = await prismadb.companyContact.findFirst({
    where: { email, companyId: ctx.companyId, isActive: true },
    select: {
      id:        true,
      firstName: true,
      lastName:  true,
      email:     true,
      company:   true,
      jobTitle:  true,
    },
  });

  if (!contact) return invalidError();

  // ── Issue session token ───────────────────────────────────────────────────
  const rawToken  = randomBytes(48).toString("hex");  // 96-char hex
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);

  // Delete any existing sessions for this contact (one session per contact)
  await prismadb.portalSession.deleteMany({
    where: { contactId: contact.id, companyId: ctx.companyId },
  });

  // Create new session
  await prismadb.portalSession.create({
    data: {
      companyId:  ctx.companyId,
      contactId:  contact.id,
      email:      contact.email,
      token:      rawToken.slice(0, 8) + "...",  // Store only prefix — not actual token
      tokenHash,
      expiresAt,
    },
  });

  // Return token (shown once — client stores in sessionStorage)
  return apiOk(
    {
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      client: {
        name:         `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`,
        firstName:    contact.firstName,
        email:        contact.email,
        businessName: contact.company ?? "Your Business",
      },
    },
    ctx.requestId
  );
});


// =============================================================================
// app/api/v1/companies/[companySlug]/portal/me/route.ts
//
// PROTECTED — requires portal session token (NOT API key).
// Returns the logged-in client's profile and project summary.
// =============================================================================

import { withPortalAuth, withPublicCompany } from "@/lib/middleware/portal-auth-middleware";

// GET /api/v1/companies/:slug/portal/me
export const getMeRoute = withPortalAuth(async (req, portalCtx) => {
  const contact = await prismadb.companyContact.findUnique({
    where: { id: portalCtx.contactId },
    select: {
      id:        true,
      firstName: true,
      lastName:  true,
      email:     true,
      company:   true,
      jobTitle:  true,
      phone:     true,
      notes:     true,
    },
  });

  if (!contact) return errors.notFound(portalCtx.requestId, "Contact");

  // Count bookings for this contact
  const [bookingCount, recentBooking] = await Promise.all([
    prismadb.booking.count({
      where: {
        companyId:   portalCtx.companyId,
        clientEmail: contact.email,
      },
    }),
    prismadb.booking.findFirst({
      where: {
        companyId:   portalCtx.companyId,
        clientEmail: contact.email,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id:            true,
        status:        true,
        serviceType:   true,
        confirmedDate: true,
        meetingUrl:    true,
      },
    }),
  ]);

  return apiOk(
    {
      name:         `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`,
      firstName:    contact.firstName,
      email:        contact.email,
      businessName: contact.company ?? "Your Business",
      jobTitle:     contact.jobTitle,
      projectCount: bookingCount,
      latestBooking: recentBooking,
    },
    portalCtx.requestId
  );
});






// // app/api/v1/companies/[companySlug]/portal/auth/verify/route.ts
// import { NextRequest } from "next/server";
// import { withAuth } from "@/lib/middleware/authenticate";
// import { errors, apiSuccess } from "@/lib/api/response";
// import { prismadb } from "@/lib/db";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.PORTAL_JWT_SECRET || "your-secret-key";

// export const POST = withAuth(
//   async (req, ctx, routeParams) => {
//     try {
//       const { email, code } = await req.json();
      
//       if (!email || !code) {
//         return errors.validation(ctx.requestId, { 
//           email: ["Email required"],
//           code: ["Code required"]
//         });
//       }

//       // Get stored code
//       const stored = await prismadb.portalAuthCode.findUnique({
//         where: { email: email.toLowerCase() },
//       });

//       if (!stored || stored.expiresAt < new Date()) {
//         return errors.validation(ctx.requestId, {
//           code: ["Invalid or expired code"],
//         });
//       }

//       if (stored.attempts >= 5) {
//         await prismadb.portalAuthCode.delete({ where: { email: email.toLowerCase() } });
//         return errors.validation(ctx.requestId, {
//           code: ["Too many attempts"],
//         });
//       }

//       if (stored.code !== code) {
//         await prismadb.portalAuthCode.update({
//           where: { email: email.toLowerCase() },
//           data: { attempts: { increment: 1 } },
//         });
//         return errors.validation(ctx.requestId, {
//           code: ["Invalid code"],
//         });
//       }

//       // Get client data
//       const client = await prismadb.companyContact.findFirst({
//         where: {
//           email: email.toLowerCase(),
//           companyId: ctx.companyId,
//           isActive: true,
//         },
//         include: {
//           parentCompany: true,
//         },
//       });

//       if (!client) {
//         return errors.notFound(ctx.requestId, "Client not found");
//       }

//       // Generate JWT token
//       const token = jwt.sign(
//         {
//           clientId: client.id,
//           email: client.email,
//           companyId: ctx.companyId,
//           exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
//         },
//         JWT_SECRET
//       );

//       // Delete used code
//       await prismadb.portalAuthCode.delete({
//         where: { email: email.toLowerCase() },
//       });

//       return apiSuccess({
//         token,
//         client: {
//           id: client.id,
//           name: `${client.firstName} ${client.lastName}`.trim(),
//           email: client.email,
//           businessName: client.parentCompany?.legalName || client.parentCompany?.displayName || "",
//           phone: client.phone,
//         },
//       }, ctx.requestId);
//     } catch (error) {
//       console.error("Verify error:", error);
//       return errors.internal(ctx.requestId);
//     }
//   },
//   { requiredScope: "portal:auth" }
// );