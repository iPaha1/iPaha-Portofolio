// =============================================================================
// isaacpaha.com — Smart Budget Survival Planner: Plan API
// app/api/tools/budget-planner/plan/route.ts
//
// POST {
//   totalBudget, currency, timeframeDays,
//   fixedExpenses[],   — rent, bills, transport, subscriptions
//   flexibleExpenses[] — food, entertainment, misc
// }
//
// Returns comprehensive JSON survival plan
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "budget-planner";
const TOKEN_COST = 120; // Higher cost for comprehensive plan generation
const TOOL_NAME = "Budget Survival Planner";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[budget-planner/plan] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[budget-planner/plan] Failed to load tool ID:`, err);
}

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
  category: string;
}

export interface BudgetPlanRequest {
  totalBudget: number;
  currency: string;   // "GBP" | "USD" | "EUR"
  timeframeDays: number;   // e.g. 30
  fixedExpenses: ExpenseItem[];
  flexibleExpenses: ExpenseItem[];
}

// Helper to clean and parse JSON
function cleanAndParseJSON(rawResponse: string): any {
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) throw new Error("No JSON object found");
  
  let jsonStr = jsonMatch[0];
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
  
  return JSON.parse(escaped);
}

// Generate fallback plan
function generateFallbackPlan(data: BudgetPlanRequest): any {
  const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const totalFixed = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalFlexible = data.flexibleExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining = data.totalBudget - totalFixed;
  const dailyTotal = data.totalBudget / data.timeframeDays;
  const dailyFlexible = remaining / data.timeframeDays;
  const weeksCount = Math.ceil(data.timeframeDays / 7);
  
  const riskLevel = remaining <= 0 ? "CRITICAL"
    : dailyFlexible < 5 ? "CRITICAL"
    : dailyFlexible < 10 ? "TIGHT"
    : dailyFlexible < 20 ? "MANAGEABLE"
    : "COMFORTABLE";

  return {
    snapshot: {
      totalBudget: data.totalBudget,
      timeframeDays: data.timeframeDays,
      totalFixed,
      totalFlexible,
      remaining,
      dailyBudgetTotal: dailyTotal,
      dailyBudgetFlexible: dailyFlexible,
      weeklyBudget: data.totalBudget / weeksCount,
      riskLevel,
      riskLabel: riskLevel === "CRITICAL" ? "Unsustainable" : riskLevel === "TIGHT" ? "Tight" : "Safe",
      riskColour: riskLevel === "CRITICAL" ? "#ef4444" : riskLevel === "TIGHT" ? "#f59e0b" : "#10b981",
      daysViable: Math.min(data.timeframeDays, remaining > 0 ? Math.floor(remaining / (totalFlexible / data.timeframeDays)) : 0),
      headline: `${sym}${dailyFlexible.toFixed(2)}/day to work with — here's how to make it count`,
      summary: "We're experiencing technical difficulties. Please try again with your budget details.",
      survivalVerdict: riskLevel === "CRITICAL" ? "Unsustainable — needs cuts" : "Tight but possible",
    },
    categoryPlan: [],
    weeklyPlan: [],
    cutSuggestions: [],
    survivalTips: [{ tip: "Please try again", category: "General", potentialSaving: "N/A", effort: "Low" }],
    scenarios: [],
    emergencyPlan: {
      dailyLimit: Math.max(0, dailyFlexible * 0.5),
      description: "Emergency plan details unavailable. Please try again.",
      essentials: ["Food", "Essential bills"],
      cutEntirely: ["Non-essentials"],
    },
    motivation: "Having a plan is the first step. Please try again with your budget details.",
    shareCard: {
      headline: "Budget planning in progress",
      stats: `${sym}${dailyTotal.toFixed(2)}/day budget`,
    },
  };
}

function buildPrompt(data: BudgetPlanRequest): string {
  const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const totalFixed = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalFlexible = data.flexibleExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalFixed + totalFlexible;
  const remaining = data.totalBudget - totalFixed;
  const dailyTotal = data.totalBudget / data.timeframeDays;
  const dailyFixed = totalFixed / data.timeframeDays;
  const dailyFlexible = remaining / data.timeframeDays;
  const daysViable = remaining > 0 ? Math.floor(remaining / (totalFlexible / data.timeframeDays)) : 0;
  const weeksCount = Math.ceil(data.timeframeDays / 7);

  const riskLevel = remaining <= 0 ? "CRITICAL"
    : dailyFlexible < 5 ? "CRITICAL"
    : dailyFlexible < 10 ? "TIGHT"
    : dailyFlexible < 20 ? "MANAGEABLE"
    : "COMFORTABLE";

  return `You are a warm, practical, non-judgmental AI financial planning assistant helping someone figure out how to survive on a limited budget. Your tone is supportive — like a knowledgeable friend who helps people think clearly without making them feel bad about their situation.

BUDGET SITUATION:
Total money available: ${sym}${data.totalBudget.toLocaleString()}
Timeframe: ${data.timeframeDays} days (${weeksCount} weeks)
Currency: ${data.currency}

Fixed expenses (unavoidable):
${data.fixedExpenses.length > 0 ? data.fixedExpenses.map(e => `- ${e.label}: ${sym}${e.amount}`).join("\n") : "- None listed"}
Total fixed: ${sym}${totalFixed.toLocaleString()}

Flexible/variable spending:
${data.flexibleExpenses.length > 0 ? data.flexibleExpenses.map(e => `- ${e.label}: ${sym}${e.amount}`).join("\n") : "- None listed"}
Total flexible: ${sym}${totalFlexible.toLocaleString()}

KEY NUMBERS:
- After fixed costs: ${sym}${remaining.toLocaleString()} left for ${data.timeframeDays} days
- Daily budget (total): ${sym}${dailyTotal.toFixed(2)}/day
- Daily budget (flexible): ${sym}${dailyFlexible.toFixed(2)}/day
- Current risk level: ${riskLevel}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure:

{
  "snapshot": {
    "totalBudget": ${data.totalBudget},
    "timeframeDays": ${data.timeframeDays},
    "totalFixed": ${totalFixed},
    "totalFlexible": ${totalFlexible},
    "remaining": ${remaining},
    "dailyBudgetTotal": ${dailyTotal},
    "dailyBudgetFlexible": ${dailyFlexible},
    "weeklyBudget": ${data.totalBudget / weeksCount},
    "riskLevel": "${riskLevel}",
    "riskLabel": "<Safe|Tight|Unsustainable>",
    "riskColour": "<#10b981|#f59e0b|#ef4444>",
    "daysViable": ${daysViable > data.timeframeDays ? data.timeframeDays : daysViable},
    "headline": "<one punchy, honest, non-judgmental headline>",
    "summary": "<2-3 honest, warm sentences summarising the situation>",
    "survivalVerdict": "<Can survive|Tight but possible|Very tight|Unsustainable — needs cuts>"
  },

  "categoryPlan": [
    {
      "category": "<category name>",
      "dailyAllocation": <number>,
      "weeklyAllocation": <number>,
      "totalAllocation": <number>,
      "type": "<fixed|flexible>",
      "tips": "<1-2 specific, practical tips>",
      "priority": "<Essential|Important|Discretionary>"
    }
  ],

  "weeklyPlan": [
    {
      "week": <1 to ${weeksCount}>,
      "label": "Week <N>",
      "startDay": <day number>,
      "endDay": <day number>,
      "totalBudget": <number>,
      "fixedCosts": <number>,
      "flexibleBudget": <number>,
      "dailyLimit": <number>,
      "focus": "<one specific focus or watchout>",
      "milestone": "<optional milestone>"
    }
  ],

  "cutSuggestions": [
    {
      "category": "<category name>",
      "currentAmount": <number>,
      "suggestedAmount": <number>,
      "saving": <number>,
      "dailyImpact": <number>,
      "suggestion": "<specific, practical suggestion>",
      "difficulty": "<Easy|Medium|Requires planning>"
    }
  ],

  "survivalTips": [
    {
      "tip": "<specific, actionable, warm tip>",
      "category": "<Food|Transport|Entertainment|Bills|Miscellaneous|General>",
      "potentialSaving": "<e.g. '£15-20/week'>",
      "effort": "<Low|Medium|One-time>"
    }
  ],

  "scenarios": [
    {
      "name": "If you cut spending by ${sym}50",
      "change": -50,
      "changeType": "spending_reduction",
      "newDailyFlexible": <number>,
      "newDaysViable": <number>,
      "impact": "<specific impact>",
      "howTo": "<specific suggestion for where to find this saving>"
    }
  ],

  "emergencyPlan": {
    "dailyLimit": <number>,
    "description": "<2-3 sentences: what this looks like in practice>",
    "essentials": ["<essential 1>", "<essential 2>", "<essential 3>"],
    "cutEntirely": ["<thing to stop entirely 1>", "<thing to stop entirely 2>"]
  },

  "motivation": "<1-2 warm, genuine, specific sentences — reference their actual numbers>",

  "shareCard": {
    "headline": "<short, shareable, relatable headline>",
    "stats": "<2-3 key numbers formatted for sharing>"
  }
}

RULES:
- All monetary values must be numbers, not strings.
- categoryPlan must include ALL categories from both fixed AND flexible expenses
- cutSuggestions: only suggest cuts to flexible/variable spending
- survivalTips: must be SPECIFIC — not generic
- Be honest about how tight the situation is — but always frame it as "here's what you can do"
- If remaining <= 0, acknowledge this clearly but gently
- weeklyPlan must have exactly ${weeksCount} weeks`;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    console.log(`[budget-planner/plan] Received request at ${new Date().toISOString()}`);
    
    const body: BudgetPlanRequest = await req.json();

    // Validate required fields
    if (!body.totalBudget || body.totalBudget <= 0) {
      return NextResponse.json({ error: "Total budget is required and must be greater than 0" }, { status: 400 });
    }
    
    if (!body.timeframeDays || body.timeframeDays < 1) {
      return NextResponse.json({ error: "Timeframe must be at least 1 day" }, { status: 400 });
    }

    if (body.timeframeDays > 365) {
      return NextResponse.json({ error: "Timeframe cannot exceed 365 days" }, { status: 400 });
    }

    // Validate currency
    const validCurrencies = ["GBP", "USD", "EUR"];
    const currency = validCurrencies.includes(body.currency) ? body.currency : "GBP";

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[budget-planner/plan] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[budget-planner/plan] Token gate passed for user ${gateResult.dbUserId}`);

    const prompt = buildPrompt({ ...body, currency });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    
    let plan: any;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      plan = JSON.parse(noTrailing);
    } catch (firstError) {
      try {
        plan = cleanAndParseJSON(raw);
      } catch (secondError) {
        console.error(`[budget-planner/plan] All parsing attempts failed`);
        console.error(`[budget-planner/plan] Raw response (first 500 chars):`, raw.slice(0, 500));
        plan = generateFallbackPlan(body);
      }
    }

    // Validate required fields in plan
    if (!plan.snapshot) plan.snapshot = {};
    if (!plan.categoryPlan) plan.categoryPlan = [];
    if (!plan.weeklyPlan) plan.weeklyPlan = [];
    if (!plan.cutSuggestions) plan.cutSuggestions = [];
    if (!plan.survivalTips) plan.survivalTips = [];
    if (!plan.scenarios) plan.scenarios = [];
    if (!plan.emergencyPlan) plan.emergencyPlan = {};
    if (!plan.motivation) plan.motivation = "Keep going — every small step counts.";
    if (!plan.shareCard) plan.shareCard = {};

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "budget-planner/plan", {
      totalBudget: body.totalBudget,
      timeframeDays: body.timeframeDays,
      fixedCount: body.fixedExpenses.length,
      flexibleCount: body.flexibleExpenses.length,
      processingMs,
    });
    console.log(`[budget-planner/plan] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[budget-planner/plan] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      plan,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        timeframeDays: body.timeframeDays,
        fixedExpensesCount: body.fixedExpenses.length,
        flexibleExpensesCount: body.flexibleExpenses.length,
      }
    });
  } catch (err: any) {
    console.error("[budget-planner/plan] Error:", err);

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
      console.error("[budget-planner/plan] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: err.message ?? "Plan generation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}



// // =============================================================================
// // isaacpaha.com — Smart Budget Survival Planner: Plan API
// // app/api/tools/budget-planner/plan/route.ts
// //
// // POST {
// //   totalBudget, currency, timeframeDays,
// //   fixedExpenses[],   — rent, bills, transport, subscriptions
// //   flexibleExpenses[] — food, entertainment, misc
// // }
// //
// // Returns comprehensive JSON survival plan:
// //   - snapshot:        key numbers (daily budget, risk, days viable)
// //   - categoryPlan:    daily & weekly allocation per category
// //   - weeklyPlan:      week-by-week breakdown
// //   - cutSuggestions:  specific places to reduce spending
// //   - survivalTips:    practical, humane guidance (not lectures)
// //   - scenarios:       "what if I cut £X" simulations
// //   - emergencyPlan:   bare-minimum survival version
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request)
// const TOKEN_COST = 40000000000; // Adjust based on expected response length and model pricing
// export interface ExpenseItem {
//   id:       string;
//   label:    string;
//   amount:   number;
//   category: string;
// }

// export interface BudgetPlanRequest {
//   totalBudget:       number;
//   currency:          string;   // "GBP" | "USD" | "EUR"
//   timeframeDays:     number;   // e.g. 30
//   fixedExpenses:     ExpenseItem[];
//   flexibleExpenses:  ExpenseItem[];
// }

// function buildPrompt(data: BudgetPlanRequest): string {
//   const sym             = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
//   const totalFixed      = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
//   const totalFlexible   = data.flexibleExpenses.reduce((s, e) => s + e.amount, 0);
//   const totalExpenses   = totalFixed + totalFlexible;
//   const remaining       = data.totalBudget - totalFixed;
//   const dailyTotal      = data.totalBudget / data.timeframeDays;
//   const dailyFixed      = totalFixed / data.timeframeDays;
//   const dailyFlexible   = remaining / data.timeframeDays;
//   const daysViable      = remaining > 0 ? Math.floor(remaining / (totalFlexible / data.timeframeDays)) : 0;
//   const weeksCount      = Math.ceil(data.timeframeDays / 7);

//   const riskLevel = remaining <= 0 ? "CRITICAL"
//     : dailyFlexible < 5 ? "CRITICAL"
//     : dailyFlexible < 10 ? "TIGHT"
//     : dailyFlexible < 20 ? "MANAGEABLE"
//     : "COMFORTABLE";

//   return `You are a warm, practical, non-judgmental AI financial planning assistant helping someone figure out how to survive on a limited budget. Your tone is supportive — like a knowledgeable friend who helps people think clearly without making them feel bad about their situation.

// BUDGET SITUATION:
// Total money available: ${sym}${data.totalBudget.toLocaleString()}
// Timeframe: ${data.timeframeDays} days (${weeksCount} weeks)
// Currency: ${data.currency}

// Fixed expenses (unavoidable):
// ${data.fixedExpenses.length > 0 ? data.fixedExpenses.map(e => `- ${e.label}: ${sym}${e.amount}`).join("\n") : "- None listed"}
// Total fixed: ${sym}${totalFixed.toLocaleString()}

// Flexible/variable spending:
// ${data.flexibleExpenses.length > 0 ? data.flexibleExpenses.map(e => `- ${e.label}: ${sym}${e.amount}`).join("\n") : "- None listed"}
// Total flexible: ${sym}${totalFlexible.toLocaleString()}

// KEY NUMBERS:
// - After fixed costs: ${sym}${remaining.toLocaleString()} left for ${data.timeframeDays} days
// - Daily budget (total): ${sym}${dailyTotal.toFixed(2)}/day
// - Daily budget (flexible): ${sym}${dailyFlexible.toFixed(2)}/day
// - Current risk level: ${riskLevel}

// Return ONLY valid JSON (no markdown, no backticks):

// {
//   "snapshot": {
//     "totalBudget": ${data.totalBudget},
//     "timeframeDays": ${data.timeframeDays},
//     "totalFixed": ${totalFixed},
//     "totalFlexible": ${totalFlexible},
//     "remaining": ${remaining},
//     "dailyBudgetTotal": <number, 2 decimal places>,
//     "dailyBudgetFlexible": <number, 2 decimal places>,
//     "weeklyBudget": <number>,
//     "riskLevel": "${riskLevel}",
//     "riskLabel": "<Safe|Tight|Unsustainable>",
//     "riskColour": "<#10b981|#f59e0b|#ef4444>",
//     "daysViable": ${daysViable > data.timeframeDays ? data.timeframeDays : daysViable},
//     "headline": "<one punchy, honest, non-judgmental headline — e.g. 'You have £8.20/day to work with — here's how to make it count'>",
//     "summary": "<2-3 honest, warm sentences summarising the situation and the key thing they need to do>",
//     "survivalVerdict": "<Can survive|Tight but possible|Very tight|Unsustainable — needs cuts>"
//   },

//   "categoryPlan": [
//     {
//       "category": "<e.g. Food, Transport, Bills, Entertainment, Miscellaneous>",
//       "dailyAllocation": <number>,
//       "weeklyAllocation": <number>,
//       "totalAllocation": <number>,
//       "type": "<fixed|flexible>",
//       "tips": "<1-2 specific, practical tips for this category — budget-friendly, realistic>",
//       "priority": "<Essential|Important|Discretionary>"
//     }
//   ],

//   "weeklyPlan": [
//     {
//       "week": <1 to ${weeksCount}>,
//       "label": "Week <N>",
//       "startDay": <day number>,
//       "endDay": <day number>,
//       "totalBudget": <number>,
//       "fixedCosts": <number>,
//       "flexibleBudget": <number>,
//       "dailyLimit": <number>,
//       "focus": "<one specific focus or watchout for this week>",
//       "milestone": "<optional milestone — e.g. 'Halfway point — check remaining balance'>"
//     }
//   ],

//   "cutSuggestions": [
//     {
//       "category": "<category name>",
//       "currentAmount": <number>,
//       "suggestedAmount": <number>,
//       "saving": <number>,
//       "dailyImpact": <number, how much extra per day this unlocks>,
//       "suggestion": "<specific, practical suggestion — not generic. e.g. 'Swap branded groceries for own-brand and meal-prep Sundays — saves ~£3/day'>",
//       "difficulty": "<Easy|Medium|Requires planning>"
//     }
//   ],

//   "survivalTips": [
//     {
//       "tip": "<specific, actionable, warm tip — budget-friendly meal ideas, transport hacks, subscription cancels, etc.>",
//       "category": "<Food|Transport|Entertainment|Bills|Miscellaneous|General>",
//       "potentialSaving": "<e.g. '£15-20/week'>",
//       "effort": "<Low|Medium|One-time>"
//     }
//   ],

//   "scenarios": [
//     {
//       "name": "If you cut spending by ${sym}50",
//       "change": -50,
//       "changeType": "spending_reduction",
//       "newDailyFlexible": <number>,
//       "newDaysViable": <number>,
//       "impact": "<specific impact — e.g. 'Adds £1.60/day and extends your runway by 5 days'>",
//       "howTo": "<specific suggestion for where to find this saving>"
//     },
//     {
//       "name": "If you earn ${sym}200 extra",
//       "change": 200,
//       "changeType": "income_increase",
//       "newDailyFlexible": <number>,
//       "newDaysViable": <number>,
//       "impact": "<specific impact>",
//       "howTo": "Sell unused items, freelance work, or one extra shift"
//     },
//     {
//       "name": "Emergency Mode (bare minimum)",
//       "change": 0,
//       "changeType": "emergency",
//       "newDailyFlexible": <number — essentials only>,
//       "newDaysViable": ${data.timeframeDays},
//       "impact": "<how long they can survive on bare essentials only>",
//       "howTo": "<what bare minimum looks like — keep it specific and realistic>"
//     }
//   ],

//   "emergencyPlan": {
//     "dailyLimit": <number — absolute minimum>,
//     "description": "<2-3 sentences: what this looks like in practice, what to cut entirely>",
//     "essentials": ["<essential 1>", "<essential 2>", "<essential 3>"],
//     "cutEntirely": ["<thing to stop entirely 1>", "<thing to stop entirely 2>"]
//   },

//   "motivation": "<1-2 warm, genuine, specific sentences — acknowledge the difficulty, reference their actual numbers, end with a practical thought. Do NOT say generic things like 'You've got this!'>",

//   "shareCard": {
//     "headline": "<short, shareable, relatable headline — e.g. 'Surviving 30 days on £400. Day 1.' or 'My daily budget is £6.20. Let's see how this goes.'> ",
//     "stats": "<2-3 key numbers formatted for sharing>"
//   }
// }

// RULES:
// - All monetary values must be numbers, not strings.
// - categoryPlan must include ALL categories from both fixed AND flexible expenses, plus any you identify.
// - cutSuggestions: only suggest cuts to flexible/variable spending — never suggest cutting rent or essential bills.
// - survivalTips: must be SPECIFIC (e.g. "make porridge for breakfast at ~25p/serving" not "eat cheaply").
// - Be honest about how tight the situation is — but always frame it as "here's what you can do" not "you're in trouble".
// - If remaining <= 0 (can't cover fixed costs), acknowledge this clearly but gently and focus on what needs to happen.
// - weeklyPlan must have exactly ${weeksCount} weeks.`;
// }

// export async function POST(req: NextRequest) {
//   console.log(`[budget-planner/plan] Received request at ${new Date().toISOString()}`);
//   try {
//     console.log("[budget-planner/plan] Request body:", await req.clone().text());
//     const body: BudgetPlanRequest = await req.json();

//     if (!body.totalBudget || body.totalBudget <= 0) {
//       return NextResponse.json({ error: "Total budget is required" }, { status: 400 });
//     }
//     if (!body.timeframeDays || body.timeframeDays < 1) {
//       return NextResponse.json({ error: "Timeframe must be at least 1 day" }, { status: 400 });
//     }

//       // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//       const gate = await tokenGate(req, TOKEN_COST, { toolName: "Budget Survival Planner" });
//       console.log(`[budget-planner/plan] Token gate result:`, gate);
//       if (!gate.ok) return gate.response; // sends 402 JSON to client
//       console.log(`[budget-planner/plan] Token gate passed for user ${gate.dbUserId}, proceeding with budget plan generation.`);

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 4000,
//       messages:   [{ role: "user", content: buildPrompt(body) }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let plan: any;
//     try { plan = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Plan generation failed — invalid response" }, { status: 500 });
//       plan = JSON.parse(match[0]);
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "budget-planner/plan", { ...body, userId: gate.dbUserId });
//     console.log(`[budget-planner/plan] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for budget plan generation.`);


//     return NextResponse.json({ ok: true, plan });
//   } catch (err: any) {
//     console.error("[budget-planner/plan]", err);
//     return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
//   }
// }