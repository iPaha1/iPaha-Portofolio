// =============================================================================
// isaacpaha.com — Salary Intelligence Engine — Analyse API
// app/api/tools/salary-intelligence/analyse/route.ts
//
// POST { jobTitle, industry, location, yearsExperience, currentSalary,
//        currency, educationLevel, companySize, skills, remoteSetup,
//        benefits, lastRaiseMonths, mode }
//
// mode: "full" | "quick" | "benchmark" | "career_path" | "job_offer"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";
import { getClaudeCompletion } from "@/lib/ai/anthropic-client";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "salary-intelligence-engine";
const TOKEN_COST = 140;
const TOOL_NAME  = "Salary Intelligence Engine";

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
      jobTitle         = "",
      industry         = "",
      location         = "",
      yearsExperience  = 0,
      currentSalary    = 0,
      currency         = "GBP",
      educationLevel   = "",
      companySize      = "",
      skills           = [],
      remoteSetup      = "",
      benefits         = [],
      lastRaiseMonths  = null,
      mode             = "full",
      offerAmount      = null,   // for job_offer mode
      offerCompany     = "",
    } = body;

    if (!jobTitle?.trim()) {
      return NextResponse.json({ error: "Job title is required." }, { status: 400 });
    }

    const validModes = ["full", "quick", "benchmark", "career_path", "job_offer"];
    const validMode  = validModes.includes(mode) ? mode : "full";

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const currSym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
    const profileBlock = `
PROFILE:
- Job title: ${jobTitle}
- Industry: ${industry || "Not specified"}
- Location: ${location || "Not specified"}
- Years of experience: ${yearsExperience}
- Current salary: ${currSym}${currentSalary.toLocaleString()} per year
- Currency: ${currency}
- Education: ${educationLevel || "Not specified"}
- Company size: ${companySize || "Not specified"}
- Skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "Not specified"}
- Remote setup: ${remoteSetup || "Not specified"}
- Benefits: ${Array.isArray(benefits) ? benefits.join(", ") : benefits || "Not specified"}
- Last raise: ${lastRaiseMonths != null ? `${lastRaiseMonths} months ago` : "Not specified"}
`.trim();

    const systemPrompt = `You are a senior HR consultant, compensation specialist, and career strategist with 20 years of experience across every industry. You have access to comprehensive salary data across the UK, US, and European markets.

You give people the honest truth about their compensation — not what they want to hear. You're direct, specific, and backed by real market knowledge. You help people understand their true market value, identify when they're being exploited, and arm them with the information and confidence to change it.

You always give SPECIFIC salary numbers — not ranges that are so wide they're useless. You know the difference between what companies post and what they actually pay.

CRITICAL: All salary figures must be realistic and grounded. Don't inflate or deflate numbers for emotional effect.`;

    let userPrompt = "";

    // ── FULL mode ──────────────────────────────────────────────────────────
    if (validMode === "full") {
      userPrompt = `${profileBlock}

Give a COMPREHENSIVE salary intelligence report for this person. Be specific, honest, and actionable.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings.

{
  "verdict": "<SIGNIFICANTLY_UNDERPAID | UNDERPAID | FAIRLY_PAID | WELL_PAID | EXCEPTIONALLY_PAID>",
  "verdictLabel": "<human-readable version — e.g. 'You are being underpaid'>",
  "verdictExplained": "<2-3 sentences: honest, direct explanation of the verdict>",

  "salaryData": {
    "currentSalary": ${currentSalary},
    "currency": "${currency}",
    "marketPercentile": <what percentile their current salary sits at — 0-100 integer>,
    "marketFloor":  <10th percentile salary for this role — integer>,
    "marketEntry":  <25th percentile — integer>,
    "marketMedian": <50th percentile / true median — integer>,
    "marketStrong": <75th percentile — integer>,
    "marketTop":    <90th percentile — integer>,
    "gapToMedian":  <currentSalary minus marketMedian — can be negative if underpaid>,
    "gapPercent":   <percentage difference from median — 2 decimal float>,
    "topOfRangeLabel": "<e.g. '£85,000' — the absolute max someone with 10+ years could earn in this role/location>"
  },

  "whyThisSalary": {
    "factorsHolding": ["<specific factor keeping salary lower — e.g. 'Non-technical industry with lower budget for this role'>"],
    "factorsLifting": ["<specific factor increasing value — e.g. 'London premium adds approximately 20-25%'>"],
    "marketContext": "<2-3 sentences: what's happening in this job market right now — demand, supply, industry trends>"
  },

  "salaryByExperience": [
    { "stage": "Entry (0-2 yrs)",    "range": "<e.g. £28,000–£36,000>", "midpoint": <integer> },
    { "stage": "Mid (3-5 yrs)",      "range": "<e.g. £38,000–£52,000>", "midpoint": <integer> },
    { "stage": "Senior (6-9 yrs)",   "range": "<e.g. £55,000–£72,000>", "midpoint": <integer> },
    { "stage": "Lead (10+ yrs)",     "range": "<e.g. £75,000–£95,000>", "midpoint": <integer> },
    { "stage": "Head/Director",      "range": "<e.g. £90,000–£130,000>","midpoint": <integer> }
  ],

  "salaryByCompanyType": [
    { "type": "<e.g. Early-stage startup>",  "range": "<range>", "tradeOff": "<what you give up/gain>" },
    { "type": "<e.g. Scale-up / Series B+>", "range": "<range>", "tradeOff": "<trade-off>" },
    { "type": "<e.g. Large corporate>",      "range": "<range>", "tradeOff": "<trade-off>" },
    { "type": "<e.g. Consultancy / Agency>", "range": "<range>", "tradeOff": "<trade-off>" },
    { "type": "<e.g. Big Tech>",             "range": "<range>", "tradeOff": "<trade-off>" }
  ],

  "locationPremiums": [
    { "location": "<e.g. London>",        "multiplier": "<e.g. +25%>", "absoluteMedian": <integer> },
    { "location": "<e.g. Manchester>",    "multiplier": "<e.g. -8%>",  "absoluteMedian": <integer> },
    { "location": "<e.g. Remote UK>",     "multiplier": "<e.g. -5%>",  "absoluteMedian": <integer> },
    { "location": "<e.g. New York>",      "multiplier": "<e.g. +40%>", "absoluteMedian": <integer> }
  ],

  "benefitsValuation": {
    "totalBenefitsValue": <estimated annual monetary value of all benefits listed — integer>,
    "breakdown": [
      { "benefit": "<benefit name>", "annualValue": <integer>, "note": "<why this value>" }
    ],
    "totalCompensation": <currentSalary plus totalBenefitsValue>,
    "missingBenefits": ["<important benefit they don't have that market standard provides>"]
  },

  "careerMomentum": {
    "status": "<ACCELERATING | ON_TRACK | STALLING | AT_RISK>",
    "explanation": "<2 sentences: honest assessment of their career trajectory based on the data>",
    "redFlags": ["<specific red flag — e.g. 'No raise in 18+ months typically signals you are not being prioritised'>"],
    "greenFlags": ["<positive signal in their profile>"]
  },

  "negotiationReadiness": {
    "shouldNegotiate": <true|false>,
    "riskLevel": "<LOW | MEDIUM | HIGH>",
    "confidenceScore": <0-100 integer>,
    "bestMomentToAsk": "<specific timing advice — e.g. 'After completing the product launch in Q1'>",
    "askAmount": <specific number to ask for — integer>,
    "askRange": "<e.g. '£52,000–£58,000'>",
    "bottomLine": <minimum acceptable — integer>,
    "leveragePoints": ["<specific leverage point they can use — based on their actual profile>"],
    "weaknesses": ["<honest weakness in their negotiating position>"]
  },

  "actionPlan": {
    "immediateActions": [
      { "action": "<specific action>", "timeframe": "This week", "impact": "<HIGH | MEDIUM | LOW>", "detail": "<exactly what to do>" }
    ],
    "shortTermActions": [
      { "action": "<action>", "timeframe": "Next 1–3 months", "impact": "<HIGH | MEDIUM | LOW>", "detail": "<exactly what to do>" }
    ],
    "longTermActions": [
      { "action": "<action>", "timeframe": "3–12 months", "impact": "<HIGH | MEDIUM | LOW>", "detail": "<exactly what to do>" }
    ]
  },

  "skillPremiums": [
    { "skill": "<skill that would add most value>", "premiumPercent": "<e.g. +15%>", "premiumAmount": <integer>, "timeToAcquire": "<e.g. 3 months>" }
  ],

  "jobSearchInsights": {
    "shouldJobSearch": <true|false>,
    "reason": "<why or why not — specific to their situation>",
    "bestPlatforms": ["<platform 1>", "<platform 2>", "<platform 3>"],
    "keywordsToUse": ["<search keyword 1>", "<keyword 2>", "<keyword 3>"],
    "salaryToAskInInterviews": "<specific number to quote in interviews>",
    "expectedOffersRange": "<what offers they should realistically expect>"
  },

  "theHonestTalk": "<3-4 sentences of direct, honest advice — what this person actually needs to hear, not what's polite. Real talk.>"
}`;
    }

    // ── QUICK mode ─────────────────────────────────────────────────────────
    else if (validMode === "quick") {
      userPrompt = `${profileBlock}

Quick salary check — give the core verdict fast.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "verdict": "<SIGNIFICANTLY_UNDERPAID | UNDERPAID | FAIRLY_PAID | WELL_PAID | EXCEPTIONALLY_PAID>",
  "verdictLabel": "<short label>",
  "currentSalary": ${currentSalary},
  "marketMedian": <integer>,
  "gapAmount": <integer — negative if underpaid>,
  "gapPercent": <float>,
  "marketRange": "<e.g. £42,000–£68,000>",
  "oneLiner": "<one punchy sentence summary>",
  "topAction": "<the single most important thing they should do right now>",
  "shouldNegotiate": <true|false>,
  "askAmount": <integer>
}`;
    }

    // ── BENCHMARK mode (role comparison) ──────────────────────────────────
    else if (validMode === "benchmark") {
      userPrompt = `${profileBlock}

Benchmark this role against similar roles in the market. Show what adjacent, related, and alternative roles pay — so this person can see all their options.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "currentRole": {
    "title": "${jobTitle}",
    "medianSalary": <integer>,
    "range": "<range>",
    "demandTrend": "<RISING | STABLE | DECLINING>",
    "competitionLevel": "<LOW | MEDIUM | HIGH>"
  },
  "adjacentRoles": [
    {
      "title": "<related role they could move into>",
      "medianSalary": <integer>,
      "range": "<range>",
      "salaryDelta": "<e.g. +£12,000 vs current>",
      "transitionDifficulty": "<EASY | MODERATE | HARD>",
      "skillsNeeded": ["<skill 1>", "<skill 2>"],
      "whyConsider": "<why this lateral move could be worth it>"
    }
  ],
  "seniorVersions": [
    {
      "title": "<senior/lead/head version of the role>",
      "medianSalary": <integer>,
      "range": "<range>",
      "typicalTimeToReach": "<e.g. 3-4 years from their current level>",
      "keyRequirements": ["<requirement 1>", "<requirement 2>"]
    }
  ],
  "highPayingAlternatives": [
    {
      "title": "<high-paying role they could transition to>",
      "medianSalary": <integer>,
      "range": "<range>",
      "overlap": "<% of their current skills that transfer>",
      "transitionPlan": "<brief transition plan>"
    }
  ],
  "industryComparison": [
    { "industry": "<industry>", "medianSalary": <integer>, "note": "<key difference>" }
  ],
  "insight": "<2-3 sentences: the strategic insight from this benchmark — what should they do with this information?>"
}`;
    }

    // ── CAREER PATH mode ───────────────────────────────────────────────────
    else if (validMode === "career_path") {
      userPrompt = `${profileBlock}

Build a detailed career and earnings progression map for the next 10 years.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "startingPoint": {
    "title": "${jobTitle}",
    "currentSalary": ${currentSalary},
    "assessment": "<honest 1-2 sentence assessment of where they are>"
  },
  "primaryPath": {
    "name": "<e.g. 'Technical Leadership Track'>",
    "description": "<what this path looks like>",
    "milestones": [
      {
        "year": <1|2|3|5|7|10>,
        "title": "<role title at this point>",
        "expectedSalary": <integer>,
        "salaryRange": "<range>",
        "keyAchievements": ["<what they need to have done to reach this>"],
        "criticalSkill": "<the one skill that unlocks this level>"
      }
    ],
    "tenYearPotential": <10-year salary potential — integer>,
    "keyRisk": "<what could derail this path>"
  },
  "alternativePath": {
    "name": "<e.g. 'Independent Consultant Track'>",
    "description": "<what this path looks like>",
    "milestones": [
      {
        "year": <1|2|3|5>,
        "title": "<role/status>",
        "expectedEarnings": <integer>,
        "note": "<key point about this stage>"
      }
    ],
    "tenYearPotential": <integer>,
    "requiredBoldMove": "<the one bold move required to take this path>"
  },
  "salaryAccelerators": [
    { "action": "<specific action>", "potentialUpside": "<e.g. +£15,000>", "timeframe": "<when>", "howTo": "<specific guidance>" }
  ],
  "plateauWarning": {
    "likelyAt": "<at what salary/level this person is likely to plateau if they stay on current path>",
    "howToAvoid": "<specific advice to avoid the plateau>"
  },
  "tenYearEarningsComparison": {
    "currentTrajectory": <total 10-year earnings if they do nothing — integer>,
    "optimisedTrajectory": <total 10-year earnings if they take the advice — integer>,
    "difference": <difference — integer>,
    "insight": "<what this difference represents in real terms>"
  }
}`;
    }

    // ── JOB OFFER mode ─────────────────────────────────────────────────────
    else if (validMode === "job_offer") {
      userPrompt = `${profileBlock}

They have received a job offer:
- Offer amount: ${currSym}${offerAmount?.toLocaleString() ?? "not specified"}
- Offering company: ${offerCompany || "not specified"}

Analyse this offer and tell them exactly what to do.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "offerVerdict": "<EXCEPTIONAL | STRONG | FAIR | WEAK | WALK_AWAY>",
  "offerVerdictLabel": "<human label>",
  "offerAmount": ${offerAmount ?? 0},
  "marketMedian": <integer>,
  "offerVsMarket": "<e.g. '12% above market median for this role/location'>",
  "vsCurrentSalary": "<e.g. '£8,000 increase (18% raise)'>",
  "shouldAccept": <true|false>,
  "shouldNegotiate": <true|false>,
  "acceptAsIs": <true|false>,
  "walkAway": <true|false>,
  "analysis": {
    "strengths": ["<what's good about this offer>"],
    "weaknesses": ["<what's weak or missing>"],
    "redFlags": ["<any concerning aspects of the offer or company>"],
    "hiddenValue": ["<non-salary value that matters — stock options, remote, growth etc>"]
  },
  "counterOffer": {
    "shouldCounter": <true|false>,
    "counterAmount": <integer — what to ask for>,
    "counterRange": "<e.g. £68,000–£72,000>",
    "script": "<exact words to use in the counter-offer conversation>",
    "bestMedium": "<email | phone | in-person and why>",
    "deadline": "<how long to take to respond and why>"
  },
  "benefitsToNegotiate": [
    { "item": "<benefit to ask for>", "value": "<estimated annual value>", "script": "<how to ask>" }
  ],
  "comparisonToCurrentRole": {
    "salaryChange": "<amount and percentage>",
    "careerImpact": "<honest assessment of how this move affects career trajectory>",
    "networkValue": "<how this company/role affects their professional network>",
    "breakEvenPoint": "<if there are costs to switching — how long until they break even>"
  },
  "decisionFramework": "<3-4 sentences: honest, specific advice on what to do. Should they take it, negotiate it, or walk away — and exactly why>"
}`;
    }

    // const message = await anthropic.messages.create({
    //   model:       "claude-sonnet-4-20250514",
    //   max_tokens:  7000,
    //   temperature: 0.3,
    //   system:      systemPrompt,
    //   messages:    [{ role: "user", content: userPrompt }],
    // });

    // const processingMs = Date.now() - start;
    // const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    const { text: raw, stopReason } = await getClaudeCompletion(userPrompt, {
      maxTokens: 7000,
      system: systemPrompt,
    });

    const processingMs = Date.now() - start;
    console.log(`[salary-intelligence/analyse] Raw response length: ${raw.length} chars, stopReason: ${stopReason}`);
    
    let result: any;
    try {
      result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim().replace(/,\s*([\]}])/g, "$1"));
    } catch {
      try { result = cleanJSON(raw); }
      catch { result = { error: "Analysis failed. Please try again.", verdict: "FAIRLY_PAID" }; }
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "salary-intelligence/analyse", { mode: validMode, processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, mode: validMode, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[salary-intelligence/analyse] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Analysis failed" }, { status: 500 });
  }
}