// =============================================================================
// isaacpaha.com — Debt Recovery Planner: Generate Plan API
// app/api/tools/debt-planner/plan/route.ts
//
// POST { debts[], income, fixedExpenses[], variableExpenses[], strategy, targetMonths? }
// Returns comprehensive JSON repayment plan:
//   - financialSnapshot: totals, surplus, risk level
//   - repaymentPlan: month-by-month breakdown
//   - weeklyActions: 5-7 specific weekly habits
//   - insights: 4-5 honest, supportive observations
//   - scenarioSimulations: "+£100/mo" and "-£100 spending" impact
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "debt-planner";
const TOKEN_COST = 150; // Higher cost for comprehensive plan generation
const TOOL_NAME = "Debt Recovery Plan Generator";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[debt-planner/plan] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[debt-planner/plan] Failed to load tool ID:`, err);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DebtItem {
  label: string;       // "Barclays Credit Card", "Student Loan"
  balance: number;     // current balance owed
  type: string;        // "CREDIT_CARD" | "PERSONAL_LOAN" | etc.
  apr?: number;        // annual interest rate % (optional)
  minPayment?: number; // monthly minimum (optional)
  deadline?: string;   // ISO date if there's a hard deadline
}

export interface ExpenseItem {
  label: string;
  amount: number;
}

export interface PlanRequest {
  debts: DebtItem[];
  monthlyIncome: number;
  currency: string;
  fixedExpenses: ExpenseItem[];
  variableExpenses: ExpenseItem[];
  strategy: "SNOWBALL" | "AVALANCHE" | "HYBRID";
  targetMonths?: number;
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

// Generate fallback plan if AI fails
function generateFallbackPlan(data: PlanRequest): any {
  const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const totalDebt = data.debts.reduce((s, d) => s + d.balance, 0);
  const totalFixed = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalVariable = data.variableExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalFixed + totalVariable;
  const surplus = data.monthlyIncome - totalExpenses;
  
  return {
    financialSnapshot: {
      totalDebt,
      monthlyIncome: data.monthlyIncome,
      totalExpenses,
      monthlySurplus: surplus,
      totalMinimums: data.debts.reduce((s, d) => s + (d.minPayment ?? 0), 0),
      availableForDebt: Math.max(0, surplus),
      riskLevel: surplus < 0 ? "CRITICAL" : surplus < 100 ? "HIGH" : surplus < 300 ? "MEDIUM" : "LOW",
      riskExplanation: "Based on your current income and expenses",
      estimatedMonthsToDebtFree: 36,
      estimatedPayoffDate: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      totalInterestEstimate: Math.round(totalDebt * 0.15),
      monthlySurplusAfterMinimums: Math.max(0, surplus - data.debts.reduce((s, d) => s + (d.minPayment ?? 0), 0)),
      recommendedMonthlyPayment: Math.min(surplus, totalDebt),
    },
    strategyExplained: "We recommend starting with the snowball method to build momentum",
    debtOrder: data.debts.map((d, i) => ({
      label: d.label,
      balance: d.balance,
      priority: i + 1,
      reason: "Based on your financial situation",
    })),
    monthlyPlan: [
      {
        month: 1,
        label: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        totalPayment: Math.min(Math.max(0, surplus), totalDebt),
        essentials: totalFixed,
        discretionary: totalVariable,
        remainingDebt: Math.max(0, totalDebt - surplus),
        milestone: "First step taken",
        debtBreakdown: data.debts.map(d => ({ label: d.label, payment: 0, balance: d.balance })),
      },
    ],
    weeklyActions: [
      `Set up a ${sym}${Math.max(10, Math.floor(surplus / 4))} standing order to your highest-priority debt on payday`,
      "Review your bank statements to identify any subscriptions you can pause",
      "Track your variable spending for one week to see where money goes",
      "Celebrate small wins — every payment is progress",
    ],
    insights: [
      `You have ${sym}${totalDebt.toLocaleString()} in total debt. Taking the first step is what matters most.`,
      `Your monthly surplus is ${sym}${surplus.toLocaleString()}. Every pound helps move you forward.`,
      "Small, consistent payments add up over time. You've got this.",
      "Financial freedom is a journey — you're on the right path by creating a plan.",
    ],
    scenarioSimulations: {
      plus100: {
        label: `If you paid ${sym}100 extra per month`,
        newEstimatedMonths: Math.max(1, Math.floor(totalDebt / (Math.max(10, surplus) + 100))),
        monthsSaved: Math.max(0, 36 - Math.floor(totalDebt / (Math.max(10, surplus) + 100))),
        interestSaved: Math.round(totalDebt * 0.15 * 0.2),
      },
      minus100spending: {
        label: `If you reduced variable spending by ${sym}100`,
        newEstimatedMonths: Math.max(1, Math.floor(totalDebt / (Math.max(10, surplus) + 100))),
        monthsSaved: Math.max(0, 36 - Math.floor(totalDebt / (Math.max(10, surplus) + 100))),
        freeingUp: `${sym}100 extra per month for debt`,
      },
      plus200: {
        label: `If you paid ${sym}200 extra per month`,
        newEstimatedMonths: Math.max(1, Math.floor(totalDebt / (Math.max(10, surplus) + 200))),
        monthsSaved: Math.max(0, 36 - Math.floor(totalDebt / (Math.max(10, surplus) + 200))),
        interestSaved: Math.round(totalDebt * 0.15 * 0.4),
      },
    },
    microGoals: [
      { goal: `Pay off first ${sym}500`, targetMonth: 3, celebrationNote: "Treat yourself to something small" },
      { goal: "Clear first debt", targetMonth: 6, celebrationNote: "Share your win with someone" },
      { goal: "Halfway milestone", targetMonth: 18, celebrationNote: "Take a moment to appreciate how far you've come" },
      { goal: "Final debt cleared", targetMonth: 36, celebrationNote: "Celebrate your financial freedom!" },
    ],
    lifestyleSuggestions: [
      { category: "Subscriptions", suggestion: "Review and pause any unused subscriptions", estimatedSaving: `${sym}20/month` },
      { category: "Groceries", suggestion: "Plan meals for the week to avoid impulse buys", estimatedSaving: `${sym}40/month` },
    ],
    disclaimer: "This plan is for guidance and planning purposes only. It does not constitute regulated financial advice. If you are struggling with debt, please consider contacting a free debt charity such as StepChange (UK) or speaking with a qualified financial adviser.",
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(data: PlanRequest): string {
  const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const totalDebt = data.debts.reduce((s, d) => s + d.balance, 0);
  const totalFixed = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalVariable = data.variableExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalFixed + totalVariable;
  const totalMinimums = data.debts.reduce((s, d) => s + (d.minPayment ?? 0), 0);
  const surplus = data.monthlyIncome - totalExpenses;
  const availableForDebt = Math.max(0, surplus);

  return `You are an empathetic, practical AI financial planning assistant. Your role is to help this person understand their situation clearly and give them a realistic, achievable plan — NOT to alarm them or provide strict financial advice.

⚠️ IMPORTANT FRAMING: You are providing guidance and planning support, NOT regulated financial advice. Always be supportive, honest, and humane.

FINANCIAL SITUATION:
Monthly income: ${sym}${data.monthlyIncome.toLocaleString()}
Total debt: ${sym}${totalDebt.toLocaleString()}
Fixed expenses: ${sym}${totalFixed.toLocaleString()} (${data.fixedExpenses.map(e => `${e.label}: ${sym}${e.amount}`).join(", ")})
Variable expenses: ${sym}${totalVariable.toLocaleString()} (${data.variableExpenses.map(e => `${e.label}: ${sym}${e.amount}`).join(", ")})
Monthly surplus (after all expenses): ${sym}${surplus.toLocaleString()}
Current minimum payments: ${sym}${totalMinimums.toLocaleString()}
Strategy preference: ${data.strategy}
${data.targetMonths ? `Target debt-free timeline: ${data.targetMonths} months` : "No specific timeline — suggest realistic one"}

DEBTS:
${data.debts.map((d, i) => `${i + 1}. ${d.label}: ${sym}${d.balance.toLocaleString()} balance${d.apr ? `, ${d.apr}% APR` : " (APR unknown)"}${d.minPayment ? `, ${sym}${d.minPayment}/mo minimum` : ""}${d.deadline ? `, deadline: ${d.deadline}` : ""}`).join("\n")}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure (every field must be filled):

{
  "financialSnapshot": {
    "totalDebt": ${totalDebt},
    "monthlyIncome": ${data.monthlyIncome},
    "totalExpenses": ${totalExpenses},
    "monthlySurplus": ${surplus},
    "totalMinimums": ${totalMinimums},
    "availableForDebt": <number>,
    "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "riskExplanation": "<1 sentence honest, non-alarming explanation>",
    "estimatedMonthsToDebtFree": <integer>,
    "estimatedPayoffDate": "<Month YYYY>",
    "totalInterestEstimate": <number>,
    "monthlySurplusAfterMinimums": <number>,
    "recommendedMonthlyPayment": <number>
  },

  "strategyExplained": "<2-3 sentences explaining why ${data.strategy} is the right approach>",

  "debtOrder": [
    { "label": "<debt name>", "balance": <number>, "priority": <1-based ranking>, "reason": "<short reason>" }
  ],

  "monthlyPlan": [
    {
      "month": 1,
      "label": "<Month YYYY>",
      "totalPayment": <number>,
      "essentials": <number>,
      "discretionary": <number>,
      "remainingDebt": <number>,
      "milestone": "<string or null>",
      "debtBreakdown": [
        { "label": "<debt name>", "payment": <number>, "balance": <number> }
      ]
    }
  ],

  "weeklyActions": [
    "<specific, realistic weekly action>"
  ],

  "insights": [
    "<honest, supportive insight>"
  ],

  "scenarioSimulations": {
    "plus100": {
      "label": "If you paid ${sym}100 extra per month",
      "newEstimatedMonths": <integer>,
      "monthsSaved": <integer>,
      "interestSaved": <number>
    },
    "minus100spending": {
      "label": "If you reduced variable spending by ${sym}100",
      "newEstimatedMonths": <integer>,
      "monthsSaved": <integer>,
      "freeingUp": "${sym}100 extra per month for debt"
    },
    "plus200": {
      "label": "If you paid ${sym}200 extra per month",
      "newEstimatedMonths": <integer>,
      "monthsSaved": <integer>,
      "interestSaved": <number>
    }
  },

  "microGoals": [
    { "goal": "<first achievable milestone>", "targetMonth": <integer>, "celebrationNote": "<brief celebration idea>" }
  ],

  "lifestyleSuggestions": [
    { "category": "<category>", "suggestion": "<humane suggestion>", "estimatedSaving": "${sym}<amount>/month" }
  ],

  "disclaimer": "This plan is for guidance and planning purposes only. It does not constitute regulated financial advice. If you are struggling with debt, please consider contacting a free debt charity such as StepChange (UK) or speaking with a qualified financial adviser."
}

Rules:
- monthlyPlan should cover EVERY month until debt-free (max 60 months — if longer, show first 12 and note it)  
- Be REALISTIC: if their surplus is very small, say so kindly — don't magic up money they don't have
- weeklyActions must be specific to their actual expenses
- NEVER suggest unhealthy food restriction, working dangerous hours, or anything extreme
- insights should feel like advice from a knowledgeable, empathetic friend
- Use ${sym} throughout all monetary values`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const body: PlanRequest = await req.json();

    // Validate required fields
    if (!body.debts?.length || !body.monthlyIncome || body.monthlyIncome <= 0) {
      return NextResponse.json(
        { error: "At least one debt and monthly income are required" },
        { status: 400 }
      );
    }

    if (body.debts.some((d) => d.balance <= 0)) {
      return NextResponse.json(
        { error: "All debt balances must be greater than zero" },
        { status: 400 }
      );
    }

    // Validate strategy
    const validStrategies = ["SNOWBALL", "AVALANCHE", "HYBRID"];
    const validStrategy = validStrategies.includes(body.strategy) ? body.strategy : "SNOWBALL";

    // Validate currency
    const validCurrencies = ["GBP", "USD", "EUR"];
    const currency = validCurrencies.includes(body.currency) ? body.currency : "GBP";

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[debt-planner/plan] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[debt-planner/plan] Token gate passed for user ${gateResult.dbUserId}`);

    const prompt = buildPrompt({ ...body, strategy: validStrategy, currency });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
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
        console.error(`[debt-planner/plan] All parsing attempts failed`);
        console.error(`[debt-planner/plan] Raw response (first 500 chars):`, raw.slice(0, 500));
        plan = generateFallbackPlan(body);
      }
    }

    // Ensure disclaimer is present
    if (!plan.disclaimer) {
      plan.disclaimer = "This plan is for guidance and planning purposes only. It does not constitute regulated financial advice. If you are struggling with debt, please consider contacting a free debt charity such as StepChange (UK) or speaking with a qualified financial adviser.";
    }

    // Ensure required arrays exist
    if (!plan.weeklyActions || !Array.isArray(plan.weeklyActions)) plan.weeklyActions = [];
    if (!plan.insights || !Array.isArray(plan.insights)) plan.insights = [];
    if (!plan.microGoals || !Array.isArray(plan.microGoals)) plan.microGoals = [];
    if (!plan.lifestyleSuggestions || !Array.isArray(plan.lifestyleSuggestions)) plan.lifestyleSuggestions = [];

    // ── ② DEDUCT tokens — only after successful plan generation ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "debt-planner/plan", {
      debtCount: body.debts.length,
      strategy: validStrategy,
      hasTarget: !!body.targetMonths,
      processingMs,
    });
    console.log(`[debt-planner/plan] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[debt-planner/plan] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      plan,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        debtCount: body.debts.length,
        strategy: validStrategy,
      }
    });
  } catch (err: any) {
    console.error("[debt-planner/plan] Error:", err);

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
      console.error("[debt-planner/plan] Failed to track error:", trackError);
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
// // isaacpaha.com — Debt Recovery Planner: Generate Plan API
// // app/api/tools/debt-planner/plan/route.ts
// //
// // POST { debts[], income, fixedExpenses[], variableExpenses[], strategy, targetMonths? }
// // Returns comprehensive JSON repayment plan:
// //   - financialSnapshot: totals, surplus, risk level
// //   - repaymentPlan: month-by-month breakdown
// //   - weeklyActions: 5-7 specific weekly habits
// //   - insights: 4-5 honest, supportive observations
// //   - scenarioSimulations: "+£100/mo" and "-£100 spending" impact
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 150000000000; // Adjust based on expected response length and model pricing

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface DebtItem {
//   label:       string;   // "Barclays Credit Card", "Student Loan"
//   balance:     number;   // current balance owed
//   type:        string;   // "CREDIT_CARD" | "PERSONAL_LOAN" | etc.
//   apr?:        number;   // annual interest rate % (optional)
//   minPayment?: number;   // monthly minimum (optional)
//   deadline?:   string;   // ISO date if there's a hard deadline
// }

// export interface ExpenseItem {
//   label:  string;
//   amount: number;
// }

// export interface PlanRequest {
//   debts:            DebtItem[];
//   monthlyIncome:    number;
//   currency:         string;
//   fixedExpenses:    ExpenseItem[];
//   variableExpenses: ExpenseItem[];
//   strategy:         "SNOWBALL" | "AVALANCHE" | "HYBRID";
//   targetMonths?:    number;
// }

// // ─── Prompt builder ───────────────────────────────────────────────────────────

// function buildPrompt(data: PlanRequest): string {
//   const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
//   const totalDebt      = data.debts.reduce((s, d) => s + d.balance, 0);
//   const totalFixed     = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
//   const totalVariable  = data.variableExpenses.reduce((s, e) => s + e.amount, 0);
//   const totalExpenses  = totalFixed + totalVariable;
//   const totalMinimums  = data.debts.reduce((s, d) => s + (d.minPayment ?? 0), 0);
//   const surplus        = data.monthlyIncome - totalExpenses;
//   const availableForDebt = Math.max(0, surplus);

//   return `You are an empathetic, practical AI financial planning assistant. Your role is to help this person understand their situation clearly and give them a realistic, achievable plan — NOT to alarm them or provide strict financial advice.

// ⚠️ IMPORTANT FRAMING: You are providing guidance and planning support, NOT regulated financial advice. Always be supportive, honest, and humane.

// FINANCIAL SITUATION:
// Monthly income: ${sym}${data.monthlyIncome.toLocaleString()}
// Total debt: ${sym}${totalDebt.toLocaleString()}
// Fixed expenses: ${sym}${totalFixed.toLocaleString()} (${data.fixedExpenses.map(e => `${e.label}: ${sym}${e.amount}`).join(", ")})
// Variable expenses: ${sym}${totalVariable.toLocaleString()} (${data.variableExpenses.map(e => `${e.label}: ${sym}${e.amount}`).join(", ")})
// Monthly surplus (after all expenses): ${sym}${surplus.toLocaleString()}
// Current minimum payments: ${sym}${totalMinimums.toLocaleString()}
// Strategy preference: ${data.strategy}
// ${data.targetMonths ? `Target debt-free timeline: ${data.targetMonths} months` : "No specific timeline — suggest realistic one"}

// DEBTS:
// ${data.debts.map((d, i) => `${i + 1}. ${d.label}: ${sym}${d.balance.toLocaleString()} balance${d.apr ? `, ${d.apr}% APR` : " (APR unknown)"}${d.minPayment ? `, ${sym}${d.minPayment}/mo minimum` : ""}${d.deadline ? `, deadline: ${d.deadline}` : ""}`).join("\n")}

// Return ONLY valid JSON (no markdown, no backticks, no explanation):

// {
//   "financialSnapshot": {
//     "totalDebt": ${totalDebt},
//     "monthlyIncome": ${data.monthlyIncome},
//     "totalExpenses": ${totalExpenses},
//     "monthlySurplus": ${surplus},
//     "totalMinimums": ${totalMinimums},
//     "availableForDebt": <surplus minus minimums, or surplus if no minimums>,
//     "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
//     "riskExplanation": "<1 sentence honest, non-alarming explanation of their risk level>",
//     "estimatedMonthsToDebtFree": <realistic integer>,
//     "estimatedPayoffDate": "<Month YYYY>",
//     "totalInterestEstimate": <rough estimate of total interest if APRs known, else 0>,
//     "monthlySurplusAfterMinimums": <surplus minus minimum payments>,
//     "recommendedMonthlyPayment": <what we recommend they put toward debt each month>
//   },

//   "strategyExplained": "<2-3 sentences explaining why ${data.strategy} is the right approach for their specific situation, referencing their actual debts>",

//   "debtOrder": [
//     {
//       "label": "<debt name>",
//       "balance": <amount>,
//       "priority": <1-based ranking in payoff order>,
//       "reason": "<short reason why this is paid first/last>"
//     }
//   ],

//   "monthlyPlan": [
//     {
//       "month": 1,
//       "label": "<Month YYYY>",
//       "totalPayment": <amount to put toward ALL debts this month>,
//       "essentials": <amount for essential living>,
//       "discretionary": <amount for variable spending>,
//       "remainingDebt": <total debt remaining after this month>,
//       "milestone": "<optional motivational milestone note — e.g. 'Credit card cleared!' or null>",
//       "debtBreakdown": [
//         { "label": "<debt name>", "payment": <amount>, "balance": <remaining after payment> }
//       ]
//     }
//   ],

//   "weeklyActions": [
//     "<specific, realistic weekly action — e.g. 'Set up a £X standing order to your highest-priority debt on payday'>",
//     "<practical budgeting tip specific to their expenses>",
//     "<a variable expense reduction that's realistic, not punishing>",
//     "<positive habit that builds momentum>",
//     "<one thing to do this week to gain control>"
//   ],

//   "insights": [
//     "<honest, supportive insight 1 — reference their specific numbers>",
//     "<insight 2 — something encouraging based on their data>",
//     "<insight 3 — a specific pattern or opportunity in their finances>",
//     "<insight 4 — forward-looking: what life looks like on the other side>"
//   ],

//   "scenarioSimulations": {
//     "plus100": {
//       "label": "If you paid ${sym}100 extra per month",
//       "newEstimatedMonths": <integer>,
//       "monthsSaved": <integer>,
//       "interestSaved": <estimate>
//     },
//     "minus100spending": {
//       "label": "If you reduced variable spending by ${sym}100",
//       "newEstimatedMonths": <integer>,
//       "monthsSaved": <integer>,
//       "freeingUp": "${sym}100 extra per month for debt"
//     },
//     "plus200": {
//       "label": "If you paid ${sym}200 extra per month",
//       "newEstimatedMonths": <integer>,
//       "monthsSaved": <integer>,
//       "interestSaved": <estimate>
//     }
//   },

//   "microGoals": [
//     { "goal": "<first achievable milestone — e.g. Pay off first £500>", "targetMonth": <integer>, "celebrationNote": "<how to mark this win>" },
//     { "goal": "<clear first debt>",     "targetMonth": <integer>, "celebrationNote": "<brief celebration idea>" },
//     { "goal": "<halfway milestone>",    "targetMonth": <integer>, "celebrationNote": "<brief celebration idea>" },
//     { "goal": "<final debt cleared>",   "targetMonth": <integer>, "celebrationNote": "<heartfelt congratulations>" }
//   ],

//   "lifestyleSuggestions": [
//     { "category": "<Groceries|Subscriptions|Transport|Energy|Entertainment|Food & Drink>", "suggestion": "<realistic, humane suggestion>", "estimatedSaving": "${sym}<amount>/month" }
//   ],

//   "disclaimer": "This plan is for guidance and planning purposes only. It does not constitute regulated financial advice. If you are struggling with debt, please consider contacting a free debt charity such as StepChange (UK) or speaking with a qualified financial adviser."
// }

// Rules:
// - monthlyPlan should cover EVERY month until debt-free (max 60 months — if longer, show first 12 and note it)  
// - Be REALISTIC: if their surplus is very small, say so kindly — don't magic up money they don't have
// - weeklyActions must be specific to their actual expenses (e.g. "Your Netflix/Spotify/etc subscription...")
// - NEVER suggest unhealthy food restriction, working dangerous hours, or anything extreme
// - insights should feel like advice from a knowledgeable, empathetic friend — not a robot
// - Use ${sym} throughout all monetary values`;
// }

// // ─── Route ────────────────────────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   try {
//     const body: PlanRequest = await req.json();

//     if (!body.debts?.length || !body.monthlyIncome || body.monthlyIncome <= 0) {
//       return NextResponse.json({ error: "At least one debt and monthly income are required" }, { status: 400 });
//     }

//     if (body.debts.some((d) => d.balance <= 0)) {
//       return NextResponse.json({ error: "All debt balances must be greater than zero" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Debt Recovery Plan Generator" });
//     console.log(`[debt-planner/plan] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[debt-planner/plan] Token gate passed for user ${gate.dbUserId} — proceeding with plan generation`);

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 6000,
//       messages:   [{ role: "user", content: buildPrompt(body) }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let plan: any;
//     try {
//       plan = JSON.parse(clean);
//     } catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Plan generation failed — please try again" }, { status: 500 });
//       plan = JSON.parse(match[0]);
//     }

//     return NextResponse.json({ ok: true, plan });
//   } catch (err: any) {
//     console.error("[debt-planner/plan]", err);
//     return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
//   }
// }