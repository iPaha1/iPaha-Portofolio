import * as React from "react";
import { Heading, Text, Img, Hr, Link } from "@react-email/components";
import type { Block } from "./types";

// ============================================================================
// @ipaha/email-builder — render.tsx
//
// Pure function: Block[] -> React elements, used inside CampaignBaseEmail
// (packages/email-templates/src/marketing/campaign-base.tsx) at actual
// send time. Also used by EmailPreview.tsx in the admin editor, so what
// staff see while composing is pixel-equivalent to what gets sent — same
// function, not a re-implementation.
//
// Brand values duplicated here rather than imported from
// @ipaha/email-templates, matching that package's own existing pattern of
// not importing CSS variables into email contexts (email clients can't
// reliably resolve them) — see EmailLayout's own `brand` const for the
// same reasoning.
// ============================================================================

const brand = {
  text: "#0A0A0A",
  textSecondary: "#555555",
  accent: "#FFB000",
  border: "#E5E5E5",
  fontHeading: "'Syne', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontBody: "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const SPACER_HEIGHTS: Record<string, number> = { sm: 12, md: 24, lg: 48 };

/** Renders **bold**, _italic_, and [text](url) inline markers within a
 * text block into actual React nodes — the small supported subset noted
 * in types.ts, not full markdown. */
function renderInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("_")) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <Link key={key++} href={linkMatch[2]} style={{ color: brand.accent }}>
            {linkMatch[1]}
          </Link>,
        );
      }
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

export function renderBlocks(blocks: Block[]): React.ReactNode {
  return blocks.map((block) => renderBlock(block));
}

function renderBlock(block: Block): React.ReactNode {
  switch (block.type) {
    case "heading":
      return (
        <Heading
          key={block.id}
          style={
            block.level === "h1"
              ? { fontFamily: brand.fontHeading, fontWeight: 700, fontSize: "24px", color: brand.text, margin: "0 0 16px 0" }
              : { fontFamily: brand.fontHeading, fontWeight: 700, fontSize: "18px", color: brand.text, margin: "20px 0 8px 0" }
          }
        >
          {block.text}
        </Heading>
      );

    case "text":
      return (
        <Text
          key={block.id}
          style={{ fontFamily: brand.fontBody, fontSize: "14px", lineHeight: "22px", color: brand.textSecondary, margin: "0 0 16px 0" }}
        >
          {renderInlineText(block.text)}
        </Text>
      );

    case "image": {
      const img = (
        <Img
          src={block.url}
          alt={block.alt}
          width="520"
          style={{ width: "100%", maxWidth: "520px", borderRadius: "4px", margin: "0 0 16px 0" }}
        />
      );
      return block.linkUrl ? (
        <Link key={block.id} href={block.linkUrl}>
          {img}
        </Link>
      ) : (
        <React.Fragment key={block.id}>{img}</React.Fragment>
      );
    }

    case "button":
      return (
        <Link
          key={block.id}
          href={block.url}
          style={
            block.style === "primary"
              ? {
                  display: "inline-block",
                  backgroundColor: brand.accent,
                  color: brand.text,
                  fontFamily: brand.fontBody,
                  fontWeight: 600,
                  fontSize: "14px",
                  borderRadius: "4px",
                  padding: "12px 28px",
                  textDecoration: "none",
                  margin: "8px 0 16px 0",
                }
              : {
                  display: "inline-block",
                  backgroundColor: "transparent",
                  color: brand.text,
                  border: `1px solid ${brand.text}`,
                  fontFamily: brand.fontBody,
                  fontWeight: 600,
                  fontSize: "14px",
                  borderRadius: "4px",
                  padding: "12px 28px",
                  textDecoration: "none",
                  margin: "8px 0 16px 0",
                }
          }
        >
          {block.label}
        </Link>
      );

    case "divider":
      return <Hr key={block.id} style={{ borderColor: brand.border, margin: "20px 0" }} />;

    case "spacer":
      return <div key={block.id} style={{ height: `${SPACER_HEIGHTS[block.height]}px` }} />;
  }
}
