// apps/api/lib/email/send-portal-otp.ts
import { Resend } from "resend";
import { render } from "@react-email/render";
// import { PortalVerificationCodeEmail } from "@/lib/email-templates";
import PortalVerificationCodeEmail from "@/lib/email-templates/transactional/portal-verification-code"


const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPortalVerificationCodeInput {
  to: string;
  recipientName: string;
  code: string;
}

export async function sendPortalVerificationCode({
  to,
  recipientName,
  code,
}: SendPortalVerificationCodeInput): Promise<void> {
  const html = await render(
    PortalVerificationCodeEmail({ recipientName, code, expiresInMinutes: 10 })
  );

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Your iPaha sign-in code: ${code}`,
    html,
  });

  if (error) {
    // Logged, not thrown to the route as a 500 — send-code always returns
    // a generic success response regardless of delivery outcome (avoids
    // leaking whether the email exists, and avoids a Resend blip
    // surfacing as a broken sign-in flow to the user).
    console.error("[sendPortalVerificationCode] Resend error:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
}