// =============================================================================
// isaacpaha.com — First Home Planner: AI Home Coach API
// app/api/tools/home-planner/coach/route.ts
//
// POST { message, planContext, conversationHistory }
// Returns a conversational response from the AI home coach
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "home-planner";
const TOKEN_COST = 30; // Reasonable token cost for coaching conversations
const TOOL_NAME = "Home Coach";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[home-planner/coach] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[home-planner/coach] Failed to load tool ID:`, err);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { message, planContext, conversationHistory = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message too long — please keep it under 2000 characters" },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[home-planner/coach] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[home-planner/coach] Token gate passed for user ${gateResult.dbUserId}`);

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
7. Never give specific financial advice or product recommendations.
8. Always include a disclaimer if discussing anything that could be interpreted as advice.

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

    // Format conversation history
    const messages = conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" as const : "assistant" as const,
        content: msg.content,
      }));
    
    messages.push({ role: "user" as const, content: message });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      temperature: 0.7, // Slightly higher for warm, conversational tone
      system: systemPrompt,
      messages,
    });

    const processingMs = Date.now() - start;
    
    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    if (!reply || reply.length < 10) {
      console.warn(`[home-planner/coach] Generated reply too short: ${reply?.length || 0} chars`);
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "home-planner/coach", {
      messageLength: message.length,
      conversationLength: conversationHistory.length,
      hasContext: !!planContext,
      processingMs,
    });
    console.log(`[home-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[home-planner/coach] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      reply,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        replyLength: reply.length,
      }
    });
  } catch (err: any) {
    console.error("[home-planner/coach] Error:", err);

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
      console.error("[home-planner/coach] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: "Home Coach is unavailable right now — please try again.",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // isaacpaha.com — First Home Planner: AI Home Coach API
// // app/api/tools/home-planner/coach/route.ts
// //
// // POST { message, planContext, conversationHistory }
// // Returns a conversational response from the AI home coach
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request)
// const TOKEN_COST = 120000000000; // Adjust based on expected response length and model pricing

// export async function POST(req: NextRequest) {
//   try {
//     const { message, planContext, conversationHistory = [] } = await req.json();

//     if (!message?.trim()) {
//       return NextResponse.json({ error: "Message required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Home Coach" });
//     console.log(`[home-planner/coach] Token gate result:`, gate);
//     if (!gate.ok) return gate.response;
//     console.log(`[home-planner/coach] Token gate passed for user ${gate.dbUserId} — proceeding with coaching`);


//     const systemPrompt = `You are a warm, knowledgeable, and practical AI home buying coach called "Home Coach".

// Your role: Help first-time buyers understand the home buying process, plan their journey, and feel confident about what can feel like an overwhelming goal.

// ${planContext ? `USER'S PLAN CONTEXT:\n${planContext}\n` : ""}

// IMPORTANT RULES:
// 1. You are NOT a regulated financial adviser. You provide educational guidance only. Never recommend specific mortgage products, lenders, or financial products. If they ask about specific mortgages, direct them to an independent mortgage adviser (IMA).
// 2. Be warm, human, and encouraging. Many users feel anxious about this topic — acknowledge that it's a big deal.
// 3. Be specific and practical — answer the actual question, not a watered-down version.
// 4. If you don't know something (e.g. current interest rates), say so honestly and suggest they check official sources like MoneySavingExpert, gov.uk, or speak to a broker.
// 5. Keep responses focused and under 250 words unless detail is genuinely needed.
// 6. UK-first: assume UK unless they say otherwise. Use £ not $.

// You can help with questions like:
// - "How does a mortgage work?"
// - "What's a Help to Buy ISA?"
// - "Can I afford this house?"
// - "Should I get shared ownership?"
// - "What is a mortgage in principle?"
// - "How does stamp duty work for first-time buyers?"
// - "What's the difference between fixed and variable rates?"
// - "How long does conveyancing take?"
// - "What is a survey and do I need one?"`;

//     const messages = [
//       ...conversationHistory.slice(-10), // Keep last 10 messages for context
//       { role: "user" as const, content: message },
//     ];

//     const response = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 600,
//       system:     systemPrompt,
//       messages,
//     });

//     const reply = response.content[0].type === "text" ? response.content[0].text : "";

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "home-planner/coach", {
//       messageLength: message.length,
//       conversationLength: conversationHistory.length,
//     });
//     console.log(`[home-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for home coaching.`);
    
//     return NextResponse.json({ ok: true, reply });
//   } catch (err: any) {
//     console.error("[home-planner/coach]", err);
//     return NextResponse.json({ error: "Home Coach is unavailable right now — please try again." }, { status: 500 });
//   }
// }