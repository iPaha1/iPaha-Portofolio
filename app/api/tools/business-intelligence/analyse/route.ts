// =============================================================================
// isaacpaha.com — Business Intelligence Engine — Analyse API
// app/api/tools/business-intelligence/analyse/route.ts
//
// POST { ideaName, description, industry, targetMarket, problemSolved,
//        uniqueAdvantage, stage, businessModel, location, budget,
//        founderBackground, mode }
//
// mode: "validate" | "quick" | "market" | "competition" | "revenue"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "business-intelligence-engine";
const TOKEN_COST = 160;
const TOOL_NAME  = "Business Intelligence Engine";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

function cleanJSON(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    .replace(/,\s*([\]}])/g, "$1");
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      ideaName          = "",
      description       = "",
      industry          = "",
      targetMarket      = "",
      problemSolved     = "",
      uniqueAdvantage   = "",
      stage             = "IDEA",
      businessModel     = "OTHER",
      location          = "",
      budget            = "",
      founderBackground = "",
      mode              = "validate",
    } = body;

    if (!ideaName?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Business idea name and description are required." }, { status: 400 });
    }

    const validModes = ["validate", "quick", "market", "competition", "revenue"];
    const validMode  = validModes.includes(mode) ? mode : "validate";

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const ideaBlock = `
BUSINESS IDEA:
- Name: ${ideaName}
- Description: ${description}
- Industry: ${industry || "Not specified"}
- Target market: ${targetMarket || "Not specified"}
- Problem being solved: ${problemSolved || "Not specified"}
- Unique advantage: ${uniqueAdvantage || "Not specified"}
- Current stage: ${stage}
- Business model: ${businessModel}
- Location/market: ${location || "Not specified"}
- Available budget: ${budget || "Not specified"}
- Founder background: ${founderBackground || "Not specified"}
`.trim();

    const systemPrompt = `You are a world-class startup advisor, investor, and business strategist. You've evaluated thousands of business ideas across every industry, advised founders at every stage from pre-seed to IPO, and made investment decisions at top-tier venture firms.

You give honest, direct, data-backed assessments. When an idea is fundamentally flawed, you say so clearly — and explain exactly why and how to fix it. When an idea is genuinely strong, you identify what makes it special and how to amplify that.

You don't give empty encouragement. You give founders the same assessment you'd give if you were about to invest your own money.

${ideaBlock}`;

    let userPrompt = "";

    // ── VALIDATE (full validation) ─────────────────────────────────────
    if (validMode === "validate") {
      userPrompt = `Give a comprehensive business idea validation for this concept. Be specific, honest, and actionable. Reference real market dynamics, competitors, and examples.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings with \\".

{
  "verdict": "<STRONG_BUY | BUY | HOLD | NEEDS_WORK | PIVOT_REQUIRED>",
  "verdictLabel": "<human label — e.g. 'Strong Opportunity'>",
  "overallScore": <0-100 integer>,
  "executiveSummary": "<3-4 sentences: the honest, direct verdict on this idea — what it is, what's genuinely strong, and what's the critical risk>",
  "theBigQuestion": "<the single most important question this founder needs to answer to know if this will work>",

  "scorecards": {
    "problemStrength":     { "score": <0-20>, "verdict": "<string>", "detail": "<specific assessment>" },
    "marketOpportunity":   { "score": <0-20>, "verdict": "<string>", "detail": "<specific assessment with market size estimate>" },
    "competitiveLandscape":{ "score": <0-20>, "verdict": "<string>", "detail": "<who are the real competitors, how hard is it to win>" },
    "founderFit":          { "score": <0-20>, "verdict": "<string>", "detail": "<does this founder have what it takes for this specific idea>" },
    "executionDifficulty": { "score": <0-20>, "verdict": "<string>", "detail": "<how hard is this to actually build and launch>" }
  },

  "marketAnalysis": {
    "tam": "<Total Addressable Market — specific estimate with reasoning e.g. '£4.2B UK fitness market'>",
    "sam": "<Serviceable Addressable Market — your realistic slice>",
    "som": "<Serviceable Obtainable Market — year 1-2 realistic target>",
    "growthTrend": "<GROWING | STABLE | DECLINING | EMERGING>",
    "growthExplained": "<why is this market growing/declining — with specific drivers>",
    "marketTiming": "<is now the right time for this? too early? too late? perfect moment? why?>",
    "tailwinds": ["<specific market tailwind — trend/technology/regulation that helps>", "<tailwind 2>"],
    "headwinds": ["<specific market headwind that works against this>", "<headwind 2>"]
  },

  "competitiveAnalysis": {
    "directCompetitors": [
      { "name": "<real competitor name>", "strength": "<what makes them strong>", "weakness": "<exploitable gap>", "threat": "<HIGH | MEDIUM | LOW>" }
    ],
    "indirectCompetitors": ["<indirect competitor or substitute>", "<substitute 2>"],
    "whitespace": "<the genuine gap in the market this can own — be specific>",
    "moatPotential": "<what defensible advantage can this build over time — or why it can't>",
    "entryBarriers": ["<barrier to entry that protects incumbents>", "<barrier 2>"]
  },

  "businessModelAnalysis": {
    "selectedModel": "${businessModel}",
    "modelFit": "<is this the right model for this idea and market? if not, what should it be?>",
    "revenueStreams": [
      { "stream": "<revenue stream>", "potential": "<HIGH | MEDIUM | LOW>", "reasoning": "<why>" }
    ],
    "unitEconomics": {
      "estimatedCAC": "<Customer Acquisition Cost estimate — be specific>",
      "estimatedLTV": "<Lifetime Value estimate>",
      "ltvCacRatio": "<LTV:CAC ratio — and whether this is viable>",
      "paybackPeriod": "<how long to recover CAC>"
    },
    "pricingStrategy": "<recommended pricing approach with specific price points>",
    "grossMarginExpectation": "<realistic gross margin % for this model and industry>"
  },

  "strengthsAndRisks": {
    "genuineStrengths": [
      { "strength": "<specific strength>", "why": "<why this is a real advantage, not wishful thinking>" }
    ],
    "criticalRisks": [
      { "risk": "<specific risk>", "severity": "<HIGH | MEDIUM | LOW>", "mitigation": "<how to address it>" }
    ],
    "killerRisks": ["<the one thing that could kill this entirely — be blunt>"],
    "hiddenOpportunities": ["<opportunity the founder may not have considered>", "<opportunity 2>"]
  },

  "validationPlan": {
    "assumptions": [
      { "assumption": "<core assumption that must be true>", "testMethod": "<specific way to validate this in 2-4 weeks>", "successCriteria": "<what proves it's true>" }
    ],
    "mvpConcept": "<what the leanest possible MVP looks like — specific, buildable>",
    "firstCustomerStrategy": "<exactly how to get the first 10 paying customers>",
    "timeline90Days": "<realistic 90-day plan broken into phases>",
    "budgetToValidate": "<minimum budget needed to reach meaningful validation>"
  },

  "theHonestTalk": "<4-5 sentences of direct, unvarnished advice — what this founder actually needs to hear. What are they probably getting wrong? What should they do tomorrow morning?>",

  "pivotSuggestions": [
    { "pivot": "<adjacent pivot if main idea has issues>", "rationale": "<why this variation might work better>" }
  ]
}`;
    }

    // ── QUICK mode ─────────────────────────────────────────────────────
    else if (validMode === "quick") {
      userPrompt = `Quick validation of: "${ideaName}" — ${description.slice(0, 300)}

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "verdict": "<STRONG_BUY | BUY | HOLD | NEEDS_WORK | PIVOT_REQUIRED>",
  "verdictLabel": "<label>",
  "overallScore": <0-100>,
  "oneLiner": "<single sentence honest verdict>",
  "biggestStrength": "<the one genuine strength>",
  "biggestRisk": "<the one critical risk>",
  "tam": "<market size estimate>",
  "topCompetitor": "<main competitor to worry about>",
  "firstAction": "<the single most important thing to do this week>",
  "shouldPursue": <true|false>
}`;
    }

    // ── MARKET mode ─────────────────────────────────────────────────────
    else if (validMode === "market") {
      userPrompt = `Deep market analysis for: "${ideaName}" in ${industry || "this industry"}.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "marketOverview": "<comprehensive overview of this market — size, maturity, key dynamics>",
  "tam": "<Total Addressable Market with methodology>",
  "sam": "<Serviceable Addressable Market>",
  "som": "<Year 1-2 Obtainable Market>",
  "marketSegments": [
    { "segment": "<segment name>", "size": "<size estimate>", "accessibility": "<how easy to reach>", "attractiveness": "<HIGH | MEDIUM | LOW>" }
  ],
  "customerPersonas": [
    {
      "name": "<persona name>",
      "description": "<who they are>",
      "painPoints": ["<pain 1>", "<pain 2>"],
      "willingnessToPay": "<£X–Y per month/year>",
      "whereFindThem": ["<channel 1>", "<channel 2>"]
    }
  ],
  "marketTrends": [
    { "trend": "<trend name>", "impact": "<how it helps or hurts>", "timeframe": "<when>" }
  ],
  "regulatoryLandscape": "<relevant regulations, compliance requirements, or regulatory risks>",
  "geographicExpansion": "<best geographic expansion sequence — start where, go where next>",
  "marketInsight": "<the non-obvious market insight that creates the real opportunity here>"
}`;
    }

    // ── COMPETITION mode ────────────────────────────────────────────────
    else if (validMode === "competition") {
      userPrompt = `Competitive intelligence report for: "${ideaName}".
Target market: ${targetMarket || "general market"}. Unique angle: ${uniqueAdvantage || "not specified"}.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "competitiveLandscapeOverview": "<how competitive is this space and what determines who wins>",
  "directCompetitors": [
    {
      "name": "<competitor name>",
      "url": "<website if known>",
      "description": "<what they do>",
      "estimatedRevenue": "<revenue estimate>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "weaknesses": ["<weakness 1>", "<weakness 2>"],
      "customerComplaints": ["<common complaint found in reviews>"],
      "howToWinAgainstThem": "<specific strategy to take their customers>"
    }
  ],
  "indirectCompetitors": [
    { "name": "<indirect competitor or substitute>", "whyCompetes": "<why it's a substitute>", "gap": "<gap it leaves>" }
  ],
  "competitivePositioning": {
    "currentWhitespace": "<the genuine gap no one is filling well>",
    "positioningRecommendation": "<where to position — the specific niche to own first>",
    "differentiationStrategy": "<the specific way to be meaningfully different, not just better>"
  },
  "moatStrategy": {
    "shortTermMoat": "<defensible advantage buildable in 0-12 months>",
    "longTermMoat": "<the durable competitive advantage to build toward>",
    "networkEffects": "<does this have network effects? how to engineer them?>",
    "switchingCosts": "<how to create switching costs once customers are in>"
  },
  "competitiveMatrix": [
    { "factor": "<key competitive factor>", "us": "<how we compare>", "bestCompetitor": "<how best competitor compares>" }
  ],
  "strategicAdvice": "<the single most important competitive insight — what most founders in this space get wrong>"
}`;
    }

    // ── REVENUE mode ────────────────────────────────────────────────────
    else if (validMode === "revenue") {
      userPrompt = `Revenue model and financial analysis for: "${ideaName}".
Business model: ${businessModel}. Budget: ${budget || "not specified"}. Stage: ${stage}.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "recommendedPricingModel": "<the specific pricing model and why>",
  "pricingTiers": [
    { "tier": "<tier name>", "price": "<£X/month or £X one-time>", "whatIncluded": "<what's in this tier>", "targetCustomer": "<who buys this>" }
  ],
  "revenueStreams": [
    { "stream": "<revenue stream>", "description": "<how it works>", "year1Potential": "<£X–Y>", "priority": "<PRIMARY | SECONDARY | FUTURE>" }
  ],
  "unitEconomics": {
    "cac": "<Customer Acquisition Cost estimate and breakdown by channel>",
    "ltv": "<Lifetime Value calculation with assumptions>",
    "ltvCacRatio": "<ratio and whether it's viable>",
    "paybackPeriod": "<months to recover CAC>",
    "churnRateEstimate": "<expected monthly churn %>",
    "grossMargin": "<expected gross margin % with reasoning>"
  },
  "financialProjections": {
    "year1": {
      "customers": <integer>,
      "mrr": "<Monthly Recurring Revenue by end of year>",
      "arr": "<Annual Recurring Revenue>",
      "revenue": "<total revenue>",
      "costs": "<estimated total costs>",
      "burnRate": "<monthly burn>",
      "breakEvenMonth": "<when do they break even?>"
    },
    "year2": { "customers": <integer>, "arr": "<>", "revenue": "<>", "profitMargin": "<>" },
    "year3": { "customers": <integer>, "arr": "<>", "revenue": "<>", "profitMargin": "<>" }
  },
  "startupCosts": [
    { "item": "<cost item>", "amount": "<£X>", "oneTimeOrMonthly": "<one-time | monthly>", "critical": <true|false> }
  ],
  "fundingStrategy": {
    "bootstrapViable": <true|false>,
    "bootstrapPath": "<how to build this with minimal capital>",
    "fundraisingCase": "<if seeking investment — what story to tell, how much to raise, what to achieve with it>",
    "exitPotential": "<realistic exit scenarios — acqui-hire, acquisition, IPO — and by whom>"
  },
  "revenueRisks": ["<risk 1 to revenue model>", "<risk 2>"],
  "revenueInsight": "<the non-obvious financial insight about this model that most founders miss>"
}`;
    }

    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  8000,
      temperature: 0.35,
      system:      systemPrompt,
      messages:    [{ role: "user", content: userPrompt }],
    });

    const processingMs = Date.now() - start;
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    let result: any;
    try {
      result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim().replace(/,\s*([\]}])/g, "$1"));
    } catch {
      try { result = cleanJSON(raw); }
      catch { result = { error: "Analysis failed. Please try again.", overallScore: 50, verdict: "HOLD" }; }
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "business-intelligence/analyse", { mode: validMode, processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, mode: validMode, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[business-intelligence/analyse] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Analysis failed" }, { status: 500 });
  }
}