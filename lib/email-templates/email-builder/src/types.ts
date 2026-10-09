// ============================================================================
// @ipaha/email-builder — types.ts
//
// The block schema is the single source of truth for email structure,
// used in three places that must always agree:
//   1. The visual editor (apps/admin/components/marketing/editor) — reads
//      and writes Block[]
//   2. The renderer (render.tsx) — turns Block[] into the actual
//      react-email JSX sent via Resend
//   3. AI drafting (apps/api .../ai/draft-email) — Claude is prompted to
//      return JSON matching this exact shape
//
// Deliberately NOT supporting CSS animations or video — these don't
// render reliably (or at all) across email clients (Outlook in particular
// strips most CSS, Gmail sandboxes a lot). "Premium" in email means
// considered layout, good imagery, and clear CTAs — not motion. Building
// animation support would produce something that looks broken for a large
// fraction of recipients, which is the opposite of premium.
// ============================================================================

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock;

interface BaseBlock {
  /** Stable client-generated id, used as React key and for editor
   * selection/reordering — never persisted as meaningful data. */
  id: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  text: string;
  level: "h1" | "h2"; // h1 = main heading style, h2 = sub-heading — mirrors EmailLayout's existing heading/subheading visual scale
}

export interface TextBlock extends BaseBlock {
  type: "text";
  /** Plain text with a small set of inline markers supported by the
   * renderer: **bold**, _italic_, [link text](url) — intentionally not
   * full markdown or rich HTML, to keep the AI output format simple and
   * the renderer's email-client compatibility predictable. */
  text: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string; // Cloudinary URL, uploaded via the existing /api/uploads route from Phase 2
  alt: string;
  /** Optional link — clicking the image navigates here, common for
   * product/feature announcement images. */
  linkUrl?: string;
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  url: string;
  /** primary = filled amber (matches EmailButton from earlier phases),
   * secondary = outlined — gives campaigns the same two-tier CTA language
   * as the rest of the brand system. */
  style: "primary" | "secondary";
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: "sm" | "md" | "lg"; // maps to fixed pixel values in render.tsx, not arbitrary px — keeps AI output and editor UI simple (a dropdown, not a number input)
}

/** A complete email's worth of blocks, plus the subject line — what gets
 * stored on Campaign.contentBlocks and EmailTemplate.blocks, and what the
 * AI drafting endpoint returns. */
export interface EmailDraft {
  subject: string;
  blocks: Block[];
}
