// =============================================================================
// isaacpaha.com — Public Contact Form API
// app/api/contact/submit/route.ts
// POST → saves submission to DB + sends notification email via Resend
// =============================================================================

import { prismadb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Resend }                    from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const VALID_TYPES = ["collaboration", "consulting", "speaking", "general"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, type, message, subject, company, budget, extra } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid contact type." }, { status: 400 });
    }

    // Extract IP for basic spam protection
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    // Build company/budget from extra fields or direct fields
    const resolvedCompany = company ?? extra?.company ?? null;
    const resolvedBudget  = budget  ?? extra?.budget  ?? null;
    const resolvedSubject = subject ?? extra?.project ?? extra?.event ?? null;

    // Save to DB
    const submission = await prismadb.contactSubmission.create({
      data: {
        name:      name.trim(),
        email:     email.trim().toLowerCase(),
        type:      type ?? "general",
        message:   message.trim(),
        subject:   resolvedSubject ?? null,
        company:   resolvedCompany ?? null,
        budget:    resolvedBudget  ?? null,
        ipAddress,
        isRead:    false,
        isReplied: false,
      },
    });

    // Send notification email to Isaac (fire-and-forget — don't block the response)
    const typeEmoji: Record<string, string> = {
      collaboration: "🤝",
      consulting:    "💼",
      speaking:      "🎙️",
      general:       "💬",
    };

    resend.emails.send({
      from:    "isaacpaha.com <notifications@isaacpaha.com>",
      to:      "pahaisaac@gmail.com",
      replyTo: email.trim(),
      subject: `${typeEmoji[type ?? "general"]} New ${type ?? "general"} enquiry from ${name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;padding:32px;color:#1a1a1a;">
          <div style="border-bottom:3px solid #f59e0b;padding-bottom:16px;margin-bottom:24px;">
            <h2 style="margin:0;font-size:20px;">New Contact Submission</h2>
            <p style="margin:4px 0 0;color:#888;font-size:13px;">via isaacpaha.com/contact</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px 0;color:#888;font-size:13px;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#f59e0b;">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px;">Type</td><td style="padding:8px 0;">${typeEmoji[type ?? "general"]} ${type ?? "general"}</td></tr>
            ${resolvedCompany ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Company</td><td style="padding:8px 0;">${resolvedCompany}</td></tr>` : ""}
            ${resolvedBudget  ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Budget</td><td style="padding:8px 0;">${resolvedBudget}</td></tr>` : ""}
            ${resolvedSubject ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Subject</td><td style="padding:8px 0;">${resolvedSubject}</td></tr>` : ""}
          </table>

          <div style="background:#f9f9f9;border-left:3px solid #f59e0b;padding:16px;border-radius:2px;margin-bottom:24px;">
            <p style="margin:0;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>

          <a href="mailto:${email}?subject=Re: Your enquiry" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:2px;">
            Reply to ${name} →
          </a>

          <p style="font-size:11px;color:#ccc;margin-top:24px;">
            Submission ID: ${submission.id} · <a href="https://www.isaacpaha.com/admin" style="color:#ccc;">View in admin</a>
          </p>
        </div>
      `,
    }).catch((err) => console.error("[contact notify]", err));

    return NextResponse.json(
      { ok: true, message: "Message sent. Isaac will be in touch soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[contact/submit]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}