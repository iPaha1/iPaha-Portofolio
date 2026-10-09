// apps/api/app/lib/email-templates/transactional/quote-sent-prospect.tsx
//
// Deliberately a separate template from quote-sent.tsx rather than one
// template with an isProspect flag — the actions are genuinely different
// (log in vs. no account needed) and conditional copy inside one template
// tends to rot into an if/else nobody trusts. Same @/app/lib/email-templates
// barrel-file caveat as quote-sent.tsx applies here.

import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface QuoteSentProspectEmailProps {
  recipientName: string;
  companyName: string;
  quoteTitle: string;
  totalFormatted: string;
  validUntilFormatted?: string;
  viewUrl: string;
}

export default function QuoteSentProspectEmail({
  recipientName = "there",
  companyName,
  quoteTitle,
  totalFormatted,
  validUntilFormatted,
  viewUrl,
}: QuoteSentProspectEmailProps) {
  return (
    <EmailLayout previewText={`A proposal from iPaha for ${companyName}`}>
      <Heading style={headingStyle}>A proposal for {companyName}</Heading>
      <Text style={bodyTextStyle}>
        Hi {recipientName}, thanks for your interest — we&apos;ve put together a proposal, <strong>{quoteTitle}</strong>,
        totalling <strong>{totalFormatted}</strong>.
        {validUntilFormatted ? ` This is open until ${validUntilFormatted}.` : ""}
      </Text>
      <EmailButton href={viewUrl}>View the Proposal</EmailButton>
      <Text style={bodyTextStyle}>
        No account needed to take a look. If you&apos;d like to go ahead, just let us know from there and we&apos;ll get you
        set up.
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