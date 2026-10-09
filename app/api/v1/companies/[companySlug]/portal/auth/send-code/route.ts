// =============================================================================
// app/api/v1/companies/[companySlug]/portal/auth/send-code/route.ts
//
// PUBLIC endpoint — no API key required.
// Called directly from the browser (iPaha Ltd portal login form).
//
// Uses withPublicCompany() which only resolves the company from the slug.
// No Bearer token needed.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { handlePreflight } from "@/lib/middleware/rate-limit";
import { apiOk, errors } from "@/lib/api/response";
import { prismadb } from "@/lib/db";
import { Resend } from "resend";
import { withPublicCompany } from "@/lib/middleware/portal-auth-middleware";
import { corsHeaders, handleCors } from "@/lib/api/cors";

const resend = new Resend(process.env.RESEND_API_KEY);

// Allow preflight — this is called from the browser
// export const OPTIONS = handlePreflight;

// Handle OPTIONS preflight with CORS
export const OPTIONS = (req: NextRequest) => {
  return handleCors(req) || new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
};


export const POST = withPublicCompany(async (req, ctx) => {
    console.log("Send code request received with body:", await req.clone().text()); // Debug log
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return errors.validation(ctx.requestId, { body: ["Invalid JSON"] });
  }
  console.log("Request body:", body); // Debug log
  console.log("Parsed body:", body); // Debug log

  const email = body.email?.toLowerCase().trim() ?? "";
  console.log("Email:", email); // Debug log

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errors.validation(ctx.requestId, { email: ["Valid email address required"] });
  }

  console.log("Validated email:", email); // Debug log

  // ── Check if contact exists and is active in this company ─────────────────
  // We ALWAYS return success regardless — prevents email enumeration
  const contact = await prismadb.companyContact.findFirst({
    where: {
      email:     email,
      companyId: ctx.companyId,
      isActive:  true,
    },
    select: { id: true, firstName: true, company: true },
  });
  console.log("Contact found:", !!contact); // Debug log

  if (contact) {
    // Generate 6-digit OTP
    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert — one active code per email per company
    await prismadb.portalAuthCode.upsert({
      where:  { email },
      update: { code, expiresAt, attempts: 0, companyId: ctx.companyId },
      create: { email, code, expiresAt, attempts: 0, companyId: ctx.companyId },
    });
    console.log("Auth code upserted for email:", email); // Debug log

    // Get company display name for email
    const company = await prismadb.company.findUnique({
      where: { id: ctx.companyId },
      select: { displayName: true, accentColor: true },
    });
    console.log("Company info:", company); // Debug log
    const companyName  = company?.displayName ?? ctx.companySlug;
    console.log("Company name for email:", companyName); // Debug log
    const accentColor  = company?.accentColor ?? "#f59e0b";
    console.log("Accent color for email:", accentColor); // Debug log

    // Send email via Resend
    await resend.emails.send({
      from:    `${companyName} Portal <portal@isaacpaha.com>`,
      to:      email,
      subject: `Your ${companyName} portal sign-in code`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0a0a08;font-family:system-ui,-apple-system,sans-serif;">
          <div style="max-width:480px;margin:40px auto;padding:0 20px;">
            <!-- Header -->
            <div style="text-align:center;padding:32px 0 24px;">
              <div style="font-size:1.3rem;font-weight:800;color:white;letter-spacing:-0.03em;">
                ${companyName}<span style="color:${accentColor}">.</span>
              </div>
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.3);letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">
                Client Portal
              </div>
            </div>
            <!-- Card -->
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
              <p style="color:rgba(255,255,255,0.6);font-size:0.875rem;margin:0 0 8px;">Hi ${contact.firstName},</p>
              <p style="color:rgba(255,255,255,0.6);font-size:0.875rem;margin:0 0 24px;line-height:1.6;">
                Here's your sign-in code for the ${companyName} client portal:
              </p>
              <!-- Code block -->
              <div style="background:rgba(255,176,0,0.08);border:1px solid rgba(255,176,0,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;color:${accentColor};font-variant-numeric:tabular-nums;">
                  ${code}
                </div>
                <div style="font-size:0.72rem;color:rgba(255,255,255,0.3);margin-top:8px;letter-spacing:0.05em;">
                  Expires in 10 minutes
                </div>
              </div>
              <p style="color:rgba(255,255,255,0.3);font-size:0.78rem;margin:0;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
                Your account has not been accessed.
              </p>
            </div>
            <!-- Footer -->
            <div style="text-align:center;padding:20px 0;">
              <p style="color:rgba(255,255,255,0.15);font-size:0.7rem;margin:0;">
                Powered by isaacpaha.com · Sent to ${email}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  console.log("Email sent if contact exists. Returning success response."); // Debug log

  // Always return the same response — prevent email enumeration
  return apiOk(
    { message: "If this email is registered, a code has been sent." },
    ctx.requestId
  );
});





// // app/api/v1/companies/[companySlug]/portal/auth/send-code/route.ts
// import { NextRequest } from "next/server";
// import { withAuth } from "@/lib/middleware/authenticate";
// import { errors, apiSuccess } from "@/lib/api/response";
// import { Resend } from "resend";
// import { prismadb } from "@/lib/db";
// import crypto from "crypto";

// const resend = new Resend(process.env.RESEND_API_KEY);

// function generateCode(): string {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// export const POST = withAuth(
//   async (req, ctx, routeParams) => {
//     try {
//         console.log("Send code request received with body:", await req.clone().text()); // Debug log
//       const { email } = await req.json();
      
//       if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//         return errors.validation(ctx.requestId, { email: ["Valid email required"] });
//       }

//       // Check if client exists in this company
//       const client = await prismadb.companyContact.findFirst({
//         where: {
//           email: email.toLowerCase(),
//           companyId: ctx.companyId,
//           isActive: true,
//         },
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           company: true,
//         },
//       });

//       // Always return success to prevent email enumeration
//       if (client) {
//         const code = generateCode();
//         const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
//         // Store code
//         await prismadb.portalAuthCode.upsert({
//           where: { email: email.toLowerCase() },
//           update: { code, expiresAt, attempts: 0 },
//           create: { email: email.toLowerCase(), code, expiresAt, attempts: 0 },
//         });

//         // Send email
//         await resend.emails.send({
//           from: `${ctx.companySlug} Portal <noreply@isaacpaha.com>`,
//           to: email,
//           subject: `Your sign-in code for ${ctx.companySlug}`,
//           html: `
//             <div style="font-family: system-ui; padding: 40px 20px; max-width: 500px; margin: 0 auto;">
//               <h2 style="color: #f59e0b;">Your Sign-in Code</h2>
//               <div style="background: #fef3c7; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
//                 <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #d97706;">${code}</div>
//               </div>
//               <p>This code expires in 10 minutes.</p>
//               <p>If you didn't request this, you can ignore this email.</p>
//             </div>
//           `,
//         });
//       }

//       return apiSuccess({ message: "Code sent if account exists" }, ctx.requestId);
//     } catch (error) {
//       console.error("Send code error:", error);
//       return errors.internal(ctx.requestId);
//     }
//   },
//   { requiredScope: "portal:auth" }
// );