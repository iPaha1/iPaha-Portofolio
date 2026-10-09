import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface TicketReplyEmailProps {
  subject: string;
  replyBody: string;
  portalUrl: string;
}

/**
 * Sent whenever either side replies on a ticket thread, to whichever side
 * didn't just post (client → notifies staff; staff → notifies client).
 * Internal notes never trigger this template — see the isInternalNote
 * guard in the messages route handler.
 */
export default function TicketReplyEmail({
  subject = "Your request",
  replyBody = "",
  portalUrl = "https://account.ipaha.co.uk/tickets",
}: TicketReplyEmailProps) {
  // Truncate long replies in the email preview — the full message lives
  // in the portal, this is a notification, not a mirror of the thread.
  const preview =
    replyBody.length > 280 ? `${replyBody.slice(0, 280)}…` : replyBody;

  return (
    <EmailLayout previewText={`New reply on: ${subject}`}>
      <Heading style={headingStyle}>New reply on "{subject}"</Heading>

      <Text style={quoteStyle}>{preview}</Text>

      <EmailButton href={portalUrl}>View Full Conversation</EmailButton>
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

const quoteStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "14px",
  lineHeight: "22px",
  color: brand.textSecondary,
  borderLeft: `3px solid ${brand.accent}`,
  paddingLeft: "16px",
  margin: "0 0 20px 0",
};
