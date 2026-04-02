// =============================================================================
// isaacpaha.com — Smart Budget Planner: AI Coach API
// app/api/tools/budget-planner/coach/route.ts
//
// POST { message, context: { snapshot, categoryPlan, ... } }
// Conversational AI coach who knows the user's budget situation
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "budget-planner";
const TOKEN_COST = 100; // Reasonable token cost for coaching conversations
const TOOL_NAME = "Budget Coach";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[budget-planner/coach] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[budget-planner/coach] Failed to load tool ID:`, err);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    console.log(`[budget-planner/coach] Received request at ${new Date().toISOString()}`);
    
    const { message, context, history = [] } = await req.json();

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
    console.log(`[budget-planner/coach] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[budget-planner/coach] Token gate passed for user ${gateResult.dbUserId}`);

    const sym = context?.currency === "USD" ? "$" : context?.currency === "EUR" ? "€" : "£";

    const systemPrompt = `You are a warm, practical, non-judgmental AI budget coach. You help people figure out their finances with honesty and care.

${context ? `
USER'S CURRENT BUDGET SITUATION:
- Total budget: ${sym}${context.totalBudget?.toLocaleString() ?? "?"}
- Timeframe: ${context.timeframeDays ?? "?"} days
- Daily limit: ${sym}${context.snapshot?.dailyBudgetTotal?.toFixed(2) ?? "?"}
- Daily flexible budget: ${sym}${context.snapshot?.dailyBudgetFlexible?.toFixed(2) ?? "?"}
- Risk level: ${context.snapshot?.riskLevel ?? "unknown"}
- Fixed costs: ${sym}${context.snapshot?.totalFixed?.toLocaleString() ?? "?"}
- Remaining after fixed: ${sym}${context.snapshot?.remaining?.toLocaleString() ?? "?"}
${context.categoryPlan ? `
Category breakdown:
${context.categoryPlan.slice(0, 6).map((c: any) => `- ${c.category}: ${sym}${c.dailyAllocation?.toFixed(2)}/day`).join("\n")}` : ""}
` : ""}

Your role:
- Answer budget questions directly and specifically (reference their actual numbers when possible)
- Give practical, honest suggestions
- Never lecture or moralize
- If asked "can I afford X?", work through the numbers and give a specific answer
- Keep responses to 2-4 sentences unless the question needs more detail
- Be human and warm — acknowledge difficulty without being patronizing
- Never recommend specific financial products or lenders
- Always be supportive and non-judgmental`;

    // Format conversation history
    const messages: any[] = [
      ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    const processingMs = Date.now() - start;
    
    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    if (!reply || reply.length < 5) {
      console.warn(`[budget-planner/coach] Generated reply too short: ${reply?.length || 0} chars`);
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "budget-planner/coach", {
      messageLength: message.length,
      conversationLength: history.length,
      hasContext: !!context,
      processingMs,
    });
    console.log(`[budget-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[budget-planner/coach] Tracked tool usage for user ${gateResult.dbUserId}`);

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
    console.error("[budget-planner/coach] Error:", err);

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
      console.error("[budget-planner/coach] Failed to track error:", trackError);
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
// // isaacpaha.com — Smart Budget Planner: AI Coach API
// // app/api/tools/budget-planner/coach/route.ts
// //
// // POST { message, context: { snapshot, categoryPlan, ... } }
// // Conversational AI coach who knows the user's budget situation
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 200000000000; // Adjust based on expected response length and model pricing

// export async function POST(req: NextRequest) {
//   console.log(`[budget-planner/coach] Received request at ${new Date().toISOString()}`);
//   try {
//     console.log("[budget-planner/coach] Request body:", await req.clone().text());
    
//     const { message, context, history = [] } = await req.json();

//     if (!message?.trim()) {
//       return NextResponse.json({ error: "Message required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Budget Coach" });
//     console.log(`[budget-planner/coach] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[budget-planner/coach] Token gate passed for user ${gate.dbUserId}, proceeding with coaching response.`);

//     const sym = context?.currency === "USD" ? "$" : context?.currency === "EUR" ? "€" : "£";

//     const systemPrompt = `You are a warm, practical, non-judgmental AI budget coach. You help people figure out their finances with honesty and care.

// ${context ? `
// USER'S CURRENT BUDGET SITUATION:
// - Total budget: ${sym}${context.totalBudget}
// - Timeframe: ${context.timeframeDays} days
// - Daily limit: ${sym}${context.snapshot?.dailyBudgetTotal?.toFixed(2) ?? "?"}
// - Daily flexible budget: ${sym}${context.snapshot?.dailyBudgetFlexible?.toFixed(2) ?? "?"}
// - Risk level: ${context.snapshot?.riskLevel ?? "unknown"}
// - Fixed costs: ${sym}${context.snapshot?.totalFixed ?? "?"}
// - Remaining after fixed: ${sym}${context.snapshot?.remaining ?? "?"}
// ${context.categoryPlan ? `
// Category breakdown:
// ${context.categoryPlan.slice(0, 6).map((c: any) => `- ${c.category}: ${sym}${c.dailyAllocation?.toFixed(2)}/day`).join("\n")}` : ""}
// ` : ""}

// Your role:
// - Answer budget questions directly and specifically (reference their actual numbers when possible)
// - Give practical, honest suggestions
// - Never lecture or moralize
// - If asked "can I afford X?", work through the numbers and give a specific answer
// - Keep responses to 2-4 sentences unless the question needs more detail
// - Be human and warm — acknowledge difficulty without being patronizing`;

//     const messages: any[] = [
//       ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
//       { role: "user", content: message },
//     ];

//     const response = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 400,
//       system:     systemPrompt,
//       messages,
//     });

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "budget-planner/coach", { message, context, history, userId: gate.dbUserId });
//     console.log(`[budget-planner/coach] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for coaching response.`);


//     const reply = response.content[0].type === "text" ? response.content[0].text : "";
//     return NextResponse.json({ ok: true, reply });
//   } catch (err: any) {
//     console.error("[budget-planner/coach]", err);
//     return NextResponse.json({ error: "Coach unavailable — please try again" }, { status: 500 });
//   }
// }