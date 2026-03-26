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
// Returns comprehensive JSON survival plan:
//   - snapshot:        key numbers (daily budget, risk, days viable)
//   - categoryPlan:    daily & weekly allocation per category
//   - weeklyPlan:      week-by-week breakdown
//   - cutSuggestions:  specific places to reduce spending
//   - survivalTips:    practical, humane guidance (not lectures)
//   - scenarios:       "what if I cut £X" simulations
//   - emergencyPlan:   bare-minimum survival version
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface ExpenseItem {
  id:       string;
  label:    string;
  amount:   number;
  category: string;
}

export interface BudgetPlanRequest {
  totalBudget:       number;
  currency:          string;   // "GBP" | "USD" | "EUR"
  timeframeDays:     number;   // e.g. 30
  fixedExpenses:     ExpenseItem[];
  flexibleExpenses:  ExpenseItem[];
}

function buildPrompt(data: BudgetPlanRequest): string {
  const sym             = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const totalFixed      = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalFlexible   = data.flexibleExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses   = totalFixed + totalFlexible;
  const remaining       = data.totalBudget - totalFixed;
  const dailyTotal      = data.totalBudget / data.timeframeDays;
  const dailyFixed      = totalFixed / data.timeframeDays;
  const dailyFlexible   = remaining / data.timeframeDays;
  const daysViable      = remaining > 0 ? Math.floor(remaining / (totalFlexible / data.timeframeDays)) : 0;
  const weeksCount      = Math.ceil(data.timeframeDays / 7);

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

Return ONLY valid JSON (no markdown, no backticks):

{
  "snapshot": {
    "totalBudget": ${data.totalBudget},
    "timeframeDays": ${data.timeframeDays},
    "totalFixed": ${totalFixed},
    "totalFlexible": ${totalFlexible},
    "remaining": ${remaining},
    "dailyBudgetTotal": <number, 2 decimal places>,
    "dailyBudgetFlexible": <number, 2 decimal places>,
    "weeklyBudget": <number>,
    "riskLevel": "${riskLevel}",
    "riskLabel": "<Safe|Tight|Unsustainable>",
    "riskColour": "<#10b981|#f59e0b|#ef4444>",
    "daysViable": ${daysViable > data.timeframeDays ? data.timeframeDays : daysViable},
    "headline": "<one punchy, honest, non-judgmental headline — e.g. 'You have £8.20/day to work with — here's how to make it count'>",
    "summary": "<2-3 honest, warm sentences summarising the situation and the key thing they need to do>",
    "survivalVerdict": "<Can survive|Tight but possible|Very tight|Unsustainable — needs cuts>"
  },

  "categoryPlan": [
    {
      "category": "<e.g. Food, Transport, Bills, Entertainment, Miscellaneous>",
      "dailyAllocation": <number>,
      "weeklyAllocation": <number>,
      "totalAllocation": <number>,
      "type": "<fixed|flexible>",
      "tips": "<1-2 specific, practical tips for this category — budget-friendly, realistic>",
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
      "focus": "<one specific focus or watchout for this week>",
      "milestone": "<optional milestone — e.g. 'Halfway point — check remaining balance'>"
    }
  ],

  "cutSuggestions": [
    {
      "category": "<category name>",
      "currentAmount": <number>,
      "suggestedAmount": <number>,
      "saving": <number>,
      "dailyImpact": <number, how much extra per day this unlocks>,
      "suggestion": "<specific, practical suggestion — not generic. e.g. 'Swap branded groceries for own-brand and meal-prep Sundays — saves ~£3/day'>",
      "difficulty": "<Easy|Medium|Requires planning>"
    }
  ],

  "survivalTips": [
    {
      "tip": "<specific, actionable, warm tip — budget-friendly meal ideas, transport hacks, subscription cancels, etc.>",
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
      "impact": "<specific impact — e.g. 'Adds £1.60/day and extends your runway by 5 days'>",
      "howTo": "<specific suggestion for where to find this saving>"
    },
    {
      "name": "If you earn ${sym}200 extra",
      "change": 200,
      "changeType": "income_increase",
      "newDailyFlexible": <number>,
      "newDaysViable": <number>,
      "impact": "<specific impact>",
      "howTo": "Sell unused items, freelance work, or one extra shift"
    },
    {
      "name": "Emergency Mode (bare minimum)",
      "change": 0,
      "changeType": "emergency",
      "newDailyFlexible": <number — essentials only>,
      "newDaysViable": ${data.timeframeDays},
      "impact": "<how long they can survive on bare essentials only>",
      "howTo": "<what bare minimum looks like — keep it specific and realistic>"
    }
  ],

  "emergencyPlan": {
    "dailyLimit": <number — absolute minimum>,
    "description": "<2-3 sentences: what this looks like in practice, what to cut entirely>",
    "essentials": ["<essential 1>", "<essential 2>", "<essential 3>"],
    "cutEntirely": ["<thing to stop entirely 1>", "<thing to stop entirely 2>"]
  },

  "motivation": "<1-2 warm, genuine, specific sentences — acknowledge the difficulty, reference their actual numbers, end with a practical thought. Do NOT say generic things like 'You've got this!'>",

  "shareCard": {
    "headline": "<short, shareable, relatable headline — e.g. 'Surviving 30 days on £400. Day 1.' or 'My daily budget is £6.20. Let's see how this goes.'> ",
    "stats": "<2-3 key numbers formatted for sharing>"
  }
}

RULES:
- All monetary values must be numbers, not strings.
- categoryPlan must include ALL categories from both fixed AND flexible expenses, plus any you identify.
- cutSuggestions: only suggest cuts to flexible/variable spending — never suggest cutting rent or essential bills.
- survivalTips: must be SPECIFIC (e.g. "make porridge for breakfast at ~25p/serving" not "eat cheaply").
- Be honest about how tight the situation is — but always frame it as "here's what you can do" not "you're in trouble".
- If remaining <= 0 (can't cover fixed costs), acknowledge this clearly but gently and focus on what needs to happen.
- weeklyPlan must have exactly ${weeksCount} weeks.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: BudgetPlanRequest = await req.json();

    if (!body.totalBudget || body.totalBudget <= 0) {
      return NextResponse.json({ error: "Total budget is required" }, { status: 400 });
    }
    if (!body.timeframeDays || body.timeframeDays < 1) {
      return NextResponse.json({ error: "Timeframe must be at least 1 day" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages:   [{ role: "user", content: buildPrompt(body) }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let plan: any;
    try { plan = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Plan generation failed — invalid response" }, { status: 500 });
      plan = JSON.parse(match[0]);
    }

    return NextResponse.json({ ok: true, plan });
  } catch (err: any) {
    console.error("[budget-planner/plan]", err);
    return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
  }
}