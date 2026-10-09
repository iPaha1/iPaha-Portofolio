import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface TicketCreatedEmailProps {
  subject: string;
  ticketType: string;
  portalUrl: string;
}

const TYPE_LABELS: Record<string, string> = {
  BUG: "Bug Report",
  SUPPORT_QUESTION: "Support Question",
  FEATURE_REQUEST: "Feature Request",
  NEW_PROJECT_REQUEST: "New Project Request",
  GENERAL: "General Enquiry",
};

/**
 * Sent immediately when a ticket is created — confirms receipt and sets
 * expectations, regardless of whether the client or a staff member (on
 * the client's behalf) raised it.
 */
export default function TicketCreatedEmail({
  subject = "Your request",
  ticketType = "GENERAL",
  portalUrl = "https://account.ipaha.co.uk/tickets",
}: TicketCreatedEmailProps) {
  return (
    <EmailLayout previewText={`We've received your request: ${subject}`}>
      <Heading style={headingStyle}>We've got your request</Heading>

      <Text style={bodyTextStyle}>
        Thanks for getting in touch. Here's a quick summary:
      </Text>

      <Text style={summaryStyle}>
        <strong>{TYPE_LABELS[ticketType] ?? "Request"}</strong>
        <br />
        {subject}
      </Text>

      <Text style={bodyTextStyle}>
        We respond within 1 business day. You can track this request and
        add more detail any time from your portal.
      </Text>

      <EmailButton href={portalUrl}>View Your Request</EmailButton>
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
  margin: "0 0 16px 0",
};
