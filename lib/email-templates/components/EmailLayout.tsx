// apps/api/app/lib/email-templates/components/EmailLayout.tsx

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import * as React from "react";
import { EmailHeader } from "./EmailHeader";
import { EmailFooter } from "./EmailFooter";
import { brand } from "./brand";

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

// Brand constants — mirrors packages/ui design tokens. Email clients can't
// read CSS variables reliably, so these are duplicated as plain values here
// on purpose rather than imported.

export { brand }; 

// export const brand = {
//   bg: "#FFFFFF",
//   bgAlt: "#F9F9F9",
//   text: "#0A0A0A",
//   textSecondary: "#555555",
//   accent: "#FFB000",
//   accentDark: "#E09D00",
//   border: "#E5E5E5",
//   fontHeading:
//     "'Syne', 'Helvetica Neue', Helvetica, Arial, sans-serif",
//   fontBody:
//     "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
// };

/**
 * Shared wrapper for every transactional and marketing email. Provides the
 * outer HTML shell, preview text, brand-coloured body, and consistent
 * header/footer. Individual templates render their own content as children.
 */
export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />
          <Section style={contentStyle}>{children}</Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: brand.bgAlt,
  fontFamily: brand.fontBody,
  margin: 0,
  padding: "32px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: brand.bg,
  maxWidth: "560px",
  margin: "0 auto",
  border: `1px solid ${brand.border}`,
  borderRadius: "4px",
  overflow: "hidden",
};

const contentStyle: React.CSSProperties = {
  padding: "32px 40px",
};
