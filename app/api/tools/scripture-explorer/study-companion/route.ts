// =============================================================================
// isaacpaha.com — Scripture Explorer: AI Study Companion
// app/api/tools/scripture-explorer/study-companion/route.ts
//
// POST { question, context } — answers follow-up questions in context
// Maintains the same strict neutrality system prompt as explore/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// Tool token costs (in tokens per request)
const TOKEN_COST = 10000000000000; // Adjust based on expected response length and model pricing

// ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// This is not configurable. It is the ethical backbone of the tool.
const SYSTEM_PROMPT = `You are a neutral, scholarly educational assistant specialising in comparative Abrahamic religious studies. Your role is to educate — not to advocate, judge, rank, or persuade.

ABSOLUTE RULES:
1. Never suggest any tradition is more correct, more authentic, or superior to another.
2. Never use language that implies one tradition has a privileged claim to truth.
3. Never express a personal theological view.
4. Always use framing like: "In this tradition...", "This tradition teaches...", "Interpretations vary..."
5. Acknowledge internal diversity within traditions.
6. Differences are differences — never frame them as errors or contradictions requiring resolution.
7. Cite specific references when quoting scripture.
8. Keep language warm, accessible, and scholarly.`;

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
        const gate = await tokenGate(req, TOKEN_COST, { toolName: "Scripture Study Companion" });
    console.log(`[scripture-explorer/study-companion] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[scripture-explorer/study-companion] Token gate passed for user ${gate.dbUserId} — proceeding with question answering`);

    const contextSummary = context
      ? `The user has been reading about: "${context.topic ?? "a scripture topic"}". `
      : "";

    const prompt = `${contextSummary}The user asks: "${question.trim().slice(0, 400)}"

Provide a clear, educational, neutral answer. If the question touches on theological interpretation, present multiple perspectives using "this tradition teaches..." framing. If relevant, cite specific passages.

Keep the response focused and readable — aim for 150-300 words. End with 1-2 follow-up questions the user might want to explore next.

Format your response as JSON:
{
  "answer": "<your educational response>",
  "references": [
    { "tradition": "<tradition>", "reference": "<Book/Surah Ch:V>", "relevance": "<why relevant>" }
  ],
  "followUpQuestions": ["<question 1>", "<question 2>"],
  "disclaimer": "This is an educational response for comparative study only."
}`;

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let result: any;
    try { result = JSON.parse(clean); }
    catch {
      // If JSON parsing fails, return the raw answer
      result = {
        answer:           raw,
        references:       [],
        followUpQuestions: [],
        disclaimer:       "This is an educational response for comparative study only.",
      };
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gate.dbUserId, TOKEN_COST, "scripture-explorer/study-companion", {
      question,
      context,
    });
    console.log(`[scripture-explorer/study-companion] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("[scripture-explorer/study-companion]", err);
    return NextResponse.json({ error: err.message ?? "Study companion failed" }, { status: 500 });
  }
}