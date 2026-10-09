// =============================================================================
// isaacpaha.com — Salary Intelligence Engine — Negotiation Script API
// app/api/tools/salary-intelligence/negotiate/route.ts
//
// POST { askingFor, currentSalary, targetSalary, context, situation,
//        managerStyle, companyContext, fears }
//
// Returns word-for-word negotiation scripts for different scenarios
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
const TOKEN_COST = 120;
const TOOL_NAME  = "Salary Negotiation Script Writer";

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
      askingFor      = "",
      currentSalary  = 0,
      targetSalary   = 0,
      context        = "",    // e.g. "annual review", "job offer", "promotion"
      situation      = "",    // more detail about their situation
      managerStyle   = "",    // e.g. "direct", "data-driven", "people-pleaser"
      companyContext  = "",   // e.g. "company doing well", "recent layoffs"
      fears          = [],    // their specific fears about negotiating
      currency       = "GBP",
      jobTitle       = "",
    } = body;

    if (!askingFor?.trim() && !targetSalary) {
      return NextResponse.json({ error: "Please specify what you are negotiating for." }, { status: 400 });
    }

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const currSym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";

    const systemPrompt = `You are a master negotiation coach who has helped thousands of professionals secure raises, promotions, and better job offers. You understand the psychology of salary negotiations deeply.

You write scripts that sound HUMAN — not corporate, not aggressive, not grovelling. Natural conversation that professional people would actually say. You teach people to negotiate from a position of confidence and value, not desperation.

You prepare people for every scenario — what to say, what NOT to say, how to handle pushback, and how to close.`;

    const userPrompt = `Write a complete negotiation preparation package for:

WHAT THEY'RE ASKING FOR: ${askingFor}
CONTEXT: ${context} (${situation})
JOB TITLE: ${jobTitle || "Not specified"}
CURRENT SALARY: ${currSym}${currentSalary.toLocaleString()}
TARGET SALARY: ${currSym}${targetSalary.toLocaleString()}
MANAGER STYLE: ${managerStyle || "Unknown"}
COMPANY CONTEXT: ${companyContext || "Normal/not specified"}
THEIR FEARS: ${Array.isArray(fears) ? fears.join(", ") : fears || "Not specified"}
CURRENCY: ${currency}

Write scripts that sound like a real, confident human — not a robot. Natural language. Specific to their situation.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings.

{
  "situationAssessment": {
    "strength": "<STRONG | MODERATE | NEEDS_WORK>",
    "keyLeverage": "<their single strongest leverage point>",
    "mainRisk": "<the biggest risk in this negotiation>",
    "confidenceScore": <0-100>,
    "riskLevel": "<LOW | MEDIUM | HIGH>"
  },

  "preparation": {
    "doBeforehand": ["<specific preparation task 1>", "<task 2>", "<task 3>"],
    "dataToGather": ["<specific data point to research>", "<data 2>"],
    "mindsetAdvice": "<the mental framing they need going in — 1-2 sentences>",
    "bestTiming": "<exactly when and how to initiate — day, time, method>",
    "settingAdvice": "<where and how to have this conversation>"
  },

  "scripts": {
    "openingLine": "<the exact first thing to say — natural, confident, not aggressive>",
    
    "openingScript": "<the full opening — 3-5 sentences. How to start the conversation and make the ask clearly. Word for word.>",

    "valueStatement": "<how to articulate their value and justify the ask — 2-3 sentences. Specific to their situation.>",

    "theAsk": "<the exact moment they name the number — word for word. Clear, direct, then silence.>",

    "emailVersion": "<a complete email to send if they prefer written — subject line included, full email body, professional but human>",

    "followUpEmail": "<email to send after the conversation to confirm what was discussed>"
  },

  "objectionHandlers": [
    {
      "objection": "<common pushback — e.g. 'Budget is tight right now'>",
      "response": "<exact word-for-word response>",
      "bodyLanguage": "<physical/tone guidance during this response>"
    },
    {
      "objection": "<e.g. 'You're already at the top of your band'>",
      "response": "<exact response>",
      "bodyLanguage": "<guidance>"
    },
    {
      "objection": "<e.g. 'Let me think about it / come back to you'>",
      "response": "<exact response — how to avoid getting ghosted>",
      "bodyLanguage": "<guidance>"
    },
    {
      "objection": "<e.g. 'We can't match that number'>",
      "response": "<response — how to pivot to total comp or other asks>",
      "bodyLanguage": "<guidance>"
    },
    {
      "objection": "<their specific fear if stated>",
      "response": "<directly addressing their stated fear>",
      "bodyLanguage": "<guidance>"
    }
  ],

  "alternativeAsks": [
    { "ask": "<if salary not possible, ask for X instead>", "value": "<approximate annual value>", "script": "<how to pivot and ask for this>" }
  ],

  "closingMoves": {
    "ifTheyYes": "<exactly what to say when they agree — how to lock it in>",
    "ifTheyNo": "<exactly what to say if they say no outright — how to recover and set up future success>",
    "ifTheyMaybe": "<how to handle 'let me think about it' without losing momentum>",
    "walkAwayLine": "<the dignified exit line if the offer is unacceptable>"
  },

  "psychologyNotes": {
    "silenceRule": "<when and why to use silence — this is critical>",
    "anchoringTip": "<how to use anchoring in their favour>",
    "emotionManagement": "<how to stay calm and authoritative when nervous>",
    "whatNOTToSay": ["<specific phrase to never say>", "<phrase 2>", "<phrase 3>"]
  },

  "afterTheConversation": {
    "winScenario": "<exactly what to do if they get what they asked for>",
    "partialWinScenario": "<what to do if they get a smaller amount>",
    "lossScenario": "<what to do if they get nothing — next steps>",
    "documentationAdvice": "<how and what to document after the conversation>"
  }
}`;

    // const message = await anthropic.messages.create({
    //   model:       "claude-sonnet-4-20250514",
    //   max_tokens:  5000,
    //   temperature: 0.4,
    //   system:      systemPrompt,
    //   messages:    [{ role: "user", content: userPrompt }],
    // });

    // const processingMs = Date.now() - start;
    // const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    const { text: raw, stopReason } = await getClaudeCompletion(userPrompt, {
      maxTokens: 5000,
      system: systemPrompt,
    });

    const processingMs = Date.now() - start;
    console.log(`[salary-intelligence/negotiate] Raw response length: ${raw.length} chars, stopReason: ${stopReason}`);

    let result: any;
    try {
      result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim().replace(/,\s*([\]}])/g, "$1"));
    } catch {
      try { result = cleanJSON(raw); }
      catch { result = { error: "Script generation failed. Please try again.", scripts: {} }; }
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "salary-intelligence/negotiate", { processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[salary-intelligence/negotiate] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Script generation failed" }, { status: 500 });
  }
}