// =============================================================================
// isaacpaha.com — QR Code Generator: AI Design Suggest API
// app/api/tools/qr/ai-suggest/route.ts
//
// POST { prompt, type, purpose }
// Claude analyses the use case and suggests colours, style, and CTA text
// Returns: { primaryColor, secondaryColor, bgColor, dotStyle, frameStyle, ctaText, label }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "qr-generator";
const TOKEN_COST = 20; // Reasonable token cost for AI design suggestions
const TOOL_NAME = "QR Code AI Suggest";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[qr/ai-suggest] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[qr/ai-suggest] Failed to load tool ID:`, err);
}

// Helper to clean and parse JSON
function cleanAndParseJSON(rawResponse: string): any {
  // Remove markdown code blocks
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  // Try to extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }
  
  let jsonStr = jsonMatch[0];
  
  // Fix unescaped quotes inside strings
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
  jsonStr = escaped;
  
  try {
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("[qr/ai-suggest] JSON parse error after cleaning:", error.message);
    throw new Error(`Malformed JSON: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { prompt, type = "url", purpose = "" } = await req.json();

    // Validate input
    const userIntent = prompt || purpose || type;
    if (!userIntent?.trim()) {
      return NextResponse.json(
        { error: "Please provide a prompt or purpose for the QR code" },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[qr/ai-suggest] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[qr/ai-suggest] Token gate passed for user ${gateResult.dbUserId}`);

    const aiPrompt = `You are a brand designer specialising in QR code aesthetics. A user wants a QR code for: "${userIntent.slice(0, 300)}" (type: ${type}).

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Suggest a beautiful, professional QR code design. Return EXACTLY this JSON structure:

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
- frameStyle "bold" for marketing, "simple" for professional, "none" for minimal
- ctaText should be action-oriented and concise
- label should clearly indicate what the QR code is for`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      temperature: 0.4, // Slightly higher for creative suggestions
      messages: [{ role: "user", content: aiPrompt }],
    });

    const processingMs = Date.now() - start;
    
    // Get raw response
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    console.log(`[qr/ai-suggest] Raw response length: ${raw.length} chars`);
    
    // Log first 200 chars for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[qr/ai-suggest] Response preview: ${raw.slice(0, 200)}...`);
    }

    // ── ③ PARSE JSON WITH ROBUST ERROR HANDLING ───────────────────────────
    let suggestion: any;
    
    try {
      // First attempt with direct parsing
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      suggestion = JSON.parse(noTrailing);
      console.log(`[qr/ai-suggest] Successfully parsed JSON directly`);
    } catch (firstError: any) {
      console.warn(`[qr/ai-suggest] Direct parse failed: ${firstError.message}`);
      
      try {
        // Second attempt with comprehensive cleaning
        suggestion = cleanAndParseJSON(raw);
        console.log(`[qr/ai-suggest] Successfully parsed JSON after cleaning`);
      } catch (secondError: any) {
        console.error(`[qr/ai-suggest] All parsing attempts failed`);
        console.error(`[qr/ai-suggest] Raw response (first 500 chars):`, raw.slice(0, 500));
        
        // Provide sensible defaults
        suggestion = {
          primaryColor: "#000000",
          secondaryColor: "#000000",
          bgColor: "#ffffff",
          useGradient: false,
          dotStyle: "square",
          cornerStyle: "square",
          frameStyle: "simple",
          ctaText: "Scan me",
          label: "QR Code",
          reasoning: "Default design based on standard QR code aesthetics",
        };
        console.log(`[qr/ai-suggest] Using default suggestion fallback`);
      }
    }

    // Validate and sanitize suggestion
    suggestion.primaryColor = validateHexColor(suggestion.primaryColor, "#000000");
    suggestion.secondaryColor = validateHexColor(suggestion.secondaryColor, suggestion.primaryColor);
    suggestion.bgColor = validateHexColor(suggestion.bgColor, "#ffffff");
    suggestion.useGradient = typeof suggestion.useGradient === "boolean" ? suggestion.useGradient : false;
    
    const validDotStyles = ["square", "rounded", "dots", "classy", "classy-rounded"];
    suggestion.dotStyle = validDotStyles.includes(suggestion.dotStyle) ? suggestion.dotStyle : "square";
    
    const validCornerStyles = ["square", "rounded", "dot"];
    suggestion.cornerStyle = validCornerStyles.includes(suggestion.cornerStyle) ? suggestion.cornerStyle : "square";
    
    const validFrameStyles = ["none", "simple", "rounded", "bold"];
    suggestion.frameStyle = validFrameStyles.includes(suggestion.frameStyle) ? suggestion.frameStyle : "simple";
    
    suggestion.ctaText = suggestion.ctaText?.slice(0, 30) || "Scan me";
    suggestion.label = suggestion.label?.slice(0, 50) || "QR Code";
    suggestion.reasoning = suggestion.reasoning?.slice(0, 200) || "Design optimized for scannability and visual appeal";

    // ── ④ DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "qr/ai-suggest", {
      promptLength: userIntent.length,
      type,
      processingMs,
    });
    console.log(`[qr/ai-suggest] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ⑤ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[qr/ai-suggest] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑥ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      suggestion,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        promptLength: userIntent.length,
      }
    });
  } catch (err: any) {
    console.error("[qr/ai-suggest] Error:", err);

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
      console.error("[qr/ai-suggest] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "AI suggestion failed — please try again",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}

// Helper to validate hex color
function validateHexColor(color: string, defaultValue: string): string {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (color && hexRegex.test(color)) {
    return color;
  }
  return defaultValue;
}









// // =============================================================================
// // isaacpaha.com — QR Code Generator: AI Design Suggest API
// // app/api/tools/qr/ai-suggest/route.ts
// //
// // POST { prompt, type, purpose }
// // Claude analyses the use case and suggests colours, style, and CTA text
// // Returns: { primaryColor, secondaryColor, bgColor, dotStyle, frameStyle, ctaText, label }
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request)
// const TOKEN_COST = 2000; // Adjust based on expected response length and model pricing

// export async function POST(req: NextRequest) {
//   try {

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//       const gate = await tokenGate(req, TOKEN_COST, { toolName: "QR Code AI Suggest" });
//     console.log(`[qr/ai-suggest] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[qr/ai-suggest] Token gate passed for user ${gate.dbUserId}, proceeding with AI suggestion.`);

//     const { prompt, type = "url", purpose = "" } = await req.json();

//     const userIntent = prompt || purpose || type;

//     const aiPrompt = `You are a brand designer specialising in QR code aesthetics. A user wants a QR code for: "${userIntent}" (type: ${type}).

// Suggest a beautiful, professional QR code design. Return ONLY valid JSON (no markdown, no backticks):

// {
//   "primaryColor": "<hex — main QR dot colour, must have high contrast on the bg>",
//   "secondaryColor": "<hex — gradient end colour, or same as primary if no gradient>",
//   "bgColor": "<hex — background colour, default #ffffff>",
//   "useGradient": <true|false>,
//   "dotStyle": "<square|rounded|dots|classy|classy-rounded>",
//   "cornerStyle": "<square|rounded|dot>",
//   "frameStyle": "<none|simple|rounded|bold>",
//   "ctaText": "<short, punchy call-to-action — e.g. 'Scan to view my portfolio' or 'Connect with me' — max 30 chars>",
//   "label": "<2-3 word label for what this QR code is — e.g. 'My Portfolio', 'LinkedIn Profile', 'Pay Me'>",
//   "reasoning": "<one sentence explaining your design choices>"
// }

// Design principles:
// - Professional and modern, not garish
// - High contrast ratio (min 4.5:1 between primaryColor and bgColor for scannability)
// - Match the purpose: CVs/portfolios → professional (navy, charcoal, emerald), social → vibrant but clean, payment → trustworthy (green, navy), WiFi → friendly (blue, purple)
// - Never use yellow on white (unreadable), never use red on red
// - Gradients work well for modern/creative purposes
// - frameStyle "bold" for marketing, "simple" for professional, "none" for minimal`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 400,
//       messages:   [{ role: "user", content: aiPrompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let suggestion: any;
//     try {
//       suggestion = JSON.parse(clean);
//     } catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       suggestion  = match ? JSON.parse(match[0]) : {};
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//         await deductTokens(gate.dbUserId, TOKEN_COST, "qr/ai-suggest", { prompt, type, purpose, userId: gate.dbUserId });
//     console.log(`[qr/ai-suggest] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for AI suggestion.`);

//     return NextResponse.json({ ok: true, suggestion });
//   } catch (err: any) {
//     console.error("[qr/ai-suggest]", err);
//     return NextResponse.json({ error: err.message ?? "AI suggestion failed" }, { status: 500 });
//   }
// }