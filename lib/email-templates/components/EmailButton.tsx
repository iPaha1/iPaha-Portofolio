import { Button as ReactEmailButton } from "@react-email/components";
import * as React from "react";
import { brand } from "./EmailLayout";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Primary CTA button for emails — amber fill, black text, sharp 4px
 * radius, matching the iPaha brand button style used across the
 * marketing site and dashboards.
 */
export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <ReactEmailButton href={href} style={buttonStyle}>
      {children}
    </ReactEmailButton>
  );
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: brand.accent,
  color: brand.text,
  fontFamily: brand.fontBody,
  fontWeight: 600,
  fontSize: "14px",
  borderRadius: "4px",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};
