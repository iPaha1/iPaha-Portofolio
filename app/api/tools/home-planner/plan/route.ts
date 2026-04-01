// =============================================================================
// isaacpaha.com — First Home Planner: Generate Plan API
// app/api/tools/home-planner/plan/route.ts
//
// POST { income, savings, expenses, targetPrice, depositPct, timeframeMonths,
//        propertyType, location, currency }
//
// Returns comprehensive home buying readiness plan:
//   - readinessSnapshot: scores, gap analysis, timeline
//   - depositPlan: monthly savings target, milestones
//   - mortgageReadiness: phase-by-phase roadmap
//   - creditActions: specific credit-building steps
//   - monthlyActionPlan: 30-day focus items
//   - ukSchemes: relevant first-time buyer schemes
//   - scenarioSimulations: "save more / buy cheaper / take longer"
//   - aiInsights: 4-5 honest personalised observations
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "home-planner";
const TOKEN_COST = 150; // Higher cost for comprehensive plan generation
const TOOL_NAME = "Home Ownership Plan Generator";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[home-planner/plan] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[home-planner/plan] Failed to load tool ID:`, err);
}

export interface PlanRequest {
  monthlyIncome: number;
  currentSavings: number;
  monthlyExpenses: number;
  existingDebt: number;       // total existing monthly debt repayments
  targetPrice: number;
  depositPercent: number;     // 5, 10, or 20
  timeframeMonths: number;    // how many months user wants to buy in
  propertyType: string;       // "flat" | "house" | "shared_ownership" | "new_build"
  location?: string;          // optional: UK city / region
  currency: string;           // "GBP" | "USD" | "EUR"
  creditScore?: string;       // "excellent" | "good" | "fair" | "poor" | "unknown"
  isFirstTimeBuyer: boolean;
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

function buildPrompt(d: PlanRequest): string {
  const sym = d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : "£";
  const depositAmt = Math.round(d.targetPrice * (d.depositPercent / 100));
  const savingsGap = Math.max(0, depositAmt - d.currentSavings);
  const monthlySurplus = d.monthlyIncome - d.monthlyExpenses - d.existingDebt;
  const monthsNeeded = savingsGap > 0 && monthlySurplus > 0
    ? Math.ceil(savingsGap / monthlySurplus)
    : 0;

  return `You are a warm, encouraging, and deeply practical AI home ownership planning coach.

⚠️ CRITICAL FRAMING: This is EDUCATIONAL GUIDANCE only — NOT regulated financial or mortgage advice. You are helping someone plan and prepare, not giving advice on which mortgage to take. Frame everything as "typically" or "generally" or "you might want to explore". NEVER say "you should get a mortgage from X" or give specific product recommendations.

USER'S SITUATION:
Monthly take-home income: ${sym}${d.monthlyIncome.toLocaleString()}
Current savings: ${sym}${d.currentSavings.toLocaleString()}
Monthly expenses (all bills, food, transport, etc.): ${sym}${d.monthlyExpenses.toLocaleString()}
Existing monthly debt repayments: ${sym}${d.existingDebt.toLocaleString()}
Monthly surplus (income minus expenses and debt): ${sym}${Math.max(0, monthlySurplus).toLocaleString()}

PROPERTY GOAL:
Target property price: ${sym}${d.targetPrice.toLocaleString()}
Deposit target: ${d.depositPercent}% = ${sym}${depositAmt.toLocaleString()}
Savings gap to deposit: ${sym}${savingsGap.toLocaleString()}
Property type: ${d.propertyType}
${d.location ? `Location: ${d.location}` : "Location: not specified"}
First-time buyer: ${d.isFirstTimeBuyer ? "Yes" : "No"}
Credit score self-assessment: ${d.creditScore ?? "unknown"}

TIMELINE:
User's goal timeframe: ${d.timeframeMonths} months
Months needed at current savings rate: ${monthsNeeded > 0 ? monthsNeeded : "Cannot calculate (insufficient surplus or no gap)"}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure (every field must be filled):

{
  "readinessSnapshot": {
    "overallReadinessScore": <0-100>,
    "depositReadinessScore": <0-100>,
    "incomeReadinessScore": <0-100>,
    "creditReadinessScore": <0-100>,
    "affordabilityReadinessScore": <0-100>,
    "readinessLevel": "<Not Ready Yet|Getting There|Nearly Ready|Ready>",
    "realisticTimelineMonths": <number>,
    "realisticTargetDate": "<Month Year>",
    "isGoalTimelineRealistic": <boolean>,
    "timelineGapMonths": <number>,
    "keyBlocker": "<the single biggest thing holding them back>",
    "biggestStrength": "<the single biggest thing working in their favour>",
    "estimatedMortgagePayment": <number>,
    "estimatedMortgageSize": <number>,
    "affordabilityVerdict": "<Comfortably affordable|Manageable|Tight|Stretch|Very difficult>"
  },

  "depositPlan": {
    "depositRequired": ${depositAmt},
    "alreadySaved": ${d.currentSavings},
    "savingsGap": ${savingsGap},
    "requiredMonthlySaving": <number>,
    "realisticMonthlySaving": <number>,
    "surplusAfterSaving": <number>,
    "projectedDepositDate": "<Month Year>",
    "depositMilestones": [
      { "milestone": "<e.g. 25% of deposit saved>", "amount": <number>, "estimatedMonth": <number> }
    ],
    "savingsTips": ["<specific, actionable saving tip>"]
  },

  "mortgageReadinessRoadmap": {
    "phases": [
      {
        "phase": 1,
        "title": "<Phase title>",
        "duration": "<e.g. 'Months 1-3'>",
        "focus": "<1-2 sentence description>",
        "tasks": [
          { "task": "<specific task>", "why": "<why it matters>", "effort": "<Quick Win|1 Hour|Ongoing>" }
        ],
        "milestone": "<what success looks like>"
      }
    ]
  },

  "creditBuildingPlan": {
    "currentAssessment": "<honest 1-2 sentence assessment>",
    "targetCreditScore": "<what they're aiming for>",
    "actions": [
      { "action": "<specific action>", "impact": "<High|Medium|Low>", "timeToSeeEffect": "<e.g. '1-3 months'>", "howTo": "<brief how-to>" }
    ],
    "thingsToAvoid": ["<specific thing to avoid>"]
  },

  "monthlyActionPlan": {
    "thisMonth": [
      { "action": "<specific action>", "category": "<Savings|Credit|Expenses|Research|Legal>", "effort": "<15 mins|1 hour|Ongoing>" }
    ],
    "habitStack": ["<daily or weekly habit>"]
  },

  "ukSchemes": [
    {
      "scheme": "<scheme name>",
      "benefit": "<plain-language benefit>",
      "eligibility": "<who qualifies>",
      "potentialValue": "<rough financial benefit>",
      "relevanceScore": <0-100>,
      "url": "<gov.uk or official URL>"
    }
  ],

  "scenarioSimulations": [
    {
      "scenario": "<e.g. 'Save £200/month more'>",
      "change": "<what changes>",
      "impact": "<specific impact>",
      "newTimelineMonths": <number>,
      "type": "<Positive|Tradeoff>"
    }
  ],

  "aiInsights": [
    {
      "insight": "<specific, personalised observation>",
      "type": "<Encouragement|Warning|Opportunity|Reality Check>",
      "actionable": "<one specific thing they can do>"
    }
  ],

  "disclaimerNote": "This plan is for educational guidance and planning purposes only. It is not regulated financial or mortgage advice. For personalised mortgage advice, speak to a qualified independent mortgage adviser (IMA) registered with the Financial Conduct Authority (FCA)."
}

RULES:
- Be warm, honest, and encouraging. This is a life goal. Treat it with respect.
- Be SPECIFIC to their numbers — don't give generic advice.
- The deposit milestones should be at meaningful markers (25%, 50%, 75%, 100%).
- UK schemes: only include Lifetime ISA, Help to Buy ISA (closed but existing holders), First Homes scheme, Shared Ownership, Mortgage Guarantee Scheme.
- Scenarios: provide 3 — one where they save more, one where they target a cheaper property, one where they extend the timeline.
- Roadmap: 4 phases — roughly 6-9 months each depending on their timeline.
- Credit actions: minimum 5, maximum 8. Be UK-specific.
- Monthly action plan: 5-7 actions for this month. Specific and achievable.`;
}

// Generate fallback plan if AI fails
function generateFallbackPlan(data: PlanRequest): any {
  const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const depositAmt = Math.round(data.targetPrice * (data.depositPercent / 100));
  
  return {
    readinessSnapshot: {
      overallReadinessScore: 50,
      depositReadinessScore: Math.min(100, Math.round((data.currentSavings / depositAmt) * 100)),
      incomeReadinessScore: 50,
      creditReadinessScore: 50,
      affordabilityReadinessScore: 50,
      readinessLevel: "Getting There",
      realisticTimelineMonths: data.timeframeMonths,
      realisticTargetDate: new Date(Date.now() + data.timeframeMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      isGoalTimelineRealistic: true,
      timelineGapMonths: 0,
      keyBlocker: "We need more information to provide a detailed analysis",
      biggestStrength: "You're taking the first step by planning ahead",
      estimatedMortgagePayment: Math.round(data.targetPrice * 0.05 / 12),
      estimatedMortgageSize: data.targetPrice - depositAmt,
      affordabilityVerdict: "Manageable",
    },
    depositPlan: {
      depositRequired: depositAmt,
      alreadySaved: data.currentSavings,
      savingsGap: Math.max(0, depositAmt - data.currentSavings),
      requiredMonthlySaving: Math.max(0, (depositAmt - data.currentSavings) / data.timeframeMonths),
      realisticMonthlySaving: Math.max(0, data.monthlyIncome - data.monthlyExpenses - data.existingDebt) * 0.5,
      surplusAfterSaving: Math.max(0, data.monthlyIncome - data.monthlyExpenses - data.existingDebt) * 0.5,
      projectedDepositDate: new Date(Date.now() + data.timeframeMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      depositMilestones: [
        { milestone: "25% of deposit saved", amount: Math.round(depositAmt * 0.25), estimatedMonth: Math.round(data.timeframeMonths * 0.25) },
        { milestone: "50% of deposit saved", amount: Math.round(depositAmt * 0.5), estimatedMonth: Math.round(data.timeframeMonths * 0.5) },
        { milestone: "75% of deposit saved", amount: Math.round(depositAmt * 0.75), estimatedMonth: Math.round(data.timeframeMonths * 0.75) },
        { milestone: "100% of deposit saved", amount: depositAmt, estimatedMonth: data.timeframeMonths },
      ],
      savingsTips: ["Track your spending for one month to identify savings opportunities"],
    },
    mortgageReadinessRoadmap: {
      phases: [
        { phase: 1, title: "Build Your Foundation", duration: "Months 1-3", focus: "Establish good financial habits", tasks: [], milestone: "Clear understanding of your finances" },
      ],
    },
    creditBuildingPlan: {
      currentAssessment: "Based on the information provided, we recommend checking your credit report",
      targetCreditScore: "Aim for a good credit score to access better mortgage rates",
      actions: [{ action: "Check your credit report", impact: "High", timeToSeeEffect: "Immediate", howTo: "Use a free service like Experian or ClearScore" }],
      thingsToAvoid: ["Don't apply for new credit cards shortly before a mortgage application"],
    },
    monthlyActionPlan: {
      thisMonth: [{ action: "Review your monthly budget", category: "Expenses", effort: "1 hour" }],
      habitStack: ["Review your finances weekly"],
    },
    ukSchemes: [],
    scenarioSimulations: [],
    aiInsights: [{ insight: "We're experiencing technical difficulties. Please try again.", type: "Warning", actionable: "Refresh and try again" }],
    disclaimerNote: "This plan is for educational guidance only and not regulated financial advice.",
  };
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const data: PlanRequest = await req.json();

    // Validate required fields
    if (!data.monthlyIncome || data.monthlyIncome < 100) {
      return NextResponse.json({ error: "Monthly income is required and must be at least £100" }, { status: 400 });
    }
    
    if (!data.targetPrice || data.targetPrice < 10000) {
      return NextResponse.json({ error: "Target property price is required and must be at least £10,000" }, { status: 400 });
    }

    if (data.monthlyExpenses < 0) {
      return NextResponse.json({ error: "Monthly expenses must be a positive number" }, { status: 400 });
    }

    if (data.existingDebt < 0) {
      return NextResponse.json({ error: "Existing debt must be a positive number" }, { status: 400 });
    }

    if (data.depositPercent < 0 || data.depositPercent > 100) {
      return NextResponse.json({ error: "Deposit percentage must be between 0 and 100" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[home-planner/plan] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[home-planner/plan] Token gate passed for user ${gateResult.dbUserId}`);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      temperature: 0.3,
      messages: [{ role: "user", content: buildPrompt(data) }],
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
        console.error(`[home-planner/plan] All parsing attempts failed`);
        console.error(`[home-planner/plan] Raw response (first 500 chars):`, raw.slice(0, 500));
        plan = generateFallbackPlan(data);
      }
    }

    // Ensure disclaimer is present
    if (!plan.disclaimerNote) {
      plan.disclaimerNote = "This plan is for educational guidance and planning purposes only. It is not regulated financial or mortgage advice. For personalised mortgage advice, speak to a qualified independent mortgage adviser (IMA) registered with the Financial Conduct Authority (FCA).";
    }

    // ── ② DEDUCT tokens — only after successful plan generation ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "home-planner/plan", {
      propertyType: data.propertyType,
      location: data.location ?? "unspecified",
      hasDebt: data.existingDebt > 0,
      processingMs,
    });
    console.log(`[home-planner/plan] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[home-planner/plan] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      plan,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        propertyType: data.propertyType,
        isFirstTimeBuyer: data.isFirstTimeBuyer,
      }
    });
  } catch (err: any) {
    console.error("[home-planner/plan] Error:", err);

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
      console.error("[home-planner/plan] Failed to track error:", trackError);
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
// // isaacpaha.com — First Home Planner: Generate Plan API
// // app/api/tools/home-planner/plan/route.ts
// //
// // POST { income, savings, expenses, targetPrice, depositPct, timeframeMonths,
// //        propertyType, location, currency }
// //
// // Returns comprehensive home buying readiness plan:
// //   - readinessSnapshot: scores, gap analysis, timeline
// //   - depositPlan: monthly savings target, milestones
// //   - mortgageReadiness: phase-by-phase roadmap
// //   - creditActions: specific credit-building steps
// //   - monthlyActionPlan: 30-day focus items
// //   - ukSchemes: relevant first-time buyer schemes
// //   - scenarioSimulations: "save more / buy cheaper / take longer"
// //   - aiInsights: 4-5 honest personalised observations
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request)
// const TOKEN_COST = 120000000000; // Adjust based on expected response length and model pricing

// export interface PlanRequest {
//   monthlyIncome:    number;
//   currentSavings:   number;
//   monthlyExpenses:  number;
//   existingDebt:     number;       // total existing monthly debt repayments
//   targetPrice:      number;
//   depositPercent:   number;       // 5, 10, or 20
//   timeframeMonths:  number;       // how many months user wants to buy in
//   propertyType:     string;       // "flat" | "house" | "shared_ownership" | "new_build"
//   location?:        string;       // optional: UK city / region
//   currency:         string;       // "GBP" | "USD" | "EUR"
//   creditScore?:     string;       // "excellent" | "good" | "fair" | "poor" | "unknown"
//   isFirstTimeBuyer: boolean;
// }

// function buildPrompt(d: PlanRequest): string {
//   const sym          = d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : "£";
//   const depositAmt   = Math.round(d.targetPrice * (d.depositPercent / 100));
//   const savingsGap   = Math.max(0, depositAmt - d.currentSavings);
//   const monthlySurplus = d.monthlyIncome - d.monthlyExpenses - d.existingDebt;
//   const monthsNeeded = savingsGap > 0 && monthlySurplus > 0
//     ? Math.ceil(savingsGap / monthlySurplus)
//     : 0;

//   return `You are a warm, encouraging, and deeply practical AI home ownership planning coach.

// ⚠️ CRITICAL FRAMING: This is EDUCATIONAL GUIDANCE only — NOT regulated financial or mortgage advice. You are helping someone plan and prepare, not giving advice on which mortgage to take. Frame everything as "typically" or "generally" or "you might want to explore". NEVER say "you should get a mortgage from X" or give specific product recommendations.

// USER'S SITUATION:
// Monthly take-home income: ${sym}${d.monthlyIncome.toLocaleString()}
// Current savings: ${sym}${d.currentSavings.toLocaleString()}
// Monthly expenses (all bills, food, transport, etc.): ${sym}${d.monthlyExpenses.toLocaleString()}
// Existing monthly debt repayments: ${sym}${d.existingDebt.toLocaleString()}
// Monthly surplus (income minus expenses and debt): ${sym}${Math.max(0, monthlySurplus).toLocaleString()}

// PROPERTY GOAL:
// Target property price: ${sym}${d.targetPrice.toLocaleString()}
// Deposit target: ${d.depositPercent}% = ${sym}${depositAmt.toLocaleString()}
// Savings gap to deposit: ${sym}${savingsGap.toLocaleString()}
// Property type: ${d.propertyType}
// ${d.location ? `Location: ${d.location}` : "Location: not specified"}
// First-time buyer: ${d.isFirstTimeBuyer ? "Yes" : "No"}
// Credit score self-assessment: ${d.creditScore ?? "unknown"}

// TIMELINE:
// User's goal timeframe: ${d.timeframeMonths} months
// Months needed at current savings rate: ${monthsNeeded > 0 ? monthsNeeded : "Cannot calculate (insufficient surplus or no gap)"}

// Return ONLY valid JSON (no markdown, no backticks, no explanation):

// {
//   "readinessSnapshot": {
//     "overallReadinessScore": <0-100, honest assessment of how ready they are>,
//     "depositReadinessScore": <0-100, based on savings vs target>,
//     "incomeReadinessScore": <0-100, based on income vs property price — rough 4.5x income multiplier>,
//     "creditReadinessScore": <0-100, based on credit score input and debt levels>,
//     "affordabilityReadinessScore": <0-100, based on monthly surplus vs expected mortgage payment>,
//     "readinessLevel": "<Not Ready Yet|Getting There|Nearly Ready|Ready>",
//     "realisticTimelineMonths": <honest number — when they could realistically be ready>,
//     "realisticTargetDate": "<Month Year — e.g. 'March 2028'>",
//     "isGoalTimelineRealistic": <true|false>,
//     "timelineGapMonths": <how many months over or under their goal timeline — negative = ahead of schedule>,
//     "keyBlocker": "<the single biggest thing holding them back right now>",
//     "biggestStrength": "<the single biggest thing working in their favour>",
//     "estimatedMortgagePayment": <rough monthly mortgage payment estimate based on property price minus deposit at ~5% interest>,
//     "estimatedMortgageSize": <target price minus deposit>,
//     "affordabilityVerdict": "<Comfortably affordable|Manageable|Tight|Stretch|Very difficult>"
//   },

//   "depositPlan": {
//     "depositRequired": ${depositAmt},
//     "alreadySaved": ${d.currentSavings},
//     "savingsGap": ${savingsGap},
//     "requiredMonthlySaving": <monthly saving needed to hit deposit in user's target timeframe>,
//     "realisticMonthlySaving": <realistic monthly saving based on their surplus — honest>,
//     "surplusAfterSaving": <monthly income left after recommended saving>,
//     "projectedDepositDate": "<Month Year at realistic saving rate>",
//     "depositMilestones": [
//       { "milestone": "<e.g. 25% of deposit saved>", "amount": <amount>, "estimatedMonth": <months from now> }
//     ],
//     "savingsTips": [
//       "<specific, actionable saving tip tailored to their situation>"
//     ]
//   },

//   "mortgageReadinessRoadmap": {
//     "phases": [
//       {
//         "phase": <1-4>,
//         "title": "<Phase title — e.g. 'Stabilise Your Finances'>",
//         "duration": "<e.g. 'Months 1-3'>",
//         "focus": "<1-2 sentence description of what this phase is about>",
//         "tasks": [
//           {
//             "task": "<specific, actionable task>",
//             "why": "<one sentence explanation of why this matters for mortgage readiness>",
//             "effort": "<Quick Win|1 Hour|Ongoing>"
//           }
//         ],
//         "milestone": "<what success looks like at the end of this phase>"
//       }
//     ]
//   },

//   "creditBuildingPlan": {
//     "currentAssessment": "<honest 1-2 sentence assessment of their credit readiness based on what they've told us>",
//     "targetCreditScore": "<what they're aiming for and why — in plain language>",
//     "actions": [
//       {
//         "action": "<specific credit action — e.g. 'Register on the electoral roll at your current address'>",
//         "impact": "<High|Medium|Low>",
//         "timeToSeeEffect": "<e.g. '1-3 months'>",
//         "howTo": "<brief, practical how-to>"
//       }
//     ],
//     "thingsToAvoid": [
//       "<specific thing to avoid that would damage mortgage application>"
//     ]
//   },

//   "monthlyActionPlan": {
//     "thisMonth": [
//       {
//         "action": "<specific action to take this month>",
//         "category": "<Savings|Credit|Expenses|Research|Legal>",
//         "effort": "<15 mins|1 hour|Ongoing>"
//       }
//     ],
//     "habitStack": [
//       "<daily or weekly habit that compounds toward home ownership — e.g. 'Every Monday, review last week's spending and move any surplus to your house fund'>"
//     ]
//   },

//   "ukSchemes": [
//     {
//       "scheme": "<scheme name — e.g. 'Lifetime ISA (LISA)'>",
//       "benefit": "<plain-language explanation of the benefit>",
//       "eligibility": "<who qualifies>",
//       "potentialValue": "<rough financial benefit — e.g. 'Up to £1,000/year government bonus'>",
//       "relevanceScore": <0-100, how relevant to this user>,
//       "url": "<gov.uk or official URL — only include if you're confident it's correct>"
//     }
//   ],

//   "scenarioSimulations": [
//     {
//       "scenario": "<e.g. 'Save £200/month more'>",
//       "change": "<what changes in their approach>",
//       "impact": "<specific impact — e.g. 'Reach deposit 8 months earlier'>",
//       "newTimelineMonths": <revised months to ready>,
//       "type": "<Positive|Tradeoff>"
//     }
//   ],

//   "aiInsights": [
//     {
//       "insight": "<specific, personalised observation about their situation>",
//       "type": "<Encouragement|Warning|Opportunity|Reality Check>",
//       "actionable": "<one specific thing they can do about this>"
//     }
//   ],

//   "disclaimerNote": "This plan is for educational guidance and planning purposes only. It is not regulated financial or mortgage advice. For personalised mortgage advice, speak to a qualified independent mortgage adviser (IMA) registered with the Financial Conduct Authority (FCA)."
// }

// RULES:
// - Be warm, honest, and encouraging. This is a life goal. Treat it with respect.
// - Be SPECIFIC to their numbers — don't give generic advice.
// - The deposit milestones should be at meaningful markers (25%, 50%, 75%, 100%).
// - UK schemes: only include Lifetime ISA, Help to Buy ISA (closed but existing holders), First Homes scheme, Shared Ownership, Mortgage Guarantee Scheme. Only those genuinely relevant to their situation.
// - Scenarios: provide 3 — one where they save more, one where they target a cheaper property, one where they extend the timeline.
// - Roadmap: 4 phases — roughly 6-9 months each depending on their timeline.
// - Credit actions: minimum 5, maximum 8. Be UK-specific (electoral roll, etc.).
// - Monthly action plan: 5-7 actions for this month. Specific and achievable.`;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const data: PlanRequest = await req.json();

//     if (!data.monthlyIncome || data.monthlyIncome < 100) {
//       return NextResponse.json({ error: "Monthly income is required" }, { status: 400 });
//     }
//     if (!data.targetPrice || data.targetPrice < 10000) {
//       return NextResponse.json({ error: "Target property price is required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Home Ownership Plan Generator" });
//     console.log(`[home-planner/plan] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[home-planner/plan] Token gate passed for user ${gate.dbUserId} — proceeding with plan generation`);

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 5000,
//       messages:   [{ role: "user", content: buildPrompt(data) }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let plan: any;
//     try { plan = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Plan generation failed — invalid AI response" }, { status: 500 });
//       plan = JSON.parse(match[0]);
//     }

//     // ── ② DEDUCT tokens — only after successful plan generation ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "home-planner/plan", {
//       messageLength: data.monthlyIncome.toString().length + data.targetPrice.toString().length, // rough proxy for complexity
//       propertyType: data.propertyType,
//       location: data.location ?? "unspecified",
//     });
    
//     console.log(`[home-planner/plan] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for plan generation.`);


//     return NextResponse.json({ ok: true, plan });
//   } catch (err: any) {
//     console.error("[home-planner/plan]", err);
//     return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
//   }
// }