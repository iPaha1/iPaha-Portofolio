// lib/email-templates/transactional/portal-verification-code.tsx
import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";

export interface PortalVerificationCodeEmailProps {
  recipientName: string;
  code: string;
  expiresInMinutes?: number;
}

export default function PortalVerificationCodeEmail({
  recipientName = "there",
  code,
  expiresInMinutes = 10,
}: PortalVerificationCodeEmailProps) {
  return (
    <EmailLayout previewText={`Your iPaha portal sign-in code: ${code}`}>
      <Heading style={headingStyle}>Your sign-in code</Heading>
      <Text style={bodyTextStyle}>Hi {recipientName}, use this code to sign in:</Text>
      <Section style={codeBoxStyle}>
        <Text style={codeTextStyle}>{code}</Text>
      </Section>
      <Text style={bodyTextStyle}>
        This code expires in {expiresInMinutes} minutes. Didn&apos;t request this? Ignore this email.
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = { fontFamily: brand.fontHeading, fontWeight: 700, fontSize: "22px", color: brand.text, margin: "0 0 16px 0" };
const bodyTextStyle: React.CSSProperties = { fontFamily: brand.fontBody, fontSize: "14px", lineHeight: "22px", color: brand.textSecondary, margin: "0 0 16px 0" };
const codeBoxStyle: React.CSSProperties = { background: "#f6f6f6", borderRadius: "8px", padding: "18px", textAlign: "center", margin: "0 0 20px 0" };
const codeTextStyle: React.CSSProperties = { fontFamily: brand.fontHeading, fontWeight: 800, fontSize: "32px", letterSpacing: "8px", color: brand.text, margin: 0 };