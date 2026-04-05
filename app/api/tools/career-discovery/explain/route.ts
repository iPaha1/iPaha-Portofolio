// =============================================================================
// isaacpaha.com — Career Discovery Engine — Explain / Generate API
// app/api/tools/career-discovery/explain/route.ts
//
// POST { skills, education, goals, experienceLevel, currentRole, salaryTarget, mode }
//   mode: "full" | "deep" | "roadmap" | "coach"
//
// Returns: { ok, result: CareerDiscoveryResult, mode, metadata }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug  = "career-discovery-engine";
const TOKEN_COST = 150;
const TOOL_NAME  = "Career Discovery Engine";

// ─── Tool ID from DB ──────────────────────────────────────────────────────────
let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({
    where:  { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch (err) {
  console.error(`[career-discovery/explain] Failed to load tool ID:`, err);
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────
function cleanAndParseJSON(raw: string): any {
  let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON object found");
  return JSON.parse(match[0]);
}

function fallbackResult(skills: string[]): any {
  return {
    summary: "We couldn't generate your personalised results right now. Please try again.",
    careers: [],
    skillGapOverview: "Please retry.",
    fastestIncomeCareer: null,
    profileStrengths: skills.slice(0, 3),
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      skills         = [],
      education      = "",
      goals          = "",
      experienceLevel= "entry",
      currentRole    = "",
      salaryTarget   = 0,
      mode           = "full",
      coachContext   = "",   // for coach mode: prior conversation
      careerTitle    = "",   // for deep / roadmap modes
    } = body;

    // Validation
    if (!skills?.length && !education?.trim() && !goals?.trim()) {
      return NextResponse.json(
        { error: "Please enter at least your skills, education, or goals." },
        { status: 400 }
      );
    }

    const validModes = ["full", "deep", "roadmap", "coach"];
    const validMode  = validModes.includes(mode) ? mode : "full";

    // ── TOKEN GATE ──────────────────────────────────────────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    // ── BUILD PROMPT ────────────────────────────────────────────────────────

    const profileBlock = `
USER PROFILE:
- Skills: ${Array.isArray(skills) ? skills.join(", ") : skills}
- Education: ${education || "Not specified"}
- Career goals: ${goals || "Not specified"}
- Experience level: ${experienceLevel}
- Current role: ${currentRole || "None / Student"}
- Target salary: ${salaryTarget ? `£${salaryTarget.toLocaleString()}+ per year` : "Open"}
`.trim();

    let systemPrompt = `You are an elite career strategist with deep knowledge of niche, high-paying, low-competition careers across every industry. You specialise in finding the overlooked, underrated, and emerging roles that universities never teach about — the careers paying £50k–£150k+ that most graduates have never heard of.

Your mission: give people an UNFAIR ADVANTAGE in the job market by showing them exactly what others miss.

Tone: Strategic, confident, direct, empowering. Not fluffy. Real advice.`;

    let userPrompt = "";

    // ── FULL mode ──────────────────────────────────────────────────────────
    if (validMode === "full") {
      userPrompt = `${profileBlock}

Find this person 5–7 high-value, LOW-COMPETITION careers that match their profile. Prioritise careers that:
1. Are genuinely overlooked / underrated (not Software Engineer, Marketing Manager, etc.)
2. Have real market demand right now
3. Match at least some of their existing skills
4. Offer clear entry paths without requiring years of retraining
5. Have strong salary growth

CRITICAL JSON RULES:
- Return ONLY a valid JSON object — no preamble, no markdown
- No trailing commas
- All strings must be properly escaped

Return EXACTLY this structure:
{
  "summary": "<2-3 sentence personalised insight about their profile and why these careers suit them>",
  "profileStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "fastestIncomeCareer": "<the single career title they could earn income from soonest>",
  "skillGapOverview": "<honest 1-2 sentence assessment of their main skill gaps and how bridgeable they are>",
  "careers": [
    {
      "id": 1,
      "title": "<specific career title — e.g. SAP Functional Consultant, not just 'IT Consultant'>",
      "industry": "<industry category>",
      "tagline": "<one punchy line — what makes this career interesting>",
      "whyOverlooked": "<2-3 sentences: why graduates don't know about this career — the viral hook>",
      "competitionLevel": "<VERY_LOW | LOW | MEDIUM>",
      "competitionExplained": "<1 sentence why competition is at this level>",
      "salaryEntry": "<e.g. £35,000–£45,000>",
      "salaryMid": "<e.g. £55,000–£75,000>",
      "salarySenior": "<e.g. £85,000–£120,000>",
      "entryTimeframe": "<e.g. 3–6 months | 6–12 months | 12–18 months>",
      "entryTimeframeEnum": "<UNDER_3_MONTHS | THREE_TO_6_MONTHS | SIX_TO_12_MONTHS | ONE_TO_2_YEARS>",
      "skillMatchPct": <0-100 integer based on how many of their skills apply>,
      "skillsTheyAlreadyHave": ["<skill from their profile that applies>"],
      "skillsTheyNeed": ["<specific skill gap 1>", "<specific skill gap 2>"],
      "demandTrend": "<RISING | STABLE | EMERGING>",
      "demandExplained": "<why demand is at this level right now>",
      "certifications": [
        { "name": "<certification name>", "provider": "<provider>", "cost": "<approx cost>", "timeToComplete": "<e.g. 6–8 weeks>", "priority": "<ESSENTIAL | RECOMMENDED | OPTIONAL>" }
      ],
      "entryRoadmap": [
        { "step": 1, "action": "<specific action>", "timeframe": "<e.g. Week 1-2>", "detail": "<exactly what to do and why>", "resources": ["<specific resource, platform, or link type>"] }
      ],
      "whereToFindJobs": ["<specific platform / community / strategy>"],
      "fastestPathToIncome": "<specific route to first paid work — freelance, contract, etc.>",
      "realWorldExample": "<concrete example of someone doing this role and what their day looks like>",
      "whyItPaysWell": "<the economic reason this career is well compensated>",
      "redFlags": ["<honest warning about this career path>"],
      "verdict": "<2-sentence personal recommendation based on their profile>"
    }
  ]
}`;
    }

    // ── DEEP mode (single career deep dive) ────────────────────────────────
    else if (validMode === "deep") {
      userPrompt = `${profileBlock}

Career to deep-dive: "${careerTitle}"

Give a COMPREHENSIVE breakdown of this specific career for this person. Go beyond surface level.

CRITICAL JSON RULES: Return ONLY valid JSON, no trailing commas.

{
  "title": "${careerTitle}",
  "deepDive": "<400-word in-depth overview of the career, the market, the future>",
  "dayInTheLife": "<detailed description of what someone in this role actually does day-to-day>",
  "careerProgression": [
    { "stage": "<e.g. Junior / Associate>", "yearsExp": "<0-2>", "salary": "<range>", "responsibilities": "<key responsibilities>", "nextStep": "<what gets you promoted>" }
  ],
  "topEmployers": [
    { "company": "<company name>", "type": "<consulting firm / tech co / etc>", "hiringVolume": "<high / medium / niche>", "tipToGetIn": "<specific advice>" }
  ],
  "communityAndNetworks": [
    { "name": "<community/forum/LinkedIn group>", "url": "<url or description>", "value": "<why to join>" }
  ],
  "interviewTips": ["<specific tip 1>", "<specific tip 2>", "<specific tip 3>"],
  "salaryNegotiationTip": "<specific advice for negotiating in this field>",
  "remoteWorkPotential": "<HIGH | MEDIUM | LOW>",
  "remoteExplained": "<detail>",
  "aiImpactRisk": "<LOW | MEDIUM | HIGH>",
  "aiImpactExplained": "<how AI affects this career in next 5-10 years>",
  "alternativeTitles": ["<other job titles for the same/similar role>"],
  "adjacentCareers": ["<career you can pivot to from here>"]
}`;
    }

    // ── ROADMAP mode (step-by-step action plan) ─────────────────────────────
    else if (validMode === "roadmap") {
      userPrompt = `${profileBlock}

Career target: "${careerTitle}"

Build a personalised, DETAILED week-by-week action roadmap for this person to break into this career.
Be specific — actual platforms, actual certifications, actual actions. Not generic advice.

CRITICAL JSON RULES: Return ONLY valid JSON, no trailing commas.

{
  "career": "${careerTitle}",
  "totalTimeEstimate": "<e.g. 6–9 months>",
  "quickWin": "<the one thing they can do THIS WEEK to start>",
  "phases": [
    {
      "phase": 1,
      "title": "<phase title e.g. 'Foundation'>",
      "duration": "<e.g. Weeks 1–4>",
      "goal": "<what they achieve by end of this phase>",
      "tasks": [
        {
          "task": "<specific task>",
          "timeRequired": "<e.g. 5 hrs/week>",
          "resource": "<specific course/book/platform/community>",
          "cost": "<free | £X | subscription>",
          "whyThisMatters": "<why this specific task accelerates their entry>"
        }
      ],
      "milestone": "<what does success look like at the end of this phase>"
    }
  ],
  "firstJobStrategy": "<how to land the first role — specific approach for this career>",
  "portfolioAdvice": "<what to build/show to prove competence in this field>",
  "networkingMoves": ["<specific networking action tailored to this career>"],
  "salaryExpectationFirstRole": "<realistic first job salary range>",
  "pitfalls": ["<common mistake people make breaking into this career>"]
}`;
    }

    // ── COACH mode (conversational) ─────────────────────────────────────────
    else if (validMode === "coach") {
      userPrompt = `You are a career coach with deep knowledge of niche, high-paying careers. You know this person's profile:

${profileBlock}

Conversation so far:
${coachContext || "No prior conversation."}

Respond to their latest message. Be direct, specific, and strategic. Give real actionable advice — not platitudes. If they're asking about a specific career, give concrete information. If they're unsure, help them narrow down.

CRITICAL JSON RULES: Return ONLY valid JSON, no trailing commas.

{
  "reply": "<your coaching response — warm but direct, 100-300 words>",
  "actionableNext": "<the one specific action they should take after this conversation>",
  "followUpQuestion": "<optional: a question to help them think deeper — only if genuinely useful>"
}`;
    }

    // ── CALL CLAUDE ─────────────────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  6000,
      temperature: 0.4,
      system:      systemPrompt,
      messages:    [{ role: "user", content: userPrompt }],
    });

    const processingMs = Date.now() - start;
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    let result: any;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      result = JSON.parse(clean.replace(/,\s*([\]}])/g, "$1"));
    } catch {
      try {
        result = cleanAndParseJSON(raw);
      } catch {
        console.error("[career-discovery/explain] JSON parse failed:", raw.slice(0, 500));
        result = fallbackResult(skills);
      }
    }

    // Validate careers array
    if (validMode === "full" && (!result.careers || !Array.isArray(result.careers))) {
      result.careers = [];
    }

    // ── DEDUCT TOKENS ────────────────────────────────────────────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "career-discovery/explain", {
      mode: validMode,
      skillCount: Array.isArray(skills) ? skills.length : 0,
      processingMs,
    });

    // ── TRACK USAGE ──────────────────────────────────────────────────────────
    await trackToolUsage({
      toolId:       TOOL_ID,
      toolName:     TOOL_NAME,
      userId:       gateResult.dbUserId,
      ipAddress:    getIpFromRequest(req),
      processingMs,
      tokenCost:    TOKEN_COST,
      wasSuccess:   true,
    });

    return NextResponse.json({
      ok:   true,
      result,
      mode: validMode,
      metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST, mode: validMode },
    });

  } catch (err: any) {
    console.error("[career-discovery/explain] Error:", err);
    try {
      await trackToolUsage({
        toolId:      TOOL_ID,
        toolName:    TOOL_NAME,
        ipAddress:   getIpFromRequest(req),
        processingMs: Date.now() - start,
        wasSuccess:  false,
        errorMsg:    err.message,
      });
    } catch {}
    return NextResponse.json(
      { error: err.message ?? "Career discovery failed" },
      { status: 500 }
    );
  }
}