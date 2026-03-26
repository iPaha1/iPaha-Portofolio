// =============================================================================
// isaacpaha.com — Message Rewriter API
// app/api/tools/message-rewriter/route.ts
//
// POST { message, tone, platform, mode, context }
// Returns: { rewrites: RewriteResult[], detectedContext: ContextDetection }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Tone definitions ─────────────────────────────────────────────────────────

const TONE_PROMPTS: Record<string, { label: string; desc: string; rules: string[] }> = {
  professional: {
    label: "Professional",
    desc:  "Clear, polished, and appropriate for work/business contexts",
    rules: [
      "Use formal but not stiff language",
      "Be specific and concrete",
      "Avoid slang, contractions where inappropriate, and filler words",
      "Project competence and reliability",
    ],
  },
  polite: {
    label: "Polite",
    desc:  "Warm, considerate, and diplomatically phrased",
    rules: [
      "Acknowledge the other person's perspective",
      "Soften requests with phrases like 'would you mind' or 'I'd appreciate'",
      "Express gratitude where natural",
      "Never sound demanding or presumptuous",
    ],
  },
  confident: {
    label: "Confident",
    desc:  "Direct, self-assured, and authoritative without being arrogant",
    rules: [
      "Use active voice throughout",
      "Remove hedging phrases ('I think maybe', 'kind of', 'sort of', 'just')",
      "State facts and requests directly",
      "Own your ideas — no unnecessary qualifiers",
    ],
  },
  direct: {
    label: "Direct",
    desc:  "Clear, concise, and straight to the point",
    rules: [
      "Lead with the main point immediately",
      "Cut everything that doesn't add meaning",
      "Use short sentences",
      "No preamble, no unnecessary pleasantries",
    ],
  },
  friendly: {
    label: "Friendly",
    desc:  "Warm, approachable, and conversational",
    rules: [
      "Use conversational language",
      "Add a light, personal touch where appropriate",
      "Sound like a real human, not a robot",
      "Maintain warmth without being overly familiar",
    ],
  },
  persuasive: {
    label: "Persuasive",
    desc:  "Compelling, benefit-focused, and convincing",
    rules: [
      "Lead with the benefit to the reader, not to yourself",
      "Use concrete evidence or reasons",
      "Create mild urgency or importance where genuine",
      "End with a clear, easy call to action",
    ],
  },
  empathetic: {
    label: "Empathetic",
    desc:  "Understanding, emotionally intelligent, and supportive",
    rules: [
      "Acknowledge feelings and circumstances first",
      "Avoid blame or judgment language",
      "Use 'we' framing where appropriate",
      "Show you understand before you request or state",
    ],
  },
  assertive: {
    label: "Assertive",
    desc:  "Firm, clear about needs, and respectful of boundaries",
    rules: [
      "State your position or need clearly once, then stop",
      "Avoid apologising for having a need",
      "No aggressive language, but no backing down",
      "Use 'I' statements",
    ],
  },
  formal: {
    label: "Formal",
    desc:  "Structured, proper English suitable for official correspondence",
    rules: [
      "Use complete sentences and proper grammar throughout",
      "No contractions",
      "Appropriate salutations and closings if it's an email",
      "Measured, precise vocabulary",
    ],
  },
  casual: {
    label: "Casual",
    desc:  "Relaxed, natural, everyday conversational tone",
    rules: [
      "Sound like you're texting a friend",
      "Contractions, relaxed grammar — but still clear",
      "Light and easy energy",
      "Short and punchy",
    ],
  },
  diplomatic: {
    label: "Diplomatic",
    desc:  "Tactful, careful with words, minimises friction",
    rules: [
      "Lead with common ground",
      "Reframe negatives as constructive observations",
      "Avoid 'you' accusations — use 'it seems' or 'I noticed'",
      "Close on a collaborative or positive note",
    ],
  },
  soften: {
    label: "Softer",
    desc:  "Makes a difficult message gentler without losing the meaning",
    rules: [
      "Cushion hard truths with genuine acknowledgment",
      "Separate the person from the issue",
      "Deliver the same message but with more care",
      "Do NOT remove the core message — just change how it lands",
    ],
  },
};

const PLATFORM_ADJUSTMENTS: Record<string, string> = {
  email:    "Format as an email body (no subject line). Use paragraphs. Slightly more formal.",
  slack:    "Shorter, punchier. No formal salutations. Works well in a Slack thread.",
  linkedin: "Professional network tone. No hashtags. Sounds polished and human, not like a press release.",
  text:     "Brief, conversational. Reads naturally on a phone. No corporate language.",
  whatsapp: "Casual and natural. Like a message between real people. Can use a little warmth.",
};

const MODE_INSTRUCTIONS: Record<string, string> = {
  shorten:    "Also significantly shorten the message — aim for 30-50% fewer words while preserving all meaning.",
  expand:     "Also expand the message — add relevant context, reasoning, or warmth to make it more complete.",
  persuasive: "Also make the message more persuasive — lead with benefit to the reader, add a clear ask.",
  aggressive_less: "Also significantly reduce any aggressive, demanding, or passive-aggressive undertones.",
  clearer:    "Also prioritise clarity above all — remove any ambiguity about what you're asking or saying.",
  soften:     "This is a difficult message. Soften it significantly without removing the core point.",
};

// ─── ROUTE ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      tone       = "professional",
      platform   = "general",
      mode       = "",
      count      = 2,        // how many variations (2 or 3)
    } = await req.json();

    if (!message?.trim() || message.trim().length < 5) {
      return NextResponse.json({ error: "Please enter a message to rewrite" }, { status: 400 });
    }
    if (message.trim().length > 3000) {
      return NextResponse.json({ error: "Message too long — keep it under 3000 characters" }, { status: 400 });
    }

    const toneCfg       = TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional;
    const platformNote  = PLATFORM_ADJUSTMENTS[platform] ?? "";
    const modeNote      = MODE_INSTRUCTIONS[mode]        ?? "";
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

Return ONLY valid JSON — no preamble, no backticks, no explanation outside the JSON.

ORIGINAL MESSAGE:
"""
${message.trim()}
"""`;

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw  = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const data  = JSON.parse(clean);

    return NextResponse.json({
      ok:              true,
      rewrites:        data.rewrites        ?? [],
      detectedContext: data.detectedContext ?? null,
    });

  } catch (err: any) {
    console.error("[message-rewriter]", err);
    return NextResponse.json({ error: err.message ?? "Rewrite failed — please try again" }, { status: 500 });
  }
}





// // =============================================================================
// // isaacpaha.com — Message Rewriter: Rewrite API
// // app/api/tools/message-rewriter/rewrite/route.ts
// //
// // POST {
// //   originalText: string,
// //   tone: "professional" | "polite" | "confident" | "friendly" | "direct" | "empathetic",
// //   platform: "email" | "slack" | "linkedin" | "text" | "general",
// //   intentMode: "persuasive" | "less-aggressive" | "clearer" | null,
// //   difficultyMode: "shorten" | "expand" | "soften" | null
// // }
// //
// // Returns JSON with 3 rewritten versions:
// //   - versions: [{ id, text, label, isPreferred? }]
// //   - contextNote: optional insight about the rewrite
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic from "@anthropic-ai/sdk";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // ─── Types ────────────────────────────────────────────────────────────────────

// type Tone = "professional" | "polite" | "confident" | "friendly" | "direct" | "empathetic";
// type Platform = "email" | "slack" | "linkedin" | "text" | "general";
// type IntentMode = "persuasive" | "less-aggressive" | "clearer" | null;
// type DifficultyMode = "shorten" | "expand" | "soften" | null;

// export interface RewriteRequest {
//   originalText:   string;
//   tone:           Tone;
//   platform?:      Platform;
//   intentMode?:    IntentMode;
//   difficultyMode?: DifficultyMode;
// }

// // ─── Tone configuration ───────────────────────────────────────────────────────

// const TONE_CONFIG: Record<Tone, { label: string; instructions: string; color: string }> = {
//   professional: {
//     label: "Professional",
//     instructions: "Formal, polished, workplace-appropriate. Use complete sentences, respectful language, and maintain professional boundaries. Avoid casual language, emojis, or slang.",
//     color: "#3b82f6",
//   },
//   polite: {
//     label: "Polite",
//     instructions: "Courteous, respectful, considerate. Use softeners ('would you mind', 'if possible'), express gratitude, and frame requests as collaborative rather than demanding.",
//     color: "#10b981",
//   },
//   confident: {
//     label: "Confident",
//     instructions: "Assertive, self-assured, clear. Use strong, declarative statements. Avoid hedging language ('I think', 'maybe'). Frame requests as expectations rather than questions when appropriate.",
//     color: "#f59e0b",
//   },
//   friendly: {
//     label: "Friendly",
//     instructions: "Warm, approachable, conversational. Use casual language, appropriate emojis if fitting, and create a sense of connection. Be genuine, not forced.",
//     color: "#ec4899",
//   },
//   direct: {
//     label: "Direct",
//     instructions: "Concise, to the point, no fluff. Eliminate pleasantries, cut unnecessary words, and state the core message immediately. Respectful but efficient.",
//     color: "#ef4444",
//   },
//   empathetic: {
//     label: "Empathetic",
//     instructions: "Understanding, compassionate, kind. Acknowledge feelings, validate experiences, and show you're considering their perspective. Use gentle language.",
//     color: "#8b5cf6",
//   },
// };

// // ─── Platform-specific context ────────────────────────────────────────────────

// const PLATFORM_CONTEXT: Record<Platform, { context: string; toneShift: string }> = {
//   general: {
//     context: "General communication",
//     toneShift: "Neutral — adapt naturally to the chosen tone",
//   },
//   email: {
//     context: "Email communication — slightly more formal, proper subject line structure expected, professional greeting and closing",
//     toneShift: "Slightly more formal than other platforms",
//   },
//   slack: {
//     context: "Slack or team chat — can be more casual, shorter messages, optional greeting, use of threads implied",
//     toneShift: "More conversational, can be concise, emojis acceptable if appropriate",
//   },
//   linkedin: {
//     context: "LinkedIn — professional network, career context, maintain professional reputation, slightly more formal than general",
//     toneShift: "Professional but personable — no oversharing, maintain career-appropriate tone",
//   },
//   text: {
//     context: "Text message / SMS / WhatsApp — casual, shorter, emojis common, informal greeting optional",
//     toneShift: "Conversational, can use abbreviations naturally, warmth is welcome",
//   },
// };

// // ─── Intent mode instructions ─────────────────────────────────────────────────

// const INTENT_INSTRUCTIONS: Record<NonNullable<IntentMode>, string> = {
//   persuasive: "Make this more persuasive: use compelling language, highlight benefits, create urgency appropriately, and structure to convince the reader.",
//   "less-aggressive": "Make this less aggressive: soften demands, remove accusatory language, use collaborative framing, and maintain the core message without the confrontational edge.",
//   clearer: "Make this clearer: eliminate ambiguity, use simpler sentence structure, make the main point obvious, and remove jargon or vague language.",
// };

// const DIFFICULTY_INSTRUCTIONS: Record<NonNullable<DifficultyMode>, string> = {
//   shorten: "Shorten this message: cut unnecessary words, remove repetition, make it concise while preserving the core meaning. Aim for 40-60% of original length.",
//   expand: "Expand this message: add relevant detail, provide more context, explain more thoroughly while keeping the same tone. Aim for 150-200% of original length.",
//   soften: "Soften this message: make it gentler, more diplomatic, less likely to cause offence. This is for sensitive messages — rejections, difficult feedback, delicate topics. Keep the core meaning but wrap it in kindness.",
// };

// // ─── Prompt builder ──────────────────────────────────────────────────────────

// function buildPrompt(data: RewriteRequest): string {
//   const toneConfig = TONE_CONFIG[data.tone];
//   const platformContext = data.platform ? PLATFORM_CONTEXT[data.platform] : PLATFORM_CONTEXT.general;
  
//   let instructions = `You are an expert communication coach and writer. Your skill is taking someone's raw message and making it sound exactly how they want — keeping their meaning, just saying it better.

// TASK: Rewrite the following message to sound ${toneConfig.label}.

// CORE RULES:
// - Keep the original meaning — do NOT change what the person is saying
// - Do NOT add new information unless it's implied by context
// - Preserve any specific requests, questions, or action items
// - The message should sound like the same person wrote it — just clearer
// - Be respectful, never condescending
// - Output 3 distinct versions with slightly different approaches

// TONE: ${toneConfig.label}
// ${toneConfig.instructions}

// PLATFORM: ${platformContext.context}
// ${platformContext.toneShift}`;

//   if (data.intentMode) {
//     instructions += `\n\nINTENT MODE: ${INTENT_INSTRUCTIONS[data.intentMode]}`;
//   }

//   if (data.difficultyMode) {
//     instructions += `\n\nDIFFICULTY MODE: ${DIFFICULTY_INSTRUCTIONS[data.difficultyMode]}`;
//   }

//   instructions += `

// ORIGINAL MESSAGE:
// "${data.originalText}"

// Return ONLY valid JSON (no markdown, no backticks, no explanation):

// {
//   "versions": [
//     {
//       "id": "v1",
//       "text": "<first rewritten version — preserve meaning, apply tone>",
//       "label": "<brief label describing this version's flavour — e.g. 'Standard', 'Slightly warmer', 'More concise'>",
//       "isPreferred": <true if this is likely the best match for the tone and intent>
//     },
//     {
//       "id": "v2",
//       "text": "<second rewritten version — slightly different approach>",
//       "label": "<brief label>",
//       "isPreferred": false
//     },
//     {
//       "id": "v3",
//       "text": "<third rewritten version — most distinct variation>",
//       "label": "<brief label>",
//       "isPreferred": false
//     }
//   ],
//   "contextNote": "<optional 1-sentence insight — e.g. 'I softened the request while keeping your deadline clear' or 'Made this more direct — removed two hedging phrases'>"
// }

// RULES FOR VERSIONS:
// - Version 1 should be the most natural application of the requested tone
// - Version 2 can be slightly warmer or more formal within the same tone
// - Version 3 can be the most concise or creative within the tone
// - All versions must preserve the core meaning
// - Labels should be short: "Standard", "Warmer", "Concise", "Formal", "Casual", "Direct", etc.
// - Mark exactly ONE version as isPreferred = true — the one that best achieves the requested tone

// If the original message is already perfect for the requested tone, acknowledge this in contextNote and provide the original as one version with minor polish.`;
  
//   return instructions;
// }

// // ─── Generate fallback versions (if API fails) ───────────────────────────────

// function generateFallbackVersions(original: string, tone: Tone): any {
//   const toneConfig = TONE_CONFIG[tone];
  
//   return {
//     versions: [
//       {
//         id: "v1",
//         text: original,
//         label: "Original",
//         isPreferred: false,
//       },
//       {
//         id: "v2",
//         text: original,
//         label: `${toneConfig.label} version`,
//         isPreferred: true,
//       },
//       {
//         id: "v3",
//         text: original,
//         label: "Concise",
//         isPreferred: false,
//       },
//     ],
//     contextNote: "We couldn't generate the full rewrite right now — here's the original. Please try again.",
//   };
// }

// // ─── Route Handler ───────────────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   try {
//     const body: RewriteRequest = await req.json();

//     // Validation
//     if (!body.originalText?.trim() || body.originalText.trim().length < 3) {
//       return NextResponse.json(
//         { error: "Please enter a message to rewrite (at least 3 characters)" },
//         { status: 400 }
//       );
//     }

//     if (body.originalText.length > 5000) {
//       return NextResponse.json(
//         { error: "Message is too long (max 5000 characters). Try shortening it first." },
//         { status: 400 }
//       );
//     }

//     if (!body.tone || !TONE_CONFIG[body.tone]) {
//       return NextResponse.json(
//         { error: "Please select a valid tone" },
//         { status: 400 }
//       );
//     }

//     const prompt = buildPrompt(body);

//     const message = await anthropic.messages.create({
//       model: "claude-sonnet-4-20250514",
//       max_tokens: 2000,
//       temperature: 0.7,
//       messages: [{ role: "user", content: prompt }],
//     });

//     const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let result: any;
//     try {
//       result = JSON.parse(clean);
//     } catch (parseError) {
//       // Try to extract JSON from the response
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) {
//         console.error("[message-rewriter] Failed to parse AI response:", clean);
//         return NextResponse.json(
//           { result: generateFallbackVersions(body.originalText, body.tone) },
//           { status: 200 }
//         );
//       }
//       try {
//         result = JSON.parse(match[0]);
//       } catch {
//         console.error("[message-rewriter] Failed to parse extracted JSON:", match[0]);
//         return NextResponse.json(
//           { result: generateFallbackVersions(body.originalText, body.tone) },
//           { status: 200 }
//         );
//       }
//     }

//     // Ensure we have the expected structure
//     if (!result.versions || !Array.isArray(result.versions) || result.versions.length < 3) {
//       result = generateFallbackVersions(body.originalText, body.tone);
//     }

//     // Clean up any undefined values
//     result.versions = result.versions.slice(0, 3).map((v: any, i: number) => ({
//       id: v.id || `v${i + 1}`,
//       text: v.text || body.originalText,
//       label: v.label || `Option ${i + 1}`,
//       isPreferred: v.isPreferred === true,
//     }));

//     // Ensure exactly one preferred version
//     if (!result.versions.some((v: any) => v.isPreferred)) {
//       result.versions[0].isPreferred = true;
//     }

//     return NextResponse.json({ ok: true, result });
//   } catch (err: any) {
//     console.error("[message-rewriter/rewrite]", err);
    
//     // Return fallback response instead of error
//     const body = await req.json().catch(() => ({ originalText: "", tone: "professional" }));
//     return NextResponse.json(
//       { result: generateFallbackVersions(body.originalText || "Your message here", body.tone || "professional") },
//       { status: 200 }
//     );
//   }
// }