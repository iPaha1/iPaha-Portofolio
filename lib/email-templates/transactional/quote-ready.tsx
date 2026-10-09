import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface QuoteReadyEmailProps {
  quoteNumber: string;
  title: string;
  portalUrl: string;
}

export default function QuoteReadyEmail({
  quoteNumber = "QTE-2026-0001",
  title = "Your Project",
  portalUrl = "https://account.ipaha.co.uk/quotes",
}: QuoteReadyEmailProps) {
  return (
    <EmailLayout previewText={`A proposal from iPaha: ${title}`}>
      <Heading style={headingStyle}>A Proposal For You</Heading>

      <Text style={bodyTextStyle}>
        We&apos;ve put together a proposal based on what we discussed:
      </Text>

      <Text style={summaryStyle}>
        <strong>{title}</strong>
        <br />
        Reference: {quoteNumber}
      </Text>

      <Text style={bodyTextStyle}>
        No hard sell — take a look whenever suits, and accept directly from
        your portal when you&apos;re ready to go ahead.
      </Text>

      <EmailButton href={portalUrl}>Review Proposal</EmailButton>
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

const summaryStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "14px",
  lineHeight: "20px",
  color: brand.text,
  backgroundColor: brand.bgAlt,
  border: `1px solid ${brand.border}`,
  borderRadius: "4px",
  padding: "12px 16px",
  margin: "0 0 20px 0",
};
