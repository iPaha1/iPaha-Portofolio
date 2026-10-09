import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface InvoiceIssuedEmailProps {
  invoiceNumber: string;
  amount: string;
  dueDate: string | null;
  portalUrl: string;
}

export default function InvoiceIssuedEmail({
  invoiceNumber = "IPA-2026-0001",
  amount = "£0.00",
  dueDate = null,
  portalUrl = "https://account.ipaha.co.uk/billing/invoices",
}: InvoiceIssuedEmailProps) {
  return (
    <EmailLayout previewText={`Invoice ${invoiceNumber} — ${amount} due`}>
      <Heading style={headingStyle}>New Invoice</Heading>

      <Text style={bodyTextStyle}>
        A new invoice is ready for your review.
      </Text>

      <Text style={summaryStyle}>
        Invoice <strong>{invoiceNumber}</strong>
        <br />
        Amount: <strong>{amount}</strong>
        {dueDate && (
          <>
            <br />
            Due: {new Date(dueDate).toLocaleDateString("en-GB")}
          </>
        )}
      </Text>

      <EmailButton href={portalUrl}>View & Pay Invoice</EmailButton>
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
