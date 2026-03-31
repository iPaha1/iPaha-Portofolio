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
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// Tool token costs (in tokens per request)
const TOKEN_COST = 150000000000; // Adjust based on expected response length and model pricing

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DebtItem {
  label:       string;   // "Barclays Credit Card", "Student Loan"
  balance:     number;   // current balance owed
  type:        string;   // "CREDIT_CARD" | "PERSONAL_LOAN" | etc.
  apr?:        number;   // annual interest rate % (optional)
  minPayment?: number;   // monthly minimum (optional)
  deadline?:   string;   // ISO date if there's a hard deadline
}

export interface ExpenseItem {
  label:  string;
  amount: number;
}

export interface PlanRequest {
  debts:            DebtItem[];
  monthlyIncome:    number;
  currency:         string;
  fixedExpenses:    ExpenseItem[];
  variableExpenses: ExpenseItem[];
  strategy:         "SNOWBALL" | "AVALANCHE" | "HYBRID";
  targetMonths?:    number;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(data: PlanRequest): string {
  const sym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "€" : "£";
  const totalDebt      = data.debts.reduce((s, d) => s + d.balance, 0);
  const totalFixed     = data.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalVariable  = data.variableExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses  = totalFixed + totalVariable;
  const totalMinimums  = data.debts.reduce((s, d) => s + (d.minPayment ?? 0), 0);
  const surplus        = data.monthlyIncome - totalExpenses;
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

Return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "financialSnapshot": {
    "totalDebt": ${totalDebt},
    "monthlyIncome": ${data.monthlyIncome},
    "totalExpenses": ${totalExpenses},
    "monthlySurplus": ${surplus},
    "totalMinimums": ${totalMinimums},
    "availableForDebt": <surplus minus minimums, or surplus if no minimums>,
    "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "riskExplanation": "<1 sentence honest, non-alarming explanation of their risk level>",
    "estimatedMonthsToDebtFree": <realistic integer>,
    "estimatedPayoffDate": "<Month YYYY>",
    "totalInterestEstimate": <rough estimate of total interest if APRs known, else 0>,
    "monthlySurplusAfterMinimums": <surplus minus minimum payments>,
    "recommendedMonthlyPayment": <what we recommend they put toward debt each month>
  },

  "strategyExplained": "<2-3 sentences explaining why ${data.strategy} is the right approach for their specific situation, referencing their actual debts>",

  "debtOrder": [
    {
      "label": "<debt name>",
      "balance": <amount>,
      "priority": <1-based ranking in payoff order>,
      "reason": "<short reason why this is paid first/last>"
    }
  ],

  "monthlyPlan": [
    {
      "month": 1,
      "label": "<Month YYYY>",
      "totalPayment": <amount to put toward ALL debts this month>,
      "essentials": <amount for essential living>,
      "discretionary": <amount for variable spending>,
      "remainingDebt": <total debt remaining after this month>,
      "milestone": "<optional motivational milestone note — e.g. 'Credit card cleared!' or null>",
      "debtBreakdown": [
        { "label": "<debt name>", "payment": <amount>, "balance": <remaining after payment> }
      ]
    }
  ],

  "weeklyActions": [
    "<specific, realistic weekly action — e.g. 'Set up a £X standing order to your highest-priority debt on payday'>",
    "<practical budgeting tip specific to their expenses>",
    "<a variable expense reduction that's realistic, not punishing>",
    "<positive habit that builds momentum>",
    "<one thing to do this week to gain control>"
  ],

  "insights": [
    "<honest, supportive insight 1 — reference their specific numbers>",
    "<insight 2 — something encouraging based on their data>",
    "<insight 3 — a specific pattern or opportunity in their finances>",
    "<insight 4 — forward-looking: what life looks like on the other side>"
  ],

  "scenarioSimulations": {
    "plus100": {
      "label": "If you paid ${sym}100 extra per month",
      "newEstimatedMonths": <integer>,
      "monthsSaved": <integer>,
      "interestSaved": <estimate>
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
      "interestSaved": <estimate>
    }
  },

  "microGoals": [
    { "goal": "<first achievable milestone — e.g. Pay off first £500>", "targetMonth": <integer>, "celebrationNote": "<how to mark this win>" },
    { "goal": "<clear first debt>",     "targetMonth": <integer>, "celebrationNote": "<brief celebration idea>" },
    { "goal": "<halfway milestone>",    "targetMonth": <integer>, "celebrationNote": "<brief celebration idea>" },
    { "goal": "<final debt cleared>",   "targetMonth": <integer>, "celebrationNote": "<heartfelt congratulations>" }
  ],

  "lifestyleSuggestions": [
    { "category": "<Groceries|Subscriptions|Transport|Energy|Entertainment|Food & Drink>", "suggestion": "<realistic, humane suggestion>", "estimatedSaving": "${sym}<amount>/month" }
  ],

  "disclaimer": "This plan is for guidance and planning purposes only. It does not constitute regulated financial advice. If you are struggling with debt, please consider contacting a free debt charity such as StepChange (UK) or speaking with a qualified financial adviser."
}

Rules:
- monthlyPlan should cover EVERY month until debt-free (max 60 months — if longer, show first 12 and note it)  
- Be REALISTIC: if their surplus is very small, say so kindly — don't magic up money they don't have
- weeklyActions must be specific to their actual expenses (e.g. "Your Netflix/Spotify/etc subscription...")
- NEVER suggest unhealthy food restriction, working dangerous hours, or anything extreme
- insights should feel like advice from a knowledgeable, empathetic friend — not a robot
- Use ${sym} throughout all monetary values`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: PlanRequest = await req.json();

    if (!body.debts?.length || !body.monthlyIncome || body.monthlyIncome <= 0) {
      return NextResponse.json({ error: "At least one debt and monthly income are required" }, { status: 400 });
    }

    if (body.debts.some((d) => d.balance <= 0)) {
      return NextResponse.json({ error: "All debt balances must be greater than zero" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    const gate = await tokenGate(req, TOKEN_COST, { toolName: "Debt Recovery Plan Generator" });
    console.log(`[debt-planner/plan] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[debt-planner/plan] Token gate passed for user ${gate.dbUserId} — proceeding with plan generation`);

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 6000,
      messages:   [{ role: "user", content: buildPrompt(body) }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let plan: any;
    try {
      plan = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Plan generation failed — please try again" }, { status: 500 });
      plan = JSON.parse(match[0]);
    }

    return NextResponse.json({ ok: true, plan });
  } catch (err: any) {
    console.error("[debt-planner/plan]", err);
    return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
  }
}