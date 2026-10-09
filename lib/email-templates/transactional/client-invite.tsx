import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface ClientInviteEmailProps {
  businessName: string;
  inviteUrl: string;
  expiresInDays: number;
  staffFirstName?: string;
}

export default function ClientInviteEmail({
  businessName = "Your Company",
  inviteUrl = "#",
  expiresInDays = 7,
  staffFirstName,
}: ClientInviteEmailProps) {
  return (
    <EmailLayout previewText={`You've been invited to the ${businessName} client portal`}>
      <Heading style={{
        fontFamily: brand.fontHeading,
        fontWeight: 700,
        fontSize: "22px",
        color: brand.text,
        margin: "0 0 16px 0",
      }}>
        Your client portal is ready
      </Heading>

      <Text style={{ fontFamily: brand.fontBody, fontSize: "14px", lineHeight: "22px", color: brand.textSecondary, margin: "0 0 12px 0" }}>
        {staffFirstName ? `${staffFirstName} at iPaha` : "iPaha"} has set up a client portal
        for {businessName}. From here you can track your projects, view
        invoices, raise support requests, and review proposals.
      </Text>

      <Text style={{ fontFamily: brand.fontBody, fontSize: "14px", lineHeight: "22px", color: brand.textSecondary, margin: "0 0 24px 0" }}>
        Click the button below to create your account. This link expires in{" "}
        {expiresInDays} days.
      </Text>

      <EmailButton href={inviteUrl}>Create My Account</EmailButton>

      <Text style={{ fontFamily: brand.fontBody, fontSize: "12px", lineHeight: "20px", color: brand.textSecondary, margin: "24px 0 0 0" }}>
        If you weren&lsquo;t expecting this, you can safely ignore it. The link
        only works once and expires in {expiresInDays} days.
      </Text>
    </EmailLayout>
  );
}