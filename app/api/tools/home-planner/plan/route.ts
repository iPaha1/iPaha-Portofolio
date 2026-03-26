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
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface PlanRequest {
  monthlyIncome:    number;
  currentSavings:   number;
  monthlyExpenses:  number;
  existingDebt:     number;       // total existing monthly debt repayments
  targetPrice:      number;
  depositPercent:   number;       // 5, 10, or 20
  timeframeMonths:  number;       // how many months user wants to buy in
  propertyType:     string;       // "flat" | "house" | "shared_ownership" | "new_build"
  location?:        string;       // optional: UK city / region
  currency:         string;       // "GBP" | "USD" | "EUR"
  creditScore?:     string;       // "excellent" | "good" | "fair" | "poor" | "unknown"
  isFirstTimeBuyer: boolean;
}

function buildPrompt(d: PlanRequest): string {
  const sym          = d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : "£";
  const depositAmt   = Math.round(d.targetPrice * (d.depositPercent / 100));
  const savingsGap   = Math.max(0, depositAmt - d.currentSavings);
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

Return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "readinessSnapshot": {
    "overallReadinessScore": <0-100, honest assessment of how ready they are>,
    "depositReadinessScore": <0-100, based on savings vs target>,
    "incomeReadinessScore": <0-100, based on income vs property price — rough 4.5x income multiplier>,
    "creditReadinessScore": <0-100, based on credit score input and debt levels>,
    "affordabilityReadinessScore": <0-100, based on monthly surplus vs expected mortgage payment>,
    "readinessLevel": "<Not Ready Yet|Getting There|Nearly Ready|Ready>",
    "realisticTimelineMonths": <honest number — when they could realistically be ready>,
    "realisticTargetDate": "<Month Year — e.g. 'March 2028'>",
    "isGoalTimelineRealistic": <true|false>,
    "timelineGapMonths": <how many months over or under their goal timeline — negative = ahead of schedule>,
    "keyBlocker": "<the single biggest thing holding them back right now>",
    "biggestStrength": "<the single biggest thing working in their favour>",
    "estimatedMortgagePayment": <rough monthly mortgage payment estimate based on property price minus deposit at ~5% interest>,
    "estimatedMortgageSize": <target price minus deposit>,
    "affordabilityVerdict": "<Comfortably affordable|Manageable|Tight|Stretch|Very difficult>"
  },

  "depositPlan": {
    "depositRequired": ${depositAmt},
    "alreadySaved": ${d.currentSavings},
    "savingsGap": ${savingsGap},
    "requiredMonthlySaving": <monthly saving needed to hit deposit in user's target timeframe>,
    "realisticMonthlySaving": <realistic monthly saving based on their surplus — honest>,
    "surplusAfterSaving": <monthly income left after recommended saving>,
    "projectedDepositDate": "<Month Year at realistic saving rate>",
    "depositMilestones": [
      { "milestone": "<e.g. 25% of deposit saved>", "amount": <amount>, "estimatedMonth": <months from now> }
    ],
    "savingsTips": [
      "<specific, actionable saving tip tailored to their situation>"
    ]
  },

  "mortgageReadinessRoadmap": {
    "phases": [
      {
        "phase": <1-4>,
        "title": "<Phase title — e.g. 'Stabilise Your Finances'>",
        "duration": "<e.g. 'Months 1-3'>",
        "focus": "<1-2 sentence description of what this phase is about>",
        "tasks": [
          {
            "task": "<specific, actionable task>",
            "why": "<one sentence explanation of why this matters for mortgage readiness>",
            "effort": "<Quick Win|1 Hour|Ongoing>"
          }
        ],
        "milestone": "<what success looks like at the end of this phase>"
      }
    ]
  },

  "creditBuildingPlan": {
    "currentAssessment": "<honest 1-2 sentence assessment of their credit readiness based on what they've told us>",
    "targetCreditScore": "<what they're aiming for and why — in plain language>",
    "actions": [
      {
        "action": "<specific credit action — e.g. 'Register on the electoral roll at your current address'>",
        "impact": "<High|Medium|Low>",
        "timeToSeeEffect": "<e.g. '1-3 months'>",
        "howTo": "<brief, practical how-to>"
      }
    ],
    "thingsToAvoid": [
      "<specific thing to avoid that would damage mortgage application>"
    ]
  },

  "monthlyActionPlan": {
    "thisMonth": [
      {
        "action": "<specific action to take this month>",
        "category": "<Savings|Credit|Expenses|Research|Legal>",
        "effort": "<15 mins|1 hour|Ongoing>"
      }
    ],
    "habitStack": [
      "<daily or weekly habit that compounds toward home ownership — e.g. 'Every Monday, review last week's spending and move any surplus to your house fund'>"
    ]
  },

  "ukSchemes": [
    {
      "scheme": "<scheme name — e.g. 'Lifetime ISA (LISA)'>",
      "benefit": "<plain-language explanation of the benefit>",
      "eligibility": "<who qualifies>",
      "potentialValue": "<rough financial benefit — e.g. 'Up to £1,000/year government bonus'>",
      "relevanceScore": <0-100, how relevant to this user>,
      "url": "<gov.uk or official URL — only include if you're confident it's correct>"
    }
  ],

  "scenarioSimulations": [
    {
      "scenario": "<e.g. 'Save £200/month more'>",
      "change": "<what changes in their approach>",
      "impact": "<specific impact — e.g. 'Reach deposit 8 months earlier'>",
      "newTimelineMonths": <revised months to ready>,
      "type": "<Positive|Tradeoff>"
    }
  ],

  "aiInsights": [
    {
      "insight": "<specific, personalised observation about their situation>",
      "type": "<Encouragement|Warning|Opportunity|Reality Check>",
      "actionable": "<one specific thing they can do about this>"
    }
  ],

  "disclaimerNote": "This plan is for educational guidance and planning purposes only. It is not regulated financial or mortgage advice. For personalised mortgage advice, speak to a qualified independent mortgage adviser (IMA) registered with the Financial Conduct Authority (FCA)."
}

RULES:
- Be warm, honest, and encouraging. This is a life goal. Treat it with respect.
- Be SPECIFIC to their numbers — don't give generic advice.
- The deposit milestones should be at meaningful markers (25%, 50%, 75%, 100%).
- UK schemes: only include Lifetime ISA, Help to Buy ISA (closed but existing holders), First Homes scheme, Shared Ownership, Mortgage Guarantee Scheme. Only those genuinely relevant to their situation.
- Scenarios: provide 3 — one where they save more, one where they target a cheaper property, one where they extend the timeline.
- Roadmap: 4 phases — roughly 6-9 months each depending on their timeline.
- Credit actions: minimum 5, maximum 8. Be UK-specific (electoral roll, etc.).
- Monthly action plan: 5-7 actions for this month. Specific and achievable.`;
}

export async function POST(req: NextRequest) {
  try {
    const data: PlanRequest = await req.json();

    if (!data.monthlyIncome || data.monthlyIncome < 100) {
      return NextResponse.json({ error: "Monthly income is required" }, { status: 400 });
    }
    if (!data.targetPrice || data.targetPrice < 10000) {
      return NextResponse.json({ error: "Target property price is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 5000,
      messages:   [{ role: "user", content: buildPrompt(data) }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let plan: any;
    try { plan = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Plan generation failed — invalid AI response" }, { status: 500 });
      plan = JSON.parse(match[0]);
    }

    return NextResponse.json({ ok: true, plan });
  } catch (err: any) {
    console.error("[home-planner/plan]", err);
    return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
  }
}