
// =============================================================================
// isaacpaha.com — Scripture Explorer: AI Study Companion
// app/api/tools/scripture-explorer/study-companion/route.ts
//
// POST { question, context } — answers follow-up questions in context
// Maintains the same strict neutrality system prompt as explore/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "scripture-explorer";
const TOKEN_COST = 50; // Reasonable token cost for study companion questions
const TOOL_NAME = "Scripture Study Companion";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[scripture-explorer/study-companion] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[scripture-explorer/study-companion] Failed to load tool ID:`, err);
}

// ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// This is not configurable. It is the ethical backbone of the tool.
const SYSTEM_PROMPT = `You are a neutral, scholarly educational assistant specialising in comparative Abrahamic religious studies. Your role is to educate — not to advocate, judge, rank, or persuade.

ABSOLUTE RULES (never break these):
1. NEVER suggest any tradition is more correct, more authentic, or superior to another.
2. NEVER use language like "actually", "in reality", "the truth is", "this is wrong", or any phrase that implies one tradition has a privileged claim to truth.
3. NEVER express a personal view on theological questions.
4. ALWAYS use framing like: "In this tradition...", "This tradition teaches...", "From an Islamic perspective...", "In Christian interpretation...", "Jewish scholars understand this as...", "Interpretations vary within this tradition..."
5. NEVER present one interpretation as THE interpretation — always acknowledge internal diversity where relevant.
6. Differences between traditions are DIFFERENCES, not errors. Present them as distinct perspectives, never as contradictions that need resolving.
7. Always cite specific references (book, chapter, verse) for scripture quotations.
8. Scholarly and historical context must be presented neutrally — if scholars disagree, say so.
9. Keep language accessible and clear — this is for a general educated audience, not specialists.
10. End every response with the standard educational disclaimer.

TONE: Warm, thoughtful, scholarly, and genuinely respectful of all traditions explored.
GOAL: Build bridges of understanding. Help people learn. Never inflame.`;

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
    console.error("[scripture-explorer/study-companion] JSON parse error after cleaning:", error.message);
    throw new Error(`Malformed JSON: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { question, context } = await req.json();

    // Validate input
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    if (question.trim().length < 3) {
      return NextResponse.json(
        { error: "Please enter a longer question (minimum 3 characters)" },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[scripture-explorer/study-companion] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[scripture-explorer/study-companion] Token gate passed for user ${gateResult.dbUserId}`);

    // Build context summary
    const contextSummary = context
      ? `The user has been reading about: "${context.topic?.slice(0, 200) ?? "a scripture topic"}". `
      : "";

    const cleanQuestion = question.trim().slice(0, 400);

    const prompt = `${contextSummary}The user asks: "${cleanQuestion}"

Provide a clear, educational, neutral answer. If the question touches on theological interpretation, present multiple perspectives using "this tradition teaches..." framing. If relevant, cite specific passages.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Keep the response focused and readable — aim for 150-300 words. End with 1-2 follow-up questions the user might want to explore next.

Return EXACTLY this JSON structure:

{
  "answer": "<your educational response — use neutral, respectful language with proper framing>",
  "references": [
    { 
      "tradition": "<tradition name>", 
      "reference": "<Book/Surah Ch:V>", 
      "relevance": "<why relevant — 1 sentence>" 
    }
  ],
  "followUpQuestions": ["<question 1>", "<question 2>"],
  "disclaimer": "This is an educational response for comparative study only."
}

Rules:
- Include 0-3 references depending on relevance
- If the question doesn't require specific references, the references array can be empty
- Follow-up questions should be thoughtful and encourage deeper exploration
- Maintain warm, scholarly tone throughout
- Always include the disclaimer`;

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      temperature: 0.3, // Lower temperature for consistent, neutral responses
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    // Get raw response
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    console.log(`[scripture-explorer/study-companion] Raw response length: ${raw.length} chars`);
    
    // Log first 200 chars for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[scripture-explorer/study-companion] Response preview: ${raw.slice(0, 200)}...`);
    }

    // ── ③ PARSE JSON WITH ROBUST ERROR HANDLING ───────────────────────────
    let result: any;
    
    try {
      // First attempt with direct parsing
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      result = JSON.parse(noTrailing);
      console.log(`[scripture-explorer/study-companion] Successfully parsed JSON directly`);
    } catch (firstError: any) {
      console.warn(`[scripture-explorer/study-companion] Direct parse failed: ${firstError.message}`);
      
      try {
        // Second attempt with comprehensive cleaning
        result = cleanAndParseJSON(raw);
        console.log(`[scripture-explorer/study-companion] Successfully parsed JSON after cleaning`);
      } catch (secondError: any) {
        console.error(`[scripture-explorer/study-companion] All parsing attempts failed`);
        console.error(`[scripture-explorer/study-companion] Raw response (first 500 chars):`, raw.slice(0, 500));
        
        // Fallback to raw text if JSON parsing fails
        result = {
          answer: raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
          references: [],
          followUpQuestions: [],
          disclaimer: "This is an educational response for comparative study only.",
        };
        console.log(`[scripture-explorer/study-companion] Using raw text fallback`);
      }
    }

    // Validate required fields
    if (!result.answer || typeof result.answer !== 'string') {
      result.answer = "I'm sorry, I couldn't generate a proper response. Please try rephrasing your question.";
    }
    
    if (!result.references || !Array.isArray(result.references)) {
      result.references = [];
    }
    
    if (!result.followUpQuestions || !Array.isArray(result.followUpQuestions)) {
      result.followUpQuestions = [];
    }
    
    // Ensure disclaimer is present
    if (!result.disclaimer) {
      result.disclaimer = "This is an educational response for comparative study only.";
    }

    // ── ④ DEDUCT TOKENS — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "scripture-explorer/study-companion", {
      questionLength: cleanQuestion.length,
      hasContext: !!context,
      processingMs,
    });
    console.log(`[scripture-explorer/study-companion] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[scripture-explorer/study-companion] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑥ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      result,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        questionLength: cleanQuestion.length,
        hasContext: !!context,
        referencesCount: result.references.length,
      }
    });
    
  } catch (err: any) {
    console.error("[scripture-explorer/study-companion] Error:", err);

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
      console.error("[scripture-explorer/study-companion] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "Study companion failed — please try again",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}



// // =============================================================================
// // isaacpaha.com — Scripture Explorer: AI Study Companion
// // app/api/tools/scripture-explorer/study-companion/route.ts
// //
// // POST { question, context } — answers follow-up questions in context
// // Maintains the same strict neutrality system prompt as explore/route.ts
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 10000000000000; // Adjust based on expected response length and model pricing

// // ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// // This is not configurable. It is the ethical backbone of the tool.
// const SYSTEM_PROMPT = `You are a neutral, scholarly educational assistant specialising in comparative Abrahamic religious studies. Your role is to educate — not to advocate, judge, rank, or persuade.

// ABSOLUTE RULES:
// 1. Never suggest any tradition is more correct, more authentic, or superior to another.
// 2. Never use language that implies one tradition has a privileged claim to truth.
// 3. Never express a personal theological view.
// 4. Always use framing like: "In this tradition...", "This tradition teaches...", "Interpretations vary..."
// 5. Acknowledge internal diversity within traditions.
// 6. Differences are differences — never frame them as errors or contradictions requiring resolution.
// 7. Cite specific references when quoting scripture.
// 8. Keep language warm, accessible, and scholarly.`;

// export async function POST(req: NextRequest) {
//   try {
//     const { question, context } = await req.json();

//     if (!question?.trim()) {
//       return NextResponse.json({ error: "Question required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "Scripture Study Companion" });
//     console.log(`[scripture-explorer/study-companion] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[scripture-explorer/study-companion] Token gate passed for user ${gate.dbUserId} — proceeding with question answering`);

//     const contextSummary = context
//       ? `The user has been reading about: "${context.topic ?? "a scripture topic"}". `
//       : "";

//     const prompt = `${contextSummary}The user asks: "${question.trim().slice(0, 400)}"

// Provide a clear, educational, neutral answer. If the question touches on theological interpretation, present multiple perspectives using "this tradition teaches..." framing. If relevant, cite specific passages.

// Keep the response focused and readable — aim for 150-300 words. End with 1-2 follow-up questions the user might want to explore next.

// Format your response as JSON:
// {
//   "answer": "<your educational response>",
//   "references": [
//     { "tradition": "<tradition>", "reference": "<Book/Surah Ch:V>", "relevance": "<why relevant>" }
//   ],
//   "followUpQuestions": ["<question 1>", "<question 2>"],
//   "disclaimer": "This is an educational response for comparative study only."
// }`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 1200,
//       system:     SYSTEM_PROMPT,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let result: any;
//     try { result = JSON.parse(clean); }
//     catch {
//       // If JSON parsing fails, return the raw answer
//       result = {
//         answer:           raw,
//         references:       [],
//         followUpQuestions: [],
//         disclaimer:       "This is an educational response for comparative study only.",
//       };
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "scripture-explorer/study-companion", {
//       question,
//       context,
//     });
//     console.log(`[scripture-explorer/study-companion] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);

//     return NextResponse.json({ ok: true, result });
//   } catch (err: any) {
//     console.error("[scripture-explorer/study-companion]", err);
//     return NextResponse.json({ error: err.message ?? "Study companion failed" }, { status: 500 });
//   }
// }