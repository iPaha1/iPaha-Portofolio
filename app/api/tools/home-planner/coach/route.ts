// =============================================================================
// isaacpaha.com — First Home Planner: AI Home Coach API
// app/api/tools/home-planner/coach/route.ts
//
// POST { message, planContext, conversationHistory }
// Returns a conversational response from the AI home coach
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Tool token costs (in tokens per request)
const TOKEN_COST = 1200; // Adjust based on expected response length and model pricing

export async function POST(req: NextRequest) {
  try {
    const { message, planContext, conversationHistory = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    const gate = await tokenGate(req, TOKEN_COST, { toolName: "Home Coach" });
    console.log(`[home-planner/coach] Token gate result:`, gate);
    if (!gate.ok) return gate.response;
    console.log(`[home-planner/coach] Token gate passed for user ${gate.dbUserId} — proceeding with coaching`);


    const systemPrompt = `You are a warm, knowledgeable, and practical AI home buying coach called "Home Coach".

Your role: Help first-time buyers understand the home buying process, plan their journey, and feel confident about what can feel like an overwhelming goal.

${planContext ? `USER'S PLAN CONTEXT:\n${planContext}\n` : ""}

IMPORTANT RULES:
1. You are NOT a regulated financial adviser. You provide educational guidance only. Never recommend specific mortgage products, lenders, or financial products. If they ask about specific mortgages, direct them to an independent mortgage adviser (IMA).
2. Be warm, human, and encouraging. Many users feel anxious about this topic — acknowledge that it's a big deal.
3. Be specific and practical — answer the actual question, not a watered-down version.
4. If you don't know something (e.g. current interest rates), say so honestly and suggest they check official sources like MoneySavingExpert, gov.uk, or speak to a broker.
5. Keep responses focused and under 250 words unless detail is genuinely needed.
6. UK-first: assume UK unless they say otherwise. Use £ not $.

You can help with questions like:
- "How does a mortgage work?"
- "What's a Help to Buy ISA?"
- "Can I afford this house?"
- "Should I get shared ownership?"
- "What is a mortgage in principle?"
- "How does stamp duty work for first-time buyers?"
- "What's the difference between fixed and variable rates?"
- "How long does conveyancing take?"
- "What is a survey and do I need one?"`;

    const messages = [
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 600,
      system:     systemPrompt,
      messages,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gate.dbUserId, TOKEN_COST, "home-planner/coach", {
      messageLength: message.length,
      conversationLength: conversationHistory.length,
    });
    console.log(`[home-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for home coaching.`);
    
    return NextResponse.json({ ok: true, reply });
  } catch (err: any) {
    console.error("[home-planner/coach]", err);
    return NextResponse.json({ error: "Home Coach is unavailable right now — please try again." }, { status: 500 });
  }
}