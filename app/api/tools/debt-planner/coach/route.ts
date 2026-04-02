// =============================================================================
// isaacpaha.com — Debt Recovery Planner: AI Financial Coach API
// app/api/tools/debt-planner/coach/route.ts
//
// POST { message, history[], financialContext? }
// Conversational AI coach — can answer financial questions, reassure, advise
// on budget decisions. Always includes safety disclaimer framing.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "debt-planner";
const TOKEN_COST = 100; // Reasonable token cost for coaching conversations
const TOOL_NAME = "Debt Recovery Coach";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[debt-planner/coach] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[debt-planner/coach] Failed to load tool ID:`, err);
}

// ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// This is the ethical backbone of the tool. It cannot be changed without a code update.
const SYSTEM_PROMPT = `You are a warm, practical AI financial planning coach. You help people manage debt, budget more effectively, and build confidence around their finances.

Your personality:
- Empathetic but honest — never sugarcoat, never alarm
- Specific and practical — give concrete numbers and steps, not vague advice
- Supportive but not patronising — treat users as capable adults
- Clear about your limitations — you give guidance, not regulated financial advice

Rules you ALWAYS follow:
1. NEVER give strict regulated financial advice (e.g. specific investment advice, legal recommendations)
2. NEVER make users feel shame or guilt about their debt situation
3. ALWAYS recommend professional help (StepChange, Citizens Advice, a financial adviser) if the situation seems severe
4. Keep responses concise — 3-5 sentences for most questions, longer only when necessary
5. Use the currency/numbers from their financial context when provided
6. If asked something outside your scope (investments, legal, tax), say so clearly and redirect
7. Never recommend specific financial products or lenders

Opening disclaimer to weave in naturally when starting a new conversation:
"I can help you think through your finances and create a plan — just keep in mind this is planning guidance, not regulated financial advice."`;

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { message, history = [], financialContext } = await req.json();

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
    console.log(`[debt-planner/coach] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[debt-planner/coach] Token gate passed for user ${gateResult.dbUserId}`);

    // Build messages array - include financial context as first user/assistant exchange
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    if (financialContext && history.length === 0) {
      // Format financial context for display
      const contextStr = JSON.stringify(financialContext, null, 2);
      messages.push({
        role: "user",
        content: `Here's my financial situation for context:\n${contextStr}\n\nPlease acknowledge this and let me know you're ready to help.`,
      });
      messages.push({
        role: "assistant",
        content: `Thanks for sharing your financial details. I can see your situation clearly and I'm here to help you work through it. This is planning guidance rather than regulated financial advice, so I'll focus on practical steps you can take. What's on your mind?`,
      });
    }

    // Add conversation history (last 10 exchanges max for context window)
    const recentHistory = history.slice(-20);
    messages.push(...recentHistory);

    // Add current message
    messages.push({ role: "user", content: message.trim() });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      temperature: 0.7, // Warm, conversational tone
      system: SYSTEM_PROMPT,
      messages,
    });

    const processingMs = Date.now() - start;
    
    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    if (!reply || reply.length < 10) {
      console.warn(`[debt-planner/coach] Generated reply too short: ${reply?.length || 0} chars`);
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "debt-planner/coach", {
      messageLength: message.length,
      conversationLength: history.length,
      hasFinancialContext: !!financialContext,
      processingMs,
    });
    console.log(`[debt-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[debt-planner/coach] Tracked tool usage for user ${gateResult.dbUserId}`);

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
    console.error("[debt-planner/coach] Error:", err);

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
      console.error("[debt-planner/coach] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: "Coach unavailable — please try again",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}


// // =============================================================================
// // isaacpaha.com — Debt Recovery Planner: AI Financial Coach API
// // app/api/tools/debt-planner/coach/route.ts
// //
// // POST { message, history[], financialContext? }
// // Conversational AI coach — can answer financial questions, reassure, advise
// // on budget decisions. Always includes safety disclaimer framing.
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { auth }                      from "@clerk/nextjs/server";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 1500000000000; // Adjust based on expected response length and model pricing

// // ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// // This is the ethical backbone of the tool. It cannot be changed without a code update.
// const SYSTEM_PROMPT = `You are a warm, practical AI financial planning coach. You help people manage debt, budget more effectively, and build confidence around their finances.

// Your personality:
// - Empathetic but honest — never sugarcoat, never alarm
// - Specific and practical — give concrete numbers and steps, not vague advice
// - Supportive but not patronising — treat users as capable adults
// - Clear about your limitations — you give guidance, not regulated financial advice

// Rules you ALWAYS follow:
// 1. NEVER give strict regulated financial advice (e.g. specific investment advice, legal recommendations)
// 2. NEVER make users feel shame or guilt about their debt situation
// 3. ALWAYS recommend professional help (StepChange, Citizens Advice, a financial adviser) if the situation seems severe
// 4. Keep responses concise — 3-5 sentences for most questions, longer only when necessary
// 5. Use the currency/numbers from their financial context when provided
// 6. If asked something outside your scope (investments, legal, tax), say so clearly and redirect

// Opening disclaimer to weave in naturally when starting a new conversation:
// "I can help you think through your finances and create a plan — just keep in mind this is planning guidance, not regulated financial advice."`;

// export async function POST(req: NextRequest) {
//     // const { clerkId } = await auth()

//     // if (!clerkId){
//     //     return
//     // }
//   try {
//     const { message, history = [], financialContext } = await req.json();

//     if (!message?.trim()) {
//       return NextResponse.json({ error: "message required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "Debt Recovery Coach" });
//     console.log(`[debt-planner/coach] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[debt-planner/coach] Token gate passed for user ${gate.dbUserId} — proceeding with coaching`);

//     // Build messages array - include financial context as first user/assistant exchange
//     const messages: { role: "user" | "assistant"; content: string }[] = [];

//     if (financialContext && history.length === 0) {
//       messages.push({
//         role: "user",
//         content: `Here's my financial situation for context:\n${JSON.stringify(financialContext, null, 2)}\n\nPlease acknowledge this and let me know you're ready to help.`,
//       });
//       messages.push({
//         role: "assistant",
//         content: `Thanks for sharing your financial details. I can see your situation clearly and I'm here to help you work through it. This is planning guidance rather than regulated financial advice, so I'll focus on practical steps you can take. What's on your mind?`,
//       });
//     }

//     // Add conversation history (last 10 exchanges max for context window)
//     const recentHistory = history.slice(-20);
//     messages.push(...recentHistory);

//     // Add current message
//     messages.push({ role: "user", content: message.trim() });

//     const response = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 600,
//       system:     SYSTEM_PROMPT,
//       messages,
//     });

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "debt-planner/coach", {
//       messageLength: message.length,
//       conversationLength: history.length,
//     });
//     console.log(`[debt-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for coaching.`);

//     const reply = response.content[0].type === "text" ? response.content[0].text : "";
//     return NextResponse.json({ ok: true, reply });
//   } catch (err: any) {
//     console.error("[debt-planner/coach]", err);
//     return NextResponse.json({ error: "Coach unavailable — please try again" }, { status: 500 });
//   }
// }