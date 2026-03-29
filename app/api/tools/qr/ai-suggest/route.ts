// =============================================================================
// isaacpaha.com — QR Code Generator: AI Design Suggest API
// app/api/tools/qr/ai-suggest/route.ts
//
// POST { prompt, type, purpose }
// Claude analyses the use case and suggests colours, style, and CTA text
// Returns: { primaryColor, secondaryColor, bgColor, dotStyle, frameStyle, ctaText, label }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Tool token costs (in tokens per request)
const TOKEN_COST = 2000; // Adjust based on expected response length and model pricing

export async function POST(req: NextRequest) {
  try {

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
      const gate = await tokenGate(req, TOKEN_COST, { toolName: "QR Code AI Suggest" });
    console.log(`[qr/ai-suggest] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[qr/ai-suggest] Token gate passed for user ${gate.dbUserId}, proceeding with AI suggestion.`);

    const { prompt, type = "url", purpose = "" } = await req.json();

    const userIntent = prompt || purpose || type;

    const aiPrompt = `You are a brand designer specialising in QR code aesthetics. A user wants a QR code for: "${userIntent}" (type: ${type}).

Suggest a beautiful, professional QR code design. Return ONLY valid JSON (no markdown, no backticks):

{
  "primaryColor": "<hex — main QR dot colour, must have high contrast on the bg>",
  "secondaryColor": "<hex — gradient end colour, or same as primary if no gradient>",
  "bgColor": "<hex — background colour, default #ffffff>",
  "useGradient": <true|false>,
  "dotStyle": "<square|rounded|dots|classy|classy-rounded>",
  "cornerStyle": "<square|rounded|dot>",
  "frameStyle": "<none|simple|rounded|bold>",
  "ctaText": "<short, punchy call-to-action — e.g. 'Scan to view my portfolio' or 'Connect with me' — max 30 chars>",
  "label": "<2-3 word label for what this QR code is — e.g. 'My Portfolio', 'LinkedIn Profile', 'Pay Me'>",
  "reasoning": "<one sentence explaining your design choices>"
}

Design principles:
- Professional and modern, not garish
- High contrast ratio (min 4.5:1 between primaryColor and bgColor for scannability)
- Match the purpose: CVs/portfolios → professional (navy, charcoal, emerald), social → vibrant but clean, payment → trustworthy (green, navy), WiFi → friendly (blue, purple)
- Never use yellow on white (unreadable), never use red on red
- Gradients work well for modern/creative purposes
- frameStyle "bold" for marketing, "simple" for professional, "none" for minimal`;

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages:   [{ role: "user", content: aiPrompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let suggestion: any;
    try {
      suggestion = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]+\}/);
      suggestion  = match ? JSON.parse(match[0]) : {};
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
        await deductTokens(gate.dbUserId, TOKEN_COST, "qr/ai-suggest", { prompt, type, purpose, userId: gate.dbUserId });
    console.log(`[qr/ai-suggest] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for AI suggestion.`);

    return NextResponse.json({ ok: true, suggestion });
  } catch (err: any) {
    console.error("[qr/ai-suggest]", err);
    return NextResponse.json({ error: err.message ?? "AI suggestion failed" }, { status: 500 });
  }
}