import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface PaymentReceiptEmailProps {
  invoiceNumber: string;
  amount: string;
  portalUrl: string;
}

export default function PaymentReceiptEmail({
  invoiceNumber = "IPA-2026-0001",
  amount = "£0.00",
  portalUrl = "https://account.ipaha.co.uk/billing/invoices",
}: PaymentReceiptEmailProps) {
  return (
    <EmailLayout previewText={`Payment received — ${amount}`}>
      <Heading style={headingStyle}>Payment Received</Heading>

      <Text style={bodyTextStyle}>
        Thanks — we've received your payment for invoice{" "}
        <strong>{invoiceNumber}</strong>.
      </Text>

      <Text style={amountStyle}>{amount}</Text>

      <Text style={bodyTextStyle}>
        A full receipt is available any time in your billing history.
      </Text>

      <EmailButton href={portalUrl}>View Receipt</EmailButton>
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

const amountStyle: React.CSSProperties = {
  fontFamily: brand.fontHeading,
  fontWeight: 700,
  fontSize: "28px",
  color: brand.text,
  margin: "0 0 20px 0",
};
