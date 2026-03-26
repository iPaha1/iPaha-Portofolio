// =============================================================================
// isaacpaha.com — Smart Budget Planner: AI Coach API
// app/api/tools/budget-planner/coach/route.ts
//
// POST { message, context: { snapshot, categoryPlan, ... } }
// Conversational AI coach who knows the user's budget situation
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { message, context, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const sym = context?.currency === "USD" ? "$" : context?.currency === "EUR" ? "€" : "£";

    const systemPrompt = `You are a warm, practical, non-judgmental AI budget coach. You help people figure out their finances with honesty and care.

${context ? `
USER'S CURRENT BUDGET SITUATION:
- Total budget: ${sym}${context.totalBudget}
- Timeframe: ${context.timeframeDays} days
- Daily limit: ${sym}${context.snapshot?.dailyBudgetTotal?.toFixed(2) ?? "?"}
- Daily flexible budget: ${sym}${context.snapshot?.dailyBudgetFlexible?.toFixed(2) ?? "?"}
- Risk level: ${context.snapshot?.riskLevel ?? "unknown"}
- Fixed costs: ${sym}${context.snapshot?.totalFixed ?? "?"}
- Remaining after fixed: ${sym}${context.snapshot?.remaining ?? "?"}
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
- Be human and warm — acknowledge difficulty without being patronizing`;

    const messages: any[] = [
      ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 400,
      system:     systemPrompt,
      messages,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ ok: true, reply });
  } catch (err: any) {
    console.error("[budget-planner/coach]", err);
    return NextResponse.json({ error: "Coach unavailable — please try again" }, { status: 500 });
  }
}