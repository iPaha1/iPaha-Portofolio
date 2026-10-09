// =============================================================================
// isaacpaha.com — Prompt Architect — Score API
// app/api/tools/prompt-architect/score/route.ts
//
// POST { prompt, category, targetModel }
// Returns: comprehensive score with breakdown and improved version
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "prompt-architect";
const TOKEN_COST = 100;
const TOOL_NAME  = "Prompt Scorer";

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
      prompt      = "",
      category    = "GENERAL",
      targetModel = "ANY",
    } = body;

    if (!prompt?.trim() || prompt.trim().length < 5) {
      return NextResponse.json({ error: "Please paste a prompt to score (minimum 5 characters)." }, { status: 400 });
    }

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const systemPrompt = `You are the world's leading expert in prompt engineering. You evaluate prompts with surgical precision — identifying exactly why they produce weak AI responses and how to fix them.

You score on 6 dimensions. You're honest. A score of 50 means genuinely average. 80+ means professional-grade.`;

    const userPrompt = `Score this prompt for use with ${targetModel} on a ${category} task:

PROMPT TO SCORE:
"${prompt}"

Be precise. Reference the actual words in the prompt. Give real, actionable fixes — not generic advice.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings.

{
  "overallScore": <0-100 integer>,
  "qualityLabel": "<POOR | BASIC | DECENT | STRONG | EXPERT>",
  "oneLineVerdict": "<blunt one-sentence summary of this prompt's quality>",

  "dimensions": {
    "clarity":      { "score": <0-17>, "feedback": "<specific feedback on how clear the task is>",       "fix": "<exact change>" },
    "context":      { "score": <0-17>, "feedback": "<feedback on context provided>",                     "fix": "<exact change>" },
    "specificity":  { "score": <0-17>, "feedback": "<is the task specific enough?>",                     "fix": "<exact change>" },
    "format":       { "score": <0-17>, "feedback": "<output format specified or implied?>",               "fix": "<exact change>" },
    "constraints":  { "score": <0-16>, "feedback": "<are limits/boundaries set?>",                       "fix": "<exact change>" },
    "techniques":   { "score": <0-16>, "feedback": "<what prompt engineering techniques are present?>",  "fix": "<exact change>" }
  },

  "whatWorks": ["<specific element in the prompt that is effective — quote it>", "<element 2>"],
  "whatFails": ["<specific problem — reference the actual words>", "<problem 2>", "<problem 3>"],
  "missingCompletely": ["<element entirely absent that would dramatically improve results>", "<missing 2>"],

  "quickFix": "<the single fastest change that would have the biggest impact>",
  
  "improvedPrompt": "<the fully rewritten, improved version — complete, immediately usable, dramatically better>",
  
  "improvementDelta": "<how much better the improved version is and why — e.g. 'This would raise your score from 35 to 78 by adding...'>"
}`;

    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  3000,
      temperature: 0.3,
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
      catch { result = { error: "Scoring failed. Please try again.", overallScore: 50, qualityLabel: "DECENT" }; }
    }

    // Save score record if user is signed in
    if (gateResult.dbUserId) {
      try {
        const QUALITY_MAP: Record<string, string> = { POOR: "POOR", BASIC: "BASIC", DECENT: "DECENT", STRONG: "STRONG", EXPERT: "EXPERT" };
        const CATEGORY_MAP: Record<string, string> = { CODING_APP: "CODING_APP", WRITING_CONTENT: "WRITING_CONTENT", IMAGE_GENERATION: "IMAGE_GENERATION", BUSINESS_STRATEGY: "BUSINESS_STRATEGY", DATA_ANALYSIS: "DATA_ANALYSIS", CREATIVE_FICTION: "CREATIVE_FICTION", RESEARCH: "RESEARCH", VIDEO_SCRIPT: "VIDEO_SCRIPT", EDUCATION_TEACHING: "EDUCATION_TEACHING", PRODUCTIVITY: "PRODUCTIVITY", ROLEPLAY_PERSONA: "ROLEPLAY_PERSONA", GENERAL: "GENERAL" };
        const MODEL_MAP: Record<string, string> = { CLAUDE: "CLAUDE", CHATGPT_GPT4: "CHATGPT_GPT4", GEMINI: "GEMINI", MIDJOURNEY: "MIDJOURNEY", DALL_E: "DALL_E", STABLE_DIFFUSION: "STABLE_DIFFUSION", LLAMA: "LLAMA", MISTRAL: "MISTRAL", PERPLEXITY: "PERPLEXITY", ANY: "ANY" };

        await prismadb.promptScoreRecord.create({
          data: {
            userId:          gateResult.dbUserId,
            originalPrompt:  prompt.slice(0, 5000),
            improvedPrompt:  result.improvedPrompt?.slice(0, 5000) ?? null,
            scoreJson:       JSON.stringify(result),
            qualityScore:    result.overallScore ?? null,
            qualityLabel:    (QUALITY_MAP[result.qualityLabel] ?? null) as any,
            category:        (CATEGORY_MAP[category] ?? "GENERAL") as any,
            targetModel:     (MODEL_MAP[targetModel] ?? "ANY") as any,
          },
        });
      } catch (e) { console.error("[prompt-architect/score] Save failed:", e); }
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "prompt-architect/score", { processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[prompt-architect/score] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Scoring failed" }, { status: 500 });
  }
}