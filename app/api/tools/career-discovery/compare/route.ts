// =============================================================================
// isaacpaha.com — Career Discovery Engine — Compare API
// app/api/tools/career-discovery/compare/route.ts
//
// POST { careers: string[], skills: string[], experienceLevel: string }
// Returns: side-by-side comparison of up to 3 careers
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug   = "career-discovery-engine";
const TOKEN_COST = 80;
const TOOL_NAME  = "Career Comparison Tool";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = (await req.json()) as {
      careers?: string[];
      skills?: string[];
      experienceLevel?: string;
    };
    const { careers = [], skills = [], experienceLevel = "entry" } = body;

    if (!careers?.length || careers.length < 2) {
      return NextResponse.json({ error: "Select at least 2 careers to compare" }, { status: 400 });
    }
    if (careers.length > 3) {
      return NextResponse.json({ error: "Maximum 3 careers can be compared at once" }, { status: 400 });
    }

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const prompt = `Compare these careers for a ${experienceLevel}-level professional with skills: ${skills.join(", ") || "not specified"}.

Careers to compare: ${careers.join(" vs. ")}

Be specific and data-driven. No fluff.

CRITICAL JSON RULES: Return ONLY valid JSON, no trailing commas.

{
  "comparedCareers": ${JSON.stringify(careers)},
  "overallVerdict": "<2-3 sentences: which is best and for what type of person>",
  "matrix": [
    {
      "dimension": "Starting Salary",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career title>",
      "insight": "<why>"
    },
    {
      "dimension": "Senior Salary",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career title>",
      "insight": "<why>"
    },
    {
      "dimension": "Competition Level",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career with lowest competition>",
      "insight": "<why>"
    },
    {
      "dimension": "Time to First Role",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career title>",
      "insight": "<why>"
    },
    {
      "dimension": "Remote Work",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career title>",
      "insight": "<why>"
    },
    {
      "dimension": "AI Disruption Risk",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<safest career>",
      "insight": "<why>"
    },
    {
      "dimension": "Skill Transferability",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career title>",
      "insight": "<why>"
    },
    {
      "dimension": "Job Satisfaction (avg)",
      "values": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, ""])))},
      "winner": "<career title>",
      "insight": "<why>"
    }
  ],
  "bestFor": ${JSON.stringify(Object.fromEntries(careers.map(c => [c, "<one sentence: ideal candidate profile for this career>"])))},
  "skillOverlap": "<which skills from their profile apply to ALL careers being compared>",
  "switchability": "<how easy it is to switch between these careers later>",
  "myVerdict": "<honest, direct recommendation — which ONE to choose and why>"
}`;

    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  3000,
      temperature: 0.3,
      messages:    [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    let result: any;
    try {
      result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim().replace(/,\s*([\]}])/g, "$1"));
    } catch {
      result = { error: "Comparison parsing failed. Please try again.", matrix: [] };
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "career-discovery/compare", { careers, processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[career-discovery/compare] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Comparison failed" }, { status: 500 });
  }
}