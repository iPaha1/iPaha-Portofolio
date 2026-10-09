import { z } from "zod";

// ============================================================================
// @ipaha/email-builder — validate.ts
//
// Runtime validation mirroring types.ts exactly. Two critical uses:
//   1. Validating Claude's JSON output before it ever reaches the editor
//      or gets saved — AI output is never trusted blindly, same principle
//      as validating any other external input.
//   2. Validating campaign/template save payloads in apps/api, same as
//      every other route in this codebase uses Zod.
// ============================================================================

const baseBlockSchema = z.object({ id: z.string() });

export const headingBlockSchema = baseBlockSchema.extend({
  type: z.literal("heading"),
  text: z.string().min(1),
  level: z.enum(["h1", "h2"]),
});

export const textBlockSchema = baseBlockSchema.extend({
  type: z.literal("text"),
  text: z.string().min(1),
});

export const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal("image"),
  url: z.string().url(),
  alt: z.string(),
  linkUrl: z.string().url().optional(),
});

export const buttonBlockSchema = baseBlockSchema.extend({
  type: z.literal("button"),
  label: z.string().min(1),
  url: z.string().url(),
  style: z.enum(["primary", "secondary"]),
});

export const dividerBlockSchema = baseBlockSchema.extend({
  type: z.literal("divider"),
});

export const spacerBlockSchema = baseBlockSchema.extend({
  type: z.literal("spacer"),
  height: z.enum(["sm", "md", "lg"]),
});

export const blockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  dividerBlockSchema,
  spacerBlockSchema,
]);

export const emailDraftSchema = z.object({
  subject: z.string().min(1),
  blocks: z.array(blockSchema).min(1),
});
