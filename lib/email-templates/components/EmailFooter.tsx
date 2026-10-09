import { Hr, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand } from "./EmailLayout";

/**
 * Standard footer for every email — company identity, address, and the
 * required unsubscribe link for marketing sends (harmless/no-op to include
 * on transactional emails too, but `showUnsubscribe` lets us hide it where
 * it would be inappropriate, e.g. payment receipts).
 */
interface EmailFooterProps {
  showUnsubscribe?: boolean;
}

export function EmailFooter({ showUnsubscribe = false }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Hr style={hrStyle} />
      <Text style={textStyle}>
        iPaha Ltd · London, UK ·{" "}
        <Link href="mailto:hello@ipaha.co.uk" style={linkStyle}>
          hello@ipaha.co.uk
        </Link>
      </Text>
      <Text style={textStyle}>
        <Link href="https://www.ipaha.co.uk" style={linkStyle}>
          www.ipaha.co.uk
        </Link>
      </Text>
      {showUnsubscribe && (
        <Text style={textStyle}>
          <Link
            href="https://account.ipaha.co.uk/settings/notifications"
            style={linkStyle}
          >
            Manage email preferences
          </Link>
        </Text>
      )}
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  padding: "0 40px 28px 40px",
};

const hrStyle: React.CSSProperties = {
  borderColor: brand.border,
  margin: "0 0 16px 0",
};

const textStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "12px",
  color: brand.textSecondary,
  margin: "4px 0",
};

const linkStyle: React.CSSProperties = {
  color: brand.textSecondary,
  textDecoration: "underline",
};
