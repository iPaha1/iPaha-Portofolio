// =============================================================================
// isaacpaha.com — Centralized Anthropic API client
// lib/ai/anthropic-client.ts
//
// Single source of truth for model selection + message calling.
// When Anthropic deprecates/renames a model, update MODEL here only —
// every tool that uses getClaudeCompletion() picks it up automatically.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── SINGLE PLACE TO UPDATE WHEN ANTHROPIC CHANGES MODELS ───────────────────
export const CLAUDE_MODEL = "claude-sonnet-5";

// Sonnet 5 doesn't support `temperature` (adaptive thinking replaces manual
// sampling control). Keep this flag so a future model swap that DOES support
// temperature again doesn't require touching every call site.
const MODEL_SUPPORTS_TEMPERATURE = false;

export interface ClaudeCompletionOptions {
  maxTokens?: number;
  temperature?: number; // only applied if MODEL_SUPPORTS_TEMPERATURE is true
  effort?: "low" | "medium" | "high"; // Sonnet 5 defaults to "high" via API
  system?: string; // optional system prompt to prepend to the user prompt
}

export interface ClaudeCompletionResult {
  text: string;
  stopReason: string | null;
  rawResponse: Anthropic.Message;
}

/**
 * Calls the Anthropic Messages API with the current model and safely
 * extracts the text block, regardless of whether thinking/other blocks
 * precede it in the content array.
 */
export async function getClaudeCompletion(
  prompt: string,
  options: ClaudeCompletionOptions = {}
): Promise<ClaudeCompletionResult> {
  const { maxTokens = 6000, temperature, effort, system } = options;

  const requestParams: Anthropic.MessageCreateParams = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };

  if (system) {
    requestParams.system = system;
  }

  if (MODEL_SUPPORTS_TEMPERATURE && temperature !== undefined) {
    requestParams.temperature = temperature;
  }

  if (effort) {
    // @ts-expect-error — effort may not yet be in the SDK's published types
    requestParams.effort = effort;
  }

  const message = await anthropic.messages.create(requestParams);

  // Find the text block by type, not position — thinking blocks (or other
  // block types) may precede it in content[].
  const textBlock = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const text = textBlock?.text ?? "";

  if (message.stop_reason === "max_tokens") {
    console.warn(
      `[anthropic-client] Response hit max_tokens (${maxTokens}) — output may be truncated. Consider raising maxTokens or lowering effort.`
    );
  }

  return {
    text,
    stopReason: message.stop_reason,
    rawResponse: message,
  };
}