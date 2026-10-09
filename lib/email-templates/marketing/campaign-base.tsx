import { Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { Block, renderBlocks } from "../email-builder/src";

export interface CampaignBaseEmailProps {
  previewText?: string;
  subject: string;
  blocks: Block[];
  unsubscribeUrl: string;
  businessName?: string;
}


export default function CampaignBaseEmail({
  previewText,
  subject = "",
  blocks = [],
  unsubscribeUrl = "#",
  businessName,
}: CampaignBaseEmailProps) {
  return (
    <EmailLayout previewText={previewText || subject}>
      <>
        {renderBlocks(blocks)}
        {businessName}
      </>
      <Text style={{
        fontFamily: brand.fontBody,
        fontSize: "11px",
        color: brand.textSecondary,
        marginTop: "24px",
        paddingTop: "16px",
        borderTop: `1px solid ${brand.border}`,
      }}>
        Don&apos;t want emails like this?{" "}
        <a href={unsubscribeUrl} style={{ color: brand.accentDark, textDecoration: "underline" }}>
          Unsubscribe
        </a>
      </Text>
    </EmailLayout>
  );
}

function UnsubscribeFooter({ unsubscribeUrl }: { unsubscribeUrl: string }) {
  return (
    <Text style={unsubscribeTextStyle}>
      Don&apos;t want emails like this?{" "}
      <a href={unsubscribeUrl} style={{ color: brand.accentDark, textDecoration: "underline" }}>
        Unsubscribe
      </a>
    </Text>
  );
}

const unsubscribeTextStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "11px",
  color: brand.textSecondary,
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: `1px solid ${brand.border}`,
};
