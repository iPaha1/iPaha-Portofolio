// =============================================================================
// isaacpaha.com — Message Rewriter API
// app/api/tools/message-rewriter/route.ts
//
// POST { message, tone, platform, mode, context }
// Returns: { rewrites: RewriteResult[], detectedContext: ContextDetection }

// Token cost: 100 tokens per rewrite (matches tools-data.ts tokenCost)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "message-rewriter";
const TOKEN_COST = 100; // Matches tools-data.ts tokenCost
const TOOL_NAME = "Message Rewriter";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[message-rewriter] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[message-rewriter] Failed to load tool ID:`, err);
}

// ─── Tone definitions ─────────────────────────────────────────────────────────

const TONE_PROMPTS: Record<string, { label: string; desc: string; rules: string[] }> = {
  professional: {
    label: "Professional",
    desc: "Clear, polished, and appropriate for work/business contexts",
    rules: [
      "Use formal but not stiff language",
      "Be specific and concrete",
      "Avoid slang, contractions where inappropriate, and filler words",
      "Project competence and reliability",
    ],
  },
  polite: {
    label: "Polite",
    desc: "Warm, considerate, and diplomatically phrased",
    rules: [
      "Acknowledge the other person's perspective",
      "Soften requests with phrases like 'would you mind' or 'I'd appreciate'",
      "Express gratitude where natural",
      "Never sound demanding or presumptuous",
    ],
  },
  confident: {
    label: "Confident",
    desc: "Direct, self-assured, and authoritative without being arrogant",
    rules: [
      "Use active voice throughout",
      "Remove hedging phrases ('I think maybe', 'kind of', 'sort of', 'just')",
      "State facts and requests directly",
      "Own your ideas — no unnecessary qualifiers",
    ],
  },
  direct: {
    label: "Direct",
    desc: "Clear, concise, and straight to the point",
    rules: [
      "Lead with the main point immediately",
      "Cut everything that doesn't add meaning",
      "Use short sentences",
      "No preamble, no unnecessary pleasantries",
    ],
  },
  friendly: {
    label: "Friendly",
    desc: "Warm, approachable, and conversational",
    rules: [
      "Use conversational language",
      "Add a light, personal touch where appropriate",
      "Sound like a real human, not a robot",
      "Maintain warmth without being overly familiar",
    ],
  },
  persuasive: {
    label: "Persuasive",
    desc: "Compelling, benefit-focused, and convincing",
    rules: [
      "Lead with the benefit to the reader, not to yourself",
      "Use concrete evidence or reasons",
      "Create mild urgency or importance where genuine",
      "End with a clear, easy call to action",
    ],
  },
  empathetic: {
    label: "Empathetic",
    desc: "Understanding, emotionally intelligent, and supportive",
    rules: [
      "Acknowledge feelings and circumstances first",
      "Avoid blame or judgment language",
      "Use 'we' framing where appropriate",
      "Show you understand before you request or state",
    ],
  },
  assertive: {
    label: "Assertive",
    desc: "Firm, clear about needs, and respectful of boundaries",
    rules: [
      "State your position or need clearly once, then stop",
      "Avoid apologising for having a need",
      "No aggressive language, but no backing down",
      "Use 'I' statements",
    ],
  },
  formal: {
    label: "Formal",
    desc: "Structured, proper English suitable for official correspondence",
    rules: [
      "Use complete sentences and proper grammar throughout",
      "No contractions",
      "Appropriate salutations and closings if it's an email",
      "Measured, precise vocabulary",
    ],
  },
  casual: {
    label: "Casual",
    desc: "Relaxed, natural, everyday conversational tone",
    rules: [
      "Sound like you're texting a friend",
      "Contractions, relaxed grammar — but still clear",
      "Light and easy energy",
      "Short and punchy",
    ],
  },
  diplomatic: {
    label: "Diplomatic",
    desc: "Tactful, careful with words, minimises friction",
    rules: [
      "Lead with common ground",
      "Reframe negatives as constructive observations",
      "Avoid 'you' accusations — use 'it seems' or 'I noticed'",
      "Close on a collaborative or positive note",
    ],
  },
  soften: {
    label: "Softer",
    desc: "Makes a difficult message gentler without losing the meaning",
    rules: [
      "Cushion hard truths with genuine acknowledgment",
      "Separate the person from the issue",
      "Deliver the same message but with more care",
      "Do NOT remove the core message — just change how it lands",
    ],
  },
};

const PLATFORM_ADJUSTMENTS: Record<string, string> = {
  email: "Format as an email body (no subject line). Use paragraphs. Slightly more formal.",
  slack: "Shorter, punchier. No formal salutations. Works well in a Slack thread.",
  linkedin: "Professional network tone. No hashtags. Sounds polished and human, not like a press release.",
  text: "Brief, conversational. Reads naturally on a phone. No corporate language.",
  whatsapp: "Casual and natural. Like a message between real people. Can use a little warmth.",
  general: "Neutral — adapt naturally to the chosen tone",
};

const MODE_INSTRUCTIONS: Record<string, string> = {
  shorten: "Also significantly shorten the message — aim for 30-50% fewer words while preserving all meaning.",
  expand: "Also expand the message — add relevant context, reasoning, or warmth to make it more complete.",
  persuasive: "Also make the message more persuasive — lead with benefit to the reader, add a clear ask.",
  aggressive_less: "Also significantly reduce any aggressive, demanding, or passive-aggressive undertones.",
  clearer: "Also prioritise clarity above all — remove any ambiguity about what you're asking or saying.",
  soften: "This is a difficult message. Soften it significantly without removing the core point.",
};

// Helper to clean and parse JSON
function cleanAndParseJSON(rawResponse: string): any {
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) throw new Error("No JSON object found");
  
  let jsonStr = jsonMatch[0];
  let inString = false;
  let escaped = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const prevChar = i > 0 ? jsonStr[i - 1] : '';
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      escaped += char;
    } else {
      escaped += char;
    }
  }
  
  return JSON.parse(escaped);
}

// Generate fallback versions if AI fails
function generateFallbackVersions(originalMessage: string, tone: string): any {
  const toneCfg = TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional;
  
  return {
    rewrites: [
      {
        label: "Original",
        text: originalMessage,
      },
      {
        label: `${toneCfg.label} version`,
        text: originalMessage,
      },
      {
        label: "Concise version",
        text: originalMessage,
      },
    ],
    detectedContext: {
      type: "Other",
      recommendedTone: tone,
      recommendedToneLabel: toneCfg.label,
      reason: "Using requested tone as fallback",
    },
  };
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const {
      message,
      tone = "professional",
      platform = "general",
      mode = "",
      count = 2,        // how many variations (2 or 3)
    } = await req.json();

    // Validate input
    if (!message?.trim() || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Please enter a message to rewrite (minimum 5 characters)" },
        { status: 400 }
      );
    }
    
    if (message.trim().length > 3000) {
      return NextResponse.json(
        { error: "Message too long — keep it under 3000 characters" },
        { status: 400 }
      );
    }

    // Validate tone
    const validTones = Object.keys(TONE_PROMPTS);
    const validTone = validTones.includes(tone) ? tone : "professional";

    // Validate platform
    const validPlatforms = Object.keys(PLATFORM_ADJUSTMENTS);
    const validPlatform = validPlatforms.includes(platform) ? platform : "general";

    // Validate mode
    const validModes = Object.keys(MODE_INSTRUCTIONS);
    const validMode = validModes.includes(mode) ? mode : "";

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[message-rewriter] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[message-rewriter] Token gate passed for user ${gateResult.dbUserId}`);

    const toneCfg = TONE_PROMPTS[validTone];
    const platformNote = PLATFORM_ADJUSTMENTS[validPlatform] || "";
    const modeNote = validMode ? MODE_INSTRUCTIONS[validMode] : "";
    const numVariations = Math.min(Math.max(Number(count) || 2, 2), 3);

    const systemPrompt = `You are a world-class communication coach and professional writer. You help people express themselves better — clearer, smarter, and with the right tone.

Your job: rewrite the user's message in the requested tone while keeping the EXACT original meaning and intent. Never change what they're trying to say — only change HOW they say it.

GOLDEN RULES:
- Preserve 100% of the original intent and meaning
- Never add information the user didn't imply
- Never remove key information
- The rewrite should feel like something the user themselves could have written — just better
- Match the length appropriately to the tone (formal tends longer, direct tends shorter)

TONE: ${toneCfg.label.toUpperCase()} — ${toneCfg.desc}
Tone rules:
${toneCfg.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}
${platformNote ? `\nPLATFORM: ${platformNote}` : ""}
${modeNote ? `\nSPECIAL MODE: ${modeNote}` : ""}`;

    const userPrompt = `Please rewrite this message ${numVariations} different ways in the ${toneCfg.label} tone. Each version should feel noticeably different from the others — vary the approach, structure, or specific phrasing while keeping the same tone and meaning.

Also detect and return:
1. The context type of the original message (Work | Casual | Complaint | Request | Apology | Feedback | Negotiation | Other)
2. The recommended tone for this message (your professional opinion — one of: professional/polite/confident/direct/friendly/empathetic/assertive/diplomatic)
3. One-sentence explanation of why you recommend that tone
4. A short label for each variation that describes its specific angle (e.g. "Warm & direct", "Formal close", "Soft opener")

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Respond in this EXACT JSON format:
{
  "detectedContext": {
    "type": "<Work|Casual|Complaint|Request|Apology|Feedback|Negotiation|Other>",
    "recommendedTone": "<tone id from the list>",
    "recommendedToneLabel": "<display name>",
    "reason": "<one sentence why>"
  },
  "rewrites": [
    {
      "label": "<2-4 word description of this variation's angle>",
      "text": "<the rewritten message>"
    }
  ]
}

ORIGINAL MESSAGE:
"""
${message.trim()}
"""`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.5, // Balanced between creativity and consistency
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const processingMs = Date.now() - start;
    
    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    
    let data: any;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      data = JSON.parse(noTrailing);
    } catch (firstError) {
      try {
        data = cleanAndParseJSON(raw);
      } catch (secondError) {
        console.error(`[message-rewriter] All parsing attempts failed`);
        console.error(`[message-rewriter] Raw response (first 500 chars):`, raw.slice(0, 500));
        
        // Use fallback
        data = generateFallbackVersions(message, validTone);
      }
    }

    // Validate response structure
    if (!data.rewrites || !Array.isArray(data.rewrites) || data.rewrites.length === 0) {
      data.rewrites = generateFallbackVersions(message, validTone).rewrites;
    }
    
    if (!data.detectedContext) {
      data.detectedContext = {
        type: "Other",
        recommendedTone: validTone,
        recommendedToneLabel: toneCfg.label,
        reason: "Based on the content analysis",
      };
    }
    
    // Ensure we have exactly numVariations rewrites
    if (data.rewrites.length > numVariations) {
      data.rewrites = data.rewrites.slice(0, numVariations);
    } else if (data.rewrites.length < numVariations) {
      while (data.rewrites.length < numVariations) {
        data.rewrites.push({
          label: `Variation ${data.rewrites.length + 1}`,
          text: message.trim(),
        });
      }
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "message-rewriter/rewrite", {
      tone: validTone,
      platform: validPlatform,
      mode: validMode,
      count: numVariations,
      messageLength: message.length,
      processingMs,
    });
    console.log(`[message-rewriter] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ③ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[message-rewriter] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({
      ok: true,
      rewrites: data.rewrites,
      detectedContext: data.detectedContext,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        tone: validTone,
        platform: validPlatform,
        mode: validMode || "none",
        variationCount: data.rewrites.length,
      },
    });
  } catch (err: any) {
    console.error("[message-rewriter] Error:", err);

    // Track failed usage (no token deduction on failure)
    try {
      await trackToolUsage({
        toolId: TOOL_ID,
        toolName: TOOL_NAME,
        ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start,
        wasSuccess: false,
        errorMsg: err.message || "Unknown error",
      });
    } catch (trackError) {
      console.error("[message-rewriter] Failed to track error:", trackError);
    }
    
    // Try to get original message for fallback
    let originalMessage = "";
    try {
      const body = await req.json();
      originalMessage = body.message || "";
    } catch {
      // Ignore
    }
    
    const fallback = generateFallbackVersions(originalMessage || "Your message here", "professional");
    
    return NextResponse.json({
      ok: true,
      rewrites: fallback.rewrites,
      detectedContext: fallback.detectedContext,
      warning: "Limited functionality available due to service issues",
      metadata: {
        isFallback: true,
      },
    }, { status: 200 });
  }
}







// // =============================================================================
// // isaacpaha.com — Message Rewriter API
// // app/api/tools/message-rewriter/route.ts
// //
// // POST { message, tone, platform, mode, context }
// // Returns: { rewrites: RewriteResult[], detectedContext: ContextDetection }

// // Token cost: 100 tokens per rewrite (matches tools-data.ts tokenCost)
// // ─── Changes from original ────────────────────────────────────────────────────
// //   1. Import tokenGate + deductTokens
// //   2. Call tokenGate(req, 100) at the top — returns 402 if wallet is short
// //   3. Call deductTokens() after successful AI response
// //   Everything else is identical to the original route.
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token cost is 100 tokens per rewrite request, which includes 3 variations and context detection.
// const TOKEN_COST = 100000000; 

// // ─── Tone definitions ─────────────────────────────────────────────────────────

// const TONE_PROMPTS: Record<string, { label: string; desc: string; rules: string[] }> = {
//   professional: {
//     label: "Professional",
//     desc:  "Clear, polished, and appropriate for work/business contexts",
//     rules: [
//       "Use formal but not stiff language",
//       "Be specific and concrete",
//       "Avoid slang, contractions where inappropriate, and filler words",
//       "Project competence and reliability",
//     ],
//   },
//   polite: {
//     label: "Polite",
//     desc:  "Warm, considerate, and diplomatically phrased",
//     rules: [
//       "Acknowledge the other person's perspective",
//       "Soften requests with phrases like 'would you mind' or 'I'd appreciate'",
//       "Express gratitude where natural",
//       "Never sound demanding or presumptuous",
//     ],
//   },
//   confident: {
//     label: "Confident",
//     desc:  "Direct, self-assured, and authoritative without being arrogant",
//     rules: [
//       "Use active voice throughout",
//       "Remove hedging phrases ('I think maybe', 'kind of', 'sort of', 'just')",
//       "State facts and requests directly",
//       "Own your ideas — no unnecessary qualifiers",
//     ],
//   },
//   direct: {
//     label: "Direct",
//     desc:  "Clear, concise, and straight to the point",
//     rules: [
//       "Lead with the main point immediately",
//       "Cut everything that doesn't add meaning",
//       "Use short sentences",
//       "No preamble, no unnecessary pleasantries",
//     ],
//   },
//   friendly: {
//     label: "Friendly",
//     desc:  "Warm, approachable, and conversational",
//     rules: [
//       "Use conversational language",
//       "Add a light, personal touch where appropriate",
//       "Sound like a real human, not a robot",
//       "Maintain warmth without being overly familiar",
//     ],
//   },
//   persuasive: {
//     label: "Persuasive",
//     desc:  "Compelling, benefit-focused, and convincing",
//     rules: [
//       "Lead with the benefit to the reader, not to yourself",
//       "Use concrete evidence or reasons",
//       "Create mild urgency or importance where genuine",
//       "End with a clear, easy call to action",
//     ],
//   },
//   empathetic: {
//     label: "Empathetic",
//     desc:  "Understanding, emotionally intelligent, and supportive",
//     rules: [
//       "Acknowledge feelings and circumstances first",
//       "Avoid blame or judgment language",
//       "Use 'we' framing where appropriate",
//       "Show you understand before you request or state",
//     ],
//   },
//   assertive: {
//     label: "Assertive",
//     desc:  "Firm, clear about needs, and respectful of boundaries",
//     rules: [
//       "State your position or need clearly once, then stop",
//       "Avoid apologising for having a need",
//       "No aggressive language, but no backing down",
//       "Use 'I' statements",
//     ],
//   },
//   formal: {
//     label: "Formal",
//     desc:  "Structured, proper English suitable for official correspondence",
//     rules: [
//       "Use complete sentences and proper grammar throughout",
//       "No contractions",
//       "Appropriate salutations and closings if it's an email",
//       "Measured, precise vocabulary",
//     ],
//   },
//   casual: {
//     label: "Casual",
//     desc:  "Relaxed, natural, everyday conversational tone",
//     rules: [
//       "Sound like you're texting a friend",
//       "Contractions, relaxed grammar — but still clear",
//       "Light and easy energy",
//       "Short and punchy",
//     ],
//   },
//   diplomatic: {
//     label: "Diplomatic",
//     desc:  "Tactful, careful with words, minimises friction",
//     rules: [
//       "Lead with common ground",
//       "Reframe negatives as constructive observations",
//       "Avoid 'you' accusations — use 'it seems' or 'I noticed'",
//       "Close on a collaborative or positive note",
//     ],
//   },
//   soften: {
//     label: "Softer",
//     desc:  "Makes a difficult message gentler without losing the meaning",
//     rules: [
//       "Cushion hard truths with genuine acknowledgment",
//       "Separate the person from the issue",
//       "Deliver the same message but with more care",
//       "Do NOT remove the core message — just change how it lands",
//     ],
//   },
// };

// const PLATFORM_ADJUSTMENTS: Record<string, string> = {
//   email:    "Format as an email body (no subject line). Use paragraphs. Slightly more formal.",
//   slack:    "Shorter, punchier. No formal salutations. Works well in a Slack thread.",
//   linkedin: "Professional network tone. No hashtags. Sounds polished and human, not like a press release.",
//   text:     "Brief, conversational. Reads naturally on a phone. No corporate language.",
//   whatsapp: "Casual and natural. Like a message between real people. Can use a little warmth.",
// };

// const MODE_INSTRUCTIONS: Record<string, string> = {
//   shorten:    "Also significantly shorten the message — aim for 30-50% fewer words while preserving all meaning.",
//   expand:     "Also expand the message — add relevant context, reasoning, or warmth to make it more complete.",
//   persuasive: "Also make the message more persuasive — lead with benefit to the reader, add a clear ask.",
//   aggressive_less: "Also significantly reduce any aggressive, demanding, or passive-aggressive undertones.",
//   clearer:    "Also prioritise clarity above all — remove any ambiguity about what you're asking or saying.",
//   soften:     "This is a difficult message. Soften it significantly without removing the core point.",
// };

// // ─── ROUTE ────────────────────────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   try {
//     const {
//       message,
//       tone       = "professional",
//       platform   = "general",
//       mode       = "",
//       count      = 2,        // how many variations (2 or 3)
//     } = await req.json();

//     if (!message?.trim() || message.trim().length < 5) {
//       return NextResponse.json({ error: "Please enter a message to rewrite" }, { status: 400 });
//     }
//     if (message.trim().length > 3000) {
//       return NextResponse.json({ error: "Message too long — keep it under 3000 characters" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Message Rewriter" });
//     console.log("[message-rewriter] Token gate check result:", gate);
//     // console.log(`[message-rewriter] Token gate check for user ${gate.dbUserId} — required: ${TOKEN_COST}, balance: ${gate.balance}`);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[message-rewriter] Token gate passed for user ${gate.dbUserId} — proceeding with rewrite`);

//     const toneCfg       = TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional;
//     const platformNote  = PLATFORM_ADJUSTMENTS[platform] ?? "";
//     const modeNote      = MODE_INSTRUCTIONS[mode]        ?? "";
//     const numVariations = Math.min(Math.max(Number(count) || 2, 2), 3);

//     const systemPrompt = `You are a world-class communication coach and professional writer. You help people express themselves better — clearer, smarter, and with the right tone.

// Your job: rewrite the user's message in the requested tone while keeping the EXACT original meaning and intent. Never change what they're trying to say — only change HOW they say it.

// GOLDEN RULES:
// - Preserve 100% of the original intent and meaning
// - Never add information the user didn't imply
// - Never remove key information
// - The rewrite should feel like something the user themselves could have written — just better
// - Match the length appropriately to the tone (formal tends longer, direct tends shorter)

// TONE: ${toneCfg.label.toUpperCase()} — ${toneCfg.desc}
// Tone rules:
// ${toneCfg.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}
// ${platformNote ? `\nPLATFORM: ${platformNote}` : ""}
// ${modeNote ? `\nSPECIAL MODE: ${modeNote}` : ""}`;

//     const userPrompt = `Please rewrite this message ${numVariations} different ways in the ${toneCfg.label} tone. Each version should feel noticeably different from the others — vary the approach, structure, or specific phrasing while keeping the same tone and meaning.

// Also detect and return:
// 1. The context type of the original message (Work | Casual | Complaint | Request | Apology | Feedback | Negotiation | Other)
// 2. The recommended tone for this message (your professional opinion — one of: professional/polite/confident/direct/friendly/empathetic/assertive/diplomatic)
// 3. One-sentence explanation of why you recommend that tone
// 4. A short label for each variation that describes its specific angle (e.g. "Warm & direct", "Formal close", "Soft opener")

// Respond in this EXACT JSON format:
// {
//   "detectedContext": {
//     "type": "<Work|Casual|Complaint|Request|Apology|Feedback|Negotiation|Other>",
//     "recommendedTone": "<tone id from the list>",
//     "recommendedToneLabel": "<display name>",
//     "reason": "<one sentence why>"
//   },
//   "rewrites": [
//     {
//       "label": "<2-4 word description of this variation's angle>",
//       "text": "<the rewritten message>"
//     }
//   ]
// }

// Return ONLY valid JSON — no preamble, no backticks, no explanation outside the JSON.

// ORIGINAL MESSAGE:
// """
// ${message.trim()}
// """`;

//     const response = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 2000,
//       system:     systemPrompt,
//       messages:   [{ role: "user", content: userPrompt }],
//     });

//     const raw  = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
//     const clean = raw.replace(/```json|```/g, "").trim();
//     const data  = JSON.parse(clean);

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "message-rewriter/rewrite", {
//       tone, platform, mode, count: numVariations,
//     });
//     console.log(`[message-rewriter] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} — new balance: ${gate.balance - TOKEN_COST}`);

//     return NextResponse.json({
//       ok:              true,
//       rewrites:        data.rewrites        ?? [],
//       detectedContext: data.detectedContext ?? null,
//     });

//   } catch (err: any) {
//     console.error("[message-rewriter]", err);
//     return NextResponse.json({ error: err.message ?? "Rewrite failed — please try again" }, { status: 500 });
//   }
// }



