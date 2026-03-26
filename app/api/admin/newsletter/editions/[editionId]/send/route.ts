// =============================================================================
// isaacpaha.com — Send Newsletter Edition
// app/api/admin/newsletter/editions/[id]/send/route.ts
//
// POST → sends the edition to all ACTIVE subscribers via Resend
//        Batches in groups of 50 to respect Resend rate limits.
//        Updates sentAt + recipientCount in DB when done.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { Resend }                    from "resend";
import { prismadb } from "@/lib/db";
import { markEditionSent } from "@/lib/actions/newsletter-actions";


const resend = new Resend(process.env.RESEND_API_KEY);
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "newsletter@isaacpaha.com";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
    const { editionId } = await params;
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch edition
  const edition = await prismadb.newsletterEdition.findUnique({
    where:  { id: editionId },
  });
  console.log('Newsletter Edition:', edition)
  if (!edition) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }
  if (edition.sentAt) {
    return NextResponse.json(
      { error: "This edition has already been sent" },
      { status: 409 }
    );
  }

  // Fetch all ACTIVE subscribers
  const subscribers = await prismadb.newsletterSubscriber.findMany({
    where:  { status: "ACTIVE" },
    select: { email: true, firstName: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
  }

  // Build HTML if not already stored
  const html = edition.contentHtml ?? `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><title>${edition.title}</title></head>
      <body style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;padding:32px;color:#1a1a1a;">
        <div style="margin-bottom:24px;border-bottom:2px solid #f59e0b;padding-bottom:16px;">
          <h1 style="font-size:24px;font-weight:900;margin:0;">The Signal</h1>
          <p style="color:#666;font-size:13px;margin:4px 0 0;">Issue #${edition.issueNumber}</p>
        </div>
        <h2 style="font-size:20px;font-weight:800;">${edition.title}</h2>
        <p style="color:#555;font-size:15px;line-height:1.7;">${edition.preview}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#999;">
          You're receiving this because you subscribed at isaacpaha.com.
          <a href="https://www.isaacpaha.com/newsletter/unsubscribe?email={{email}}" style="color:#f59e0b;">Unsubscribe</a>
        </p>
      </body>
    </html>
  `;

  // Send in batches of 50
  const BATCH = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          await resend.emails.send({
            from:    resendFromEmail,
            to:      sub.email,
            subject: `${edition.title} — The Signal #${edition.issueNumber}`,
            html:    html.replace("{{email}}", encodeURIComponent(sub.email)),
            replyTo: "pahaisaac@gmail.com",
          });
          sent++;
        } catch {
          failed++;
        }
      })
    );
    // Small pause between batches to respect rate limits
    if (i + BATCH < subscribers.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`Edition ${edition.issueNumber} sent: ${sent}, failed: ${failed}`);

  // Update DB: mark as sent
  await markEditionSent(editionId, sent);

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    total: subscribers.length,
  });
}