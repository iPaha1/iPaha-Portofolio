import { Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand } from "./brand";
// import { brand } from "./EmailLayout";

/**
 * Top banner shown on every email. Uses the iPaha wordmark image hosted on
 * Cloudinary so it renders consistently across email clients (many clients
 * block custom web fonts in the header area before the body loads).
 */
export function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <Img
        src="https://res.cloudinary.com/dprxr852x/image/upload/v1784051141/isaacpaha/image/dark-green-modern-initial-logo-1-1784051141663.png"
        alt="iPaha Ltd"
        width="120"
        height="32"
        style={{ display: "block" }}
      />
      <Text style={taglineStyle}>
        Your Business running smarter.
      </Text>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "28px 40px 20px 40px",
  borderBottom: `1px solid ${brand.border}`,
};

const taglineStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "12px",
  color: brand.textSecondary,
  margin: "8px 0 0 0",
};
