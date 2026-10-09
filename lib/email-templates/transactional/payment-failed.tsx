import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface PaymentFailedEmailProps {
  invoiceNumber: string;
  amount: string;
  portalUrl: string;
}

export default function PaymentFailedEmail({
  invoiceNumber = "your invoice",
  amount = "£0.00",
  portalUrl = "https://account.ipaha.co.uk/billing",
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout previewText={`Payment failed for ${invoiceNumber}`}>
      <Heading style={headingStyle}>Payment Didn't Go Through</Heading>

      <Text style={bodyTextStyle}>
        We tried to take payment of <strong>{amount}</strong> for{" "}
        {invoiceNumber}, but it didn't go through. This sometimes happens
        with an expired card or a temporary bank decline.
      </Text>

      <Text style={bodyTextStyle}>
        No action needed if you'd like us to retry — otherwise you can
        update your payment details directly.
      </Text>

      <EmailButton href={portalUrl}>Update Payment Details</EmailButton>
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
