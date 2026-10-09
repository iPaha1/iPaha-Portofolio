// apps/api/app/lib/email-templates/transactional/quote-sent.tsx
//
// ASSUMPTION FLAG: I can't see apps/api's actual email-templates barrel
// (only that TicketCreatedEmail is imported from "@/app/lib/email-templates"
// elsewhere), so I don't know its exact conventions. This follows the shape
// welcome-client.tsx uses in apps/admin's copy as the closest reference
// point I have. Add `export { default as QuoteSentEmail } from
// "./transactional/quote-sent";` (and the AgreementAcceptedEmail below) to
// whatever apps/api's real index.ts is.

import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface QuoteSentEmailProps {
  recipientName: string;
  businessName: string;
  quoteTitle: string;
  quoteNumber: string;
  totalFormatted: string; // pre-formatted, e.g. "£4,200.00" — currency formatting stays in application code, not the template
  validUntilFormatted?: string;
  portalUrl: string;
}

export default function QuoteSentEmail({
  recipientName = "there",
  businessName = "your business",
  quoteTitle,
  quoteNumber,
  totalFormatted,
  validUntilFormatted,
  portalUrl,
}: QuoteSentEmailProps) {
  return (
    <EmailLayout previewText={`Your quote ${quoteNumber} from iPaha is ready to review`}>
      <Heading style={headingStyle}>A quote is ready for {businessName}</Heading>
      <Text style={bodyTextStyle}>
        Hi {recipientName}, we&apos;ve put together a proposal — <strong>{quoteTitle}</strong> ({quoteNumber}) —
        totalling <strong>{totalFormatted}</strong>.
        {validUntilFormatted ? ` This is open until ${validUntilFormatted}.` : ""}
      </Text>
      <EmailButton href={portalUrl}>Review &amp; Respond</EmailButton>
      <Text style={bodyTextStyle}>
        You can review the full breakdown and accept online whenever you&apos;re ready — no need to reply to this email.
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: brand.fontHeading,
  fontWeight: 700,
  fontSize: "22px",
  color: brand.text,
  margin: "0 0 16px 0",
};
const bodyTextStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "14px",
  lineHeight: "22px",
  color: brand.textSecondary,
  margin: "0 0 16px 0",
};