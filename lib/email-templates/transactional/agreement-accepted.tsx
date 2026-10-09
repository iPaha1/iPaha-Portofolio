// apps/api/app/lib/email-templates/transactional/agreement-accepted.tsx

import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface AgreementAcceptedEmailProps {
  recipientName: string;
  quoteTitle: string;
  quoteNumber: string;
  totalFormatted: string;
  projectUrl: string;
}

export default function AgreementAcceptedEmail({
  recipientName = "there",
  quoteTitle,
  quoteNumber,
  totalFormatted,
  projectUrl,
}: AgreementAcceptedEmailProps) {
  return (
    <EmailLayout previewText={`Confirmed: ${quoteTitle} (${quoteNumber})`}>
      <Heading style={headingStyle}>You&apos;re all set, {recipientName}</Heading>
      <Text style={bodyTextStyle}>
        Thanks for accepting <strong>{quoteTitle}</strong> ({quoteNumber}) at <strong>{totalFormatted}</strong>.
        We&apos;ve created your project and the team will be in touch shortly to get started.
      </Text>
      <EmailButton href={projectUrl}>View Your Project</EmailButton>
      <Text style={bodyTextStyle}>
        A copy of what you agreed to — including the terms and the exact amount — is saved to your account and
        available any time from your portal.
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