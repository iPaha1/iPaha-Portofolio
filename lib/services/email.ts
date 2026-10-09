// lib/services/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientCompany?: string | null;
  clientMessage?: string | null;
  serviceType?: string | null;
  confirmedDate?: Date | null;
  meetingUrl?: string | null;
  status: string;
  company: {
    displayName?: string | null;
    legalName?: string | null;
    contactEmail?: string | null;
  };
}

export async function sendBookingEmail(
  booking: Booking,
  newStatus: string,
  options?: {
    confirmedDate?: Date;
    meetingUrl?: string;
  }
) {
  const companyName = booking.company.displayName || booking.company.legalName || "Our Team";
  const fromEmail = process.env.RESEND_CONTACT_FROM_EMAIL || "bookings@isaacpaha.com";

  let subject = "";
  let html = "";

  switch (newStatus) {
    case "CONFIRMED":
      subject = `Your consultation is confirmed - ${companyName}`;
      html = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Consultation Confirmed</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; line-height: 1.5; color: #374151;">Dear ${booking.clientName},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #374151;">Your consultation with ${companyName} has been confirmed.</p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>📅 Date & Time:</strong><br/>${options?.confirmedDate ? new Date(options.confirmedDate).toLocaleString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'To be scheduled'}</p>
              ${options?.meetingUrl ? `<p style="margin: 0;"><strong>🔗 Meeting Link:</strong><br/><a href="${options.meetingUrl}" style="color: #f59e0b;">${options.meetingUrl}</a></p>` : ''}
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #374151;">What to expect:</h3>
              <ul style="color: #4b5563; line-height: 1.6;">
                <li>30-minute discovery call</li>
                <li>Discuss your business challenges</li>
                <li>Explore potential solutions</li>
                <li>Q&A about our services</li>
              </ul>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Need to reschedule? Reply to this email or contact us at ${booking.company.contactEmail || 'hello@ipaha.co.uk'}</p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">Best regards,<br/>${companyName} Team</p>
          </div>
        </div>
      `;
      break;

    case "CANCELLED":
      subject = `Your consultation has been cancelled - ${companyName}`;
      html = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ef4444; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">❌ Consultation Cancelled</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Dear ${booking.clientName},</p>
            <p style="font-size: 16px;">Your consultation with ${companyName} has been cancelled.</p>
            <p style="margin: 20px 0;">If you'd like to reschedule, please reply to this email or book a new time through our calendar.</p>
            <hr style="margin: 30px 0;" />
            <p style="color: #6b7280;">Best regards,<br/>${companyName} Team</p>
          </div>
        </div>
      `;
      break;

    case "COMPLETED":
      subject = `Thank you for your consultation - ${companyName}`;
      html = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🙏 Thank You!</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Dear ${booking.clientName},</p>
            <p style="font-size: 16px;">Thank you for your time today. We enjoyed learning about your business.</p>
            <p style="margin: 20px 0;">We'll follow up within 24 hours with our recommendations and next steps.</p>
            <p style="margin: 20px 0;">In the meantime, feel free to reply with any additional questions.</p>
            <hr style="margin: 30px 0;" />
            <p style="color: #6b7280;">Best regards,<br/>${companyName} Team</p>
          </div>
        </div>
      `;
      break;

    default:
      return;
  }

  await resend.emails.send({
    from: `${companyName} <${fromEmail}>`,
    to: booking.clientEmail,
    subject,
    html,
  });
}

export async function sendCustomEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "notifications@isaacpaha.com",
    to,
    subject,
    html,
  });
}

// Add these functions to your existing email service

export async function sendInvoiceEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: process.env.RESEND_INVOICE_FROM_EMAIL || "invoices@isaacpaha.com",
    to,
    subject,
    html,
  });
}

export async function sendPaymentConfirmation(invoice: any) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px;">
      <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Payment Received</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Dear ${invoice.clientName},</p>
        <p>Thank you for your payment of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: invoice.currency }).format(invoice.total)}.</p>
        <p>Your invoice ${invoice.invoiceNumber} is now marked as paid.</p>
        <p>We appreciate your business!</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: process.env.RESEND_PAYMENT_FROM_EMAIL || "payments@isaacpaha.com",
    to: invoice.clientEmail,
    subject: `Payment Confirmation - Invoice ${invoice.invoiceNumber}`,
    html,
  });
}