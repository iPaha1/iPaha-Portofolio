// =============================================================================
// isaacpaha.com — Business Intelligence Engine — Business Plan API
// app/api/tools/business-intelligence/plan/route.ts
//
// Generates a complete, investor-ready business plan + pitch deck brief
// POST { ideaName, description, industry, targetMarket, problemSolved,
//        uniqueAdvantage, stage, businessModel, location, budget,
//        founderBackground, validationSummary, mode }
//
// mode: "full_plan" | "executive_summary" | "go_to_market" |
//       "pitch_deck" | "operations" | "financial_model"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "business-intelligence-engine";
const TOKEN_COST = 200;
const TOOL_NAME  = "Business Plan Generator";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

function cleanJSON(raw: string): any {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim().replace(/,\s*([\]}])/g, "$1");
  const match   = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      ideaName           = "",
      description        = "",
      industry           = "",
      targetMarket       = "",
      problemSolved      = "",
      uniqueAdvantage    = "",
      stage              = "IDEA",
      businessModel      = "OTHER",
      location           = "",
      budget             = "",
      founderBackground  = "",
      validationSummary  = "",  // passed from validation results
      mode               = "full_plan",
    } = body;

    if (!ideaName?.trim()) {
      return NextResponse.json({ error: "Business idea name is required." }, { status: 400 });
    }

    const validModes = ["full_plan", "executive_summary", "go_to_market", "pitch_deck", "operations", "financial_model"];
    const validMode  = validModes.includes(mode) ? mode : "full_plan";

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const ideaBlock = `
BUSINESS: ${ideaName}
Description: ${description}
Industry: ${industry || "Not specified"}
Target market: ${targetMarket || "Not specified"}
Problem solved: ${problemSolved || "Not specified"}
Unique advantage: ${uniqueAdvantage || "Not specified"}
Stage: ${stage} | Model: ${businessModel}
Location: ${location || "Not specified"}
Budget: ${budget || "Not specified"}
Founder: ${founderBackground || "Not specified"}
${validationSummary ? `\nValidation context: ${validationSummary.slice(0, 500)}` : ""}`.trim();

    const systemPrompt = `You are a senior business consultant and startup advisor with 20 years of experience writing business plans for funded startups, scale-ups, and established businesses. You've helped founders raise from pre-seed to Series B and written plans that have secured investment from top VC firms.

You write plans that are investor-ready — specific, data-driven, realistic, and compelling. Every section has real numbers, named competitors, specific strategies, and honest risk assessments. No filler, no generic advice.

${ideaBlock}`;

    let userPrompt = "";

    // ── FULL PLAN ──────────────────────────────────────────────────────
    if (validMode === "full_plan") {
      userPrompt = `Write a complete, investor-ready business plan for this business. Every section must be specific and substantive — no placeholders, no generic statements.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes with \\".

{
  "planTitle": "<Business plan title>",
  "version": "1.0",
  "dateCreated": "<current month and year>",

  "executiveSummary": {
    "missionStatement": "<one powerful sentence — what this business does and why it exists>",
    "businessOverview": "<150-200 word compelling overview — the elevator pitch in prose form>",
    "keyHighlights": ["<key highlight 1 — specific metric or advantage>", "<highlight 2>", "<highlight 3>", "<highlight 4>"],
    "fundingRequired": "<if seeking funding: how much, what for. If bootstrapping: note that>",
    "projectedRevenue": "<Year 1 and Year 3 revenue projections with reasoning>"
  },

  "problemAndSolution": {
    "problemStatement": "<the specific, painful problem — quantify it where possible>",
    "currentAlternatives": "<how people solve this problem today and why those solutions fall short>",
    "ourSolution": "<exactly what we do and how it solves the problem — be specific>",
    "whyNow": "<why is now the right moment for this solution?>",
    "productDescription": "<detailed description of the product/service — what it does, how it works, what makes it different>"
  },

  "marketOpportunity": {
    "totalAddressableMarket": "<TAM with source methodology>",
    "serviceableAddressableMarket": "<SAM>",
    "serviceableObtainableMarket": "<SOM — realistic year 1-2 target>",
    "marketGrowthRate": "<% annual growth with context>",
    "keyMarketDrivers": ["<driver 1>", "<driver 2>", "<driver 3>"],
    "geographicFocus": "<which geographies and in what order>",
    "marketValidation": "<evidence that this market is real and buying — early signals, research, analogous markets>"
  },

  "targetCustomer": {
    "primaryPersona": {
      "name": "<persona name e.g. 'The Overwhelmed Founder'>",
      "demographics": "<age, role, company size, location>",
      "psychographics": "<what drives them, what keeps them up at night>",
      "topPains": ["<pain 1>", "<pain 2>", "<pain 3>"],
      "buyingTriggers": ["<what triggers them to look for a solution>"],
      "budgetAuthority": "<who controls the budget, how decisions are made>",
      "successMetric": "<how they measure success with our product>"
    },
    "secondaryPersona": {
      "name": "<secondary persona>",
      "description": "<brief description>",
      "differences": "<how they differ from primary persona>"
    },
    "customerAcquisitionStrategy": "<specific channels and tactics to reach these customers>"
  },

  "competitiveLandscape": {
    "overview": "<competitive landscape summary>",
    "directCompetitors": [
      {
        "name": "<competitor>",
        "positioning": "<how they position themselves>",
        "revenue": "<estimated revenue>",
        "weakness": "<exploitable weakness>"
      }
    ],
    "ourDifferentiation": "<specific, meaningful differentiation — not just 'better quality'>",
    "sustainableAdvantage": "<the moat we're building and why it's defensible>",
    "competitiveMatrix": [
      { "criteria": "<criteria>", "us": "<our position>", "competitor1": "<competitor 1>" }
    ]
  },

  "businessModel": {
    "modelType": "${businessModel}",
    "revenueStreams": [
      { "name": "<stream>", "description": "<how it works>", "pricingModel": "<pricing>", "projectedMix": "<% of revenue>" }
    ],
    "pricingStrategy": "<detailed pricing rationale with specific price points>",
    "unitEconomics": {
      "cac": "<£X — breakdown by channel>",
      "ltv": "<£X — calculation with assumptions>",
      "ltvCacRatio": "<X:1>",
      "grossMargin": "<%>",
      "paybackPeriod": "<X months>"
    },
    "scalabilityAnalysis": "<how does the business scale — what improves with scale, what doesn't>"
  },

  "goToMarket": {
    "strategy": "<overall GTM strategy — one paragraph>",
    "launchPhases": [
      {
        "phase": "<Phase 1: e.g. 'Beachhead'>",
        "timeframe": "<Month 1-3>",
        "focus": "<what to focus on>",
        "goals": ["<measurable goal 1>", "<goal 2>"],
        "channels": ["<channel 1>", "<channel 2>"],
        "budget": "<£X>"
      }
    ],
    "marketingChannels": [
      { "channel": "<channel>", "strategy": "<specific approach>", "estimatedCAC": "<£X>", "priority": "<HIGH | MEDIUM | LOW>" }
    ],
    "salesStrategy": "<how sales works — inbound/outbound, cycle length, conversion rates>",
    "partnershipOpportunities": ["<potential partnership 1>", "<partnership 2>"],
    "contentStrategy": "<what content/thought leadership to build and why>",
    "networkEffects": "<how to engineer word-of-mouth and viral growth>"
  },

  "operationalPlan": {
    "businessStructure": "<legal structure, incorporation location>",
    "keyTeamRoles": [
      { "role": "<role>", "responsibility": "<key responsibilities>", "hiringTimeline": "<when to hire>", "estimatedSalary": "<£X>" }
    ],
    "technologyStack": "<systems, tools, software needed to operate>",
    "keyMilestones": [
      { "milestone": "<milestone>", "targetDate": "<Month X>", "successMetric": "<how measured>", "dependencies": "<what must happen first>" }
    ],
    "operationalChallenges": ["<operational challenge 1>", "<challenge 2>"],
    "supplyChainAndDelivery": "<how product/service is delivered — key partners, dependencies>"
  },

  "financialPlan": {
    "startupCosts": [
      { "category": "<category>", "items": "<specifics>", "amount": "<£X>", "timing": "<Month X>" }
    ],
    "fundingStrategy": "<how to fund this — bootstrap, angel, VC, grant, revenue-based?>",
    "monthlyProjections": {
      "month1to3": { "revenue": "<£X>", "costs": "<£X>", "cashflow": "<£X>", "keyActivities": "<what's happening>" },
      "month4to6": { "revenue": "<£X>", "costs": "<£X>", "cashflow": "<£X>", "keyActivities": "<what's happening>" },
      "month7to12":{ "revenue": "<£X>", "costs": "<£X>", "cashflow": "<£X>", "keyActivities": "<what's happening>" }
    },
    "annualProjections": [
      { "year": 1, "revenue": "<£X>", "costs": "<£X>", "ebitda": "<£X>", "customers": <integer>, "headcount": <integer> },
      { "year": 2, "revenue": "<£X>", "costs": "<£X>", "ebitda": "<£X>", "customers": <integer>, "headcount": <integer> },
      { "year": 3, "revenue": "<£X>", "costs": "<£X>", "ebitda": "<£X>", "customers": <integer>, "headcount": <integer> }
    ],
    "keyAssumptions": ["<assumption 1 underlying projections>", "<assumption 2>", "<assumption 3>"],
    "breakEvenAnalysis": "<when and at what revenue does the business break even>",
    "scenarioPlanning": {
      "bearCase": "<what happens if growth is 50% of plan>",
      "baseCase": "<the plan as written>",
      "bullCase": "<what if everything goes right>"
    }
  },

  "riskAnalysis": {
    "criticalRisks": [
      { "risk": "<risk>", "probability": "<HIGH | MEDIUM | LOW>", "impact": "<HIGH | MEDIUM | LOW>", "mitigation": "<specific mitigation strategy>" }
    ],
    "regulatoryRisks": "<relevant regulatory considerations>",
    "competitiveRisks": "<what if a well-funded competitor enters?>",
    "marketRisks": "<what if the market doesn't develop as expected?>",
    "executionRisks": "<operational risks — team, technology, delivery>",
    "contingencyPlan": "<what to do if the primary strategy doesn't work>"
  },

  "appendix": {
    "glossary": "<key industry terms if relevant>",
    "researchSources": ["<data source or analogy used>"],
    "nextSteps": ["<immediate next step>", "<step 2>", "<step 3>"]
  }
}`;
    }

    // ── EXECUTIVE SUMMARY ──────────────────────────────────────────────
    else if (validMode === "executive_summary") {
      userPrompt = `Write a compelling, investor-ready executive summary for: "${ideaName}". This will be the first thing investors read. Make every sentence earn its place.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "headline": "<one knockout sentence — the essence of the business>",
  "elevatorPitch": "<60-second verbal pitch — how the founder should introduce this at a networking event>",
  "problemStatement": "<the specific, quantified problem>",
  "solution": "<what the product/service does — specific, not vague>",
  "marketSize": "<TAM/SAM/SOM with methodology>",
  "businessModel": "<how money is made — specific>",
  "traction": "<any early evidence — customers, revenue, waitlist, pilots. Be honest if none yet.>",
  "team": "<why this team can win — specific credentials and relevant experience>",
  "ask": "<what you're asking for — investment amount, or what support you need>",
  "useOfFunds": "<specifically how investment will be used>",
  "exitStrategy": "<realistic exit scenarios>",
  "keyMetrics": [
    { "metric": "<metric>", "current": "<current value>", "target": "<12-month target>" }
  ],
  "whyNow": "<3-4 sentences: why this moment, not 2 years ago or 2 years from now>",
  "whyUs": "<why this team, in this market, with this approach — specific>"
}`;
    }

    // ── GO TO MARKET ───────────────────────────────────────────────────
    else if (validMode === "go_to_market") {
      userPrompt = `Write a detailed, actionable Go-To-Market strategy for: "${ideaName}". Be specific — name channels, tactics, budgets, and timelines.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "gtmOverview": "<overall GTM philosophy and approach for this specific business>",
  "icp": {
    "idealCustomerProfile": "<precise description of the ideal first customer>",
    "buyingSignals": ["<signal that tells you someone is ready to buy>"],
    "whereTheyAre": ["<specific platform, community, or place where ICPs spend time>"],
    "howTheyMakeDecisions": "<decision-making process — who, how long, what they need to say yes>"
  },
  "channels": [
    {
      "channel": "<channel name>",
      "strategy": "<specific approach — not just 'use LinkedIn' but exactly what to do>",
      "content": "<what content/message works on this channel>",
      "budget": "<£X/month>",
      "expectedCAC": "<£X>",
      "timeToSeeResults": "<weeks/months>",
      "priority": "<1 | 2 | 3>",
      "kpis": ["<measurable KPI>"]
    }
  ],
  "launchSequence": [
    { "week": "<Week 1-2>", "actions": ["<specific action>"], "goal": "<what to achieve>" }
  ],
  "firstCustomers": {
    "strategy": "<exact approach to land first 10 customers>",
    "outreachScript": "<word-for-word first outreach message>",
    "objectionHandlers": [
      { "objection": "<likely objection>", "response": "<exact response>" }
    ]
  },
  "contentStrategy": {
    "contentPillars": ["<content topic 1>", "<topic 2>", "<topic 3>"],
    "contentCalendar": "<publishing frequency and format for each channel>",
    "seoStrategy": "<key search terms to target and why>",
    "viralMechanism": "<how to engineer word-of-mouth growth>"
  },
  "partnerships": [
    { "partner": "<partner type or specific company>", "value": "<why they'd partner>", "approach": "<how to approach them>" }
  ],
  "metrics": {
    "northStar": "<the one metric that defines GTM success>",
    "weeklyTracking": ["<metric to track weekly>"],
    "month3Goals": ["<specific goal>"],
    "month6Goals": ["<specific goal>"]
  }
}`;
    }

    // ── PITCH DECK ─────────────────────────────────────────────────────
    else if (validMode === "pitch_deck") {
      userPrompt = `Create a complete pitch deck brief for: "${ideaName}". Structure this as a 12-slide investor pitch deck following best practices.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "deckTitle": "<${ideaName} — Investor Pitch Deck>",
  "targetAudience": "<who is this deck for — seed investors, angels, strategic partners?>",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Cover",
      "headline": "<the killer one-line company description>",
      "keyPoints": ["<what goes on this slide>"],
      "design": "<visual suggestions — what imagery, colour, layout>",
      "speakerNotes": "<what to say while this slide is up>"
    },
    {
      "slideNumber": 2,
      "title": "Problem",
      "headline": "<the problem statement headline>",
      "keyPoints": ["<specific point with data>"],
      "design": "<visual — stat callout, before/after, real quote>",
      "speakerNotes": "<how to make this land emotionally>"
    },
    {
      "slideNumber": 3,
      "title": "Solution",
      "headline": "<solution headline>",
      "keyPoints": ["<point 1>"],
      "design": "<product screenshot mockup, diagram, or demo>",
      "speakerNotes": "<the demo moment — what to show>"
    },
    {
      "slideNumber": 4,
      "title": "Market Size",
      "headline": "<market size headline>",
      "keyPoints": ["TAM: <£X>", "SAM: <£X>", "SOM: <£X>"],
      "design": "<TAM/SAM/SOM concentric circles, growth chart>",
      "speakerNotes": "<how to defend these numbers>"
    },
    {
      "slideNumber": 5,
      "title": "Product / How It Works",
      "headline": "<product headline>",
      "keyPoints": ["<key feature/benefit>"],
      "design": "<product screenshots, workflow diagram, before/after>",
      "speakerNotes": "<walkthrough narrative>"
    },
    {
      "slideNumber": 6,
      "title": "Business Model",
      "headline": "<how we make money>",
      "keyPoints": ["<pricing tier>", "<unit economics>"],
      "design": "<clean pricing table or revenue flow diagram>",
      "speakerNotes": "<walk through unit economics confidently>"
    },
    {
      "slideNumber": 7,
      "title": "Traction / Validation",
      "headline": "<traction headline>",
      "keyPoints": ["<proof point — customer, revenue, metric>"],
      "design": "<growth chart, logos, testimonials>",
      "speakerNotes": "<make every data point feel significant>"
    },
    {
      "slideNumber": 8,
      "title": "Go-To-Market",
      "headline": "<GTM headline>",
      "keyPoints": ["<channel 1>", "<channel 2>"],
      "design": "<funnel diagram, channel mix chart>",
      "speakerNotes": "<why this GTM, not another>"
    },
    {
      "slideNumber": 9,
      "title": "Competition",
      "headline": "<competitive advantage headline>",
      "keyPoints": ["<key differentiator>"],
      "design": "<2x2 matrix or feature comparison table>",
      "speakerNotes": "<own the whitespace confidently>"
    },
    {
      "slideNumber": 10,
      "title": "Team",
      "headline": "<why we're the team to build this>",
      "keyPoints": ["<team member + relevant credential>"],
      "design": "<headshots, logos of previous companies, key credentials>",
      "speakerNotes": "<the team story — why this specific group>"
    },
    {
      "slideNumber": 11,
      "title": "Financial Projections",
      "headline": "<financial headline — the 3-year vision>",
      "keyPoints": ["<Year 1 revenue>", "<Year 3 revenue>", "<break-even point>"],
      "design": "<revenue growth chart, key metrics table>",
      "speakerNotes": "<walk through assumptions honestly>"
    },
    {
      "slideNumber": 12,
      "title": "The Ask",
      "headline": "<the ask>",
      "keyPoints": ["<amount seeking>", "<use of funds>", "<milestones it unlocks>"],
      "design": "<simple, clean — amount, use of funds, milestones>",
      "speakerNotes": "<the close — what happens after this meeting>"
    }
  ],
  "commonInvestorQuestions": [
    { "question": "<likely investor question>", "bestAnswer": "<how to answer this well>" }
  ],
  "pitchTips": ["<tip for this specific pitch>", "<tip 2>", "<tip 3>"],
  "redFlags": ["<thing to avoid saying>", "<red flag 2>"]
}`;
    }

    // ── FINANCIAL MODEL ────────────────────────────────────────────────
    else if (validMode === "financial_model") {
      userPrompt = `Build a detailed financial model for: "${ideaName}". Stage: ${stage}. Budget: ${budget || "TBD"}. Model: ${businessModel}.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "modelAssumptions": {
    "startDate": "<Month Year>",
    "currency": "GBP",
    "pricingModel": "<subscription | one-time | usage-based | hybrid>",
    "avgRevenuePerUser": "<£X/month or £X one-time>",
    "churnRate": "<%/month>",
    "avgContractLength": "<months>",
    "cac": "<£X>",
    "grossMargin": "<%>",
    "headcountGrowth": "<hiring plan assumption>"
  },
  "startupCosts": {
    "total": "<£X>",
    "breakdown": [
      { "item": "<item>", "cost": "<£X>", "type": "<one-time | monthly>", "month": <integer> }
    ]
  },
  "monthlyModel": [
    {
      "month": 1,
      "newCustomers": <integer>,
      "totalCustomers": <integer>,
      "mrr": "<£X>",
      "revenue": "<£X>",
      "cogs": "<£X>",
      "grossProfit": "<£X>",
      "opex": "<£X>",
      "ebitda": "<£X>",
      "cashflow": "<£X>",
      "cumulativeCash": "<£X>",
      "headcount": <integer>
    }
  ],
  "annualSummary": [
    {
      "year": 1,
      "customers": <integer>,
      "arr": "<£X>",
      "revenue": "<£X>",
      "grossProfit": "<£X>",
      "grossMargin": "<%>",
      "opex": "<£X>",
      "ebitda": "<£X>",
      "ebitdaMargin": "<%>",
      "headcount": <integer>,
      "endingCash": "<£X>"
    }
  ],
  "breakEvenAnalysis": {
    "breakEvenMonth": <integer>,
    "breakEvenRevenue": "<£X/month>",
    "breakEvenCustomers": <integer>,
    "cashNeededToBreakEven": "<£X>"
  },
  "keyMetrics": {
    "ltvCac": "<X:1>",
    "paybackPeriod": "<X months>",
    "netRevenueRetention": "<%>",
    "magicNumber": "<sales efficiency ratio>",
    "burnMultiple": "<£ burned per £ ARR added>"
  },
  "scenarioAnalysis": {
    "bear": { "assumption": "<50% of plan>", "year1Revenue": "<£X>", "year3Revenue": "<£X>", "runway": "<months>" },
    "base": { "assumption": "<the plan>",     "year1Revenue": "<£X>", "year3Revenue": "<£X>", "runway": "<months>" },
    "bull": { "assumption": "<150% of plan>", "year1Revenue": "<£X>", "year3Revenue": "<£X>", "runway": "<months>" }
  },
  "fundingRequirements": {
    "totalRequired": "<£X>",
    "bridgeToBreakEven": "<£X if seeking>",
    "seriesAReadiness": "<at what MRR/ARR should they raise Series A>",
    "useOfFunds": [
      { "category": "<category>", "amount": "<£X>", "percentage": "<%>", "rationale": "<why>" }
    ]
  }
}`;
    }

    // ── OPERATIONS mode ────────────────────────────────────────────────
    else if (validMode === "operations") {
      userPrompt = `Write a detailed operational plan for: "${ideaName}". Stage: ${stage}. Founder background: ${founderBackground || "not specified"}.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "operationalOverview": "<how this business will actually run day-to-day>",
  "legalAndCompliance": {
    "recommendedStructure": "<Ltd | LLP | Sole trader | US Corp etc>",
    "incorporationSteps": ["<step 1>", "<step 2>"],
    "keyCompliance": ["<compliance requirement>", "<requirement 2>"],
    "intellectualProperty": "<what IP to protect and how>",
    "regulatoryConsiderations": "<any sector-specific regulation>"
  },
  "teamPlan": {
    "founderRoles": ["<founder role and responsibility>"],
    "hiringRoadmap": [
      { "role": "<role>", "month": <integer>, "salary": "<£X>", "why": "<what gap they fill>", "mustHave": "<non-negotiable requirement>" }
    ],
    "advisors": ["<type of advisor needed and why>"],
    "contractors": ["<what to outsource vs build in-house>"]
  },
  "technologyAndSystems": {
    "coreTechStack": ["<technology>", "<tool>"],
    "businessSystems": ["<CRM>", "<accounting>", "<project management>"],
    "dataSecurity": "<GDPR and data handling approach>",
    "techDebtRisks": ["<risk 1>"]
  },
  "deliveryAndOperations": {
    "serviceDeliveryModel": "<how you deliver the product/service>",
    "qualityControl": "<how you ensure consistent quality>",
    "keySuppliers": ["<supplier type and why critical>"],
    "scalingBottlenecks": ["<what will break first when you scale>"]
  },
  "kpisAndReporting": {
    "northStarMetric": "<the one metric>",
    "weeklyMetrics": ["<weekly KPI>"],
    "monthlyMetrics": ["<monthly KPI>"],
    "operationalDashboard": "<what a weekly team meeting should review>"
  },
  "first90Days": {
    "week1to2": { "priority": "<focus>", "actions": ["<specific action>"], "outcome": "<what's done>" },
    "week3to4": { "priority": "<focus>", "actions": ["<action>"], "outcome": "<outcome>" },
    "month2":   { "priority": "<focus>", "actions": ["<action>"], "outcome": "<outcome>" },
    "month3":   { "priority": "<focus>", "actions": ["<action>"], "outcome": "<outcome>" }
  }
}`;
    }

    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  9000,
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
      catch { result = { error: "Plan generation failed. Please try again." }; }
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "business-intelligence/plan", { mode: validMode, processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, mode: validMode, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[business-intelligence/plan] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Plan generation failed" }, { status: 500 });
  }
}