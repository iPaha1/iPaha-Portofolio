// lib/email-templates/transactional/welcome-client.tsx

import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";
import { brand } from "../components/EmailLayout";

export interface WelcomeClientEmailProps {
  /** First name of the person being welcomed */
  recipientName: string;
  /** Name of the client business they belong to */
  businessName: string;
  /** Direct link to set password / first login (Clerk invite link) */
  loginUrl: string;
  /** Name of the iPaha team member who invited them, for a personal touch */
  invitedByName?: string;
}

/**
 * Sent when a BusinessContact is invited to customer-portal.ipaha.co.uk —
 * either as part of onboarding a brand new client, or when an existing
 * client adds a colleague to their account.
 *
 * Also reused (with different copy via props in future, or a sibling
 * template later) for internal StaffMember invites to admin-portal.
 */
export default function WelcomeClientEmail({
  recipientName = "there",
  businessName = "your business",
  loginUrl = "https://account.ipaha.co.uk/sign-in",
  invitedByName,
}: WelcomeClientEmailProps) {
  return (
    <EmailLayout
      previewText={`You've been added to ${businessName}'s iPaha portal`}
    >
      <Heading style={headingStyle}>Welcome to iPaha, {recipientName}</Heading>

      <Text style={bodyTextStyle}>
        {invitedByName ? `${invitedByName} has` : "We've"} set you up with
        access to the iPaha client portal for <strong>{businessName}</strong>.
        From here you&apos;ll be able to track project progress, raise support
        requests, and manage billing — all in one place.
      </Text>

      <EmailButton href={loginUrl}>Set Up Your Account</EmailButton>

      <Text style={bodyTextStyle}>
        If you weren&apos;t expecting this email, you can safely ignore it, or get
        in touch at hello@ipaha.co.uk if anything looks wrong.
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
