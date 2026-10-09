import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface SubscriptionOfferEmailProps {
  planName: string;
  amount: string;
  interval: string;
  portalUrl: string;
}

export default function SubscriptionOfferEmail({
  planName = "Standard Support",
  amount = "£99.00",
  interval = "MONTH",
  portalUrl = "https://account.ipaha.co.uk/billing/subscriptions",
}: SubscriptionOfferEmailProps) {
  const intervalLabel = interval === "YEAR" ? "year" : "month";

  return (
    <EmailLayout previewText={`A subscription offer from iPaha: ${planName}`}>
      <Heading style={headingStyle}>A Plan For You</Heading>

      <Text style={bodyTextStyle}>
        We've put together a subscription that fits what you need:
      </Text>

      <Text style={summaryStyle}>
        <strong>{planName}</strong>
        <br />
        {amount} / {intervalLabel}
      </Text>

      <Text style={bodyTextStyle}>
        No obligation — review the details and accept whenever you're ready.
      </Text>

      <EmailButton href={portalUrl}>Review Offer</EmailButton>
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
