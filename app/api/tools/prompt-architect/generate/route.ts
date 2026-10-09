// =============================================================================
// isaacpaha.com — Prompt Architect — Generate API
// app/api/tools/prompt-architect/generate/route.ts
//
// POST { rawIdea, category, targetModel, techniques, outputFormat,
//        tone, complexity, context, mode }
//
// mode: "full" | "quick" | "image" | "code" | "chain" | "variants" | "explain"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "prompt-architect";
const TOKEN_COST = 120;
const TOOL_NAME  = "Prompt Architect";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

function cleanJSON(raw: string): any {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    .replace(/,\s*([\]}])/g, "$1");
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

// ─── Model-specific guidance ──────────────────────────────────────────────────

const MODEL_GUIDE: Record<string, string> = {
  CLAUDE: `Claude responds best to: clear role definition, XML tags for structure (<instructions>, <context>, <format>), explicit output format instructions, and detailed step-by-step requirements. Claude handles long context very well. Use "Think step by step" for reasoning tasks.`,
  CHATGPT_GPT4: `GPT-4 responds best to: system prompts that define role and style, markdown formatting instructions, explicit constraints. Works well with JSON mode for structured outputs. Responds to "You are a [role]" framing.`,
  GEMINI: `Gemini responds best to: clear task framing, explicit output format, Google-style structured requests. Good with multimodal context. Benefits from explicit length constraints.`,
  MIDJOURNEY: `Midjourney prompt structure: [subject], [environment/setting], [mood/atmosphere], [style], [technical params: --ar 16:9 --v 6 --quality 2]. Use artist references, lighting descriptions, camera terms. Negative prompt: --no [unwanted elements].`,
  DALL_E: `DALL-E prompt structure: [detailed subject description], [setting], [style: photorealistic/oil painting/etc], [lighting], [composition], [mood]. Be specific about what you don't want using "avoid" language.`,
  STABLE_DIFFUSION: `Stable Diffusion: [positive prompt keywords, comma-separated], quality boosters (masterpiece, best quality, highly detailed), style keywords, lighting. Negative prompt: (bad anatomy:1.4), blurry, watermark, text. Use emphasis weights like (important element:1.3).`,
  LLAMA: `Llama models: Use clear instruction formatting, explicit output requirements. Works well with Alpaca-style [INST] formatting for instruct models. Be explicit about format.`,
  PERPLEXITY: `Perplexity: Frame as a research question. Specify recency requirements, source type preferences. Ask for citations. Use "Search for and summarise..." framing for web-sourced answers.`,
  ANY: `Write a model-agnostic prompt using universal best practices: clear role, context, task, output format, constraints. Will work across Claude, GPT-4, Gemini, and other major models.`,
};

const CATEGORY_PATTERNS: Record<string, string> = {
  CODING_APP:        "Include: language/framework, input/output spec, error handling requirements, code style preferences, testing requirements, comments level.",
  WRITING_CONTENT:   "Include: audience, tone, length, structure, SEO requirements, examples of style, call to action.",
  IMAGE_GENERATION:  "Include: subject, setting, style, mood, lighting, composition, colour palette, technical params.",
  BUSINESS_STRATEGY: "Include: company context, market, constraints, desired outcomes, frameworks to use, decision criteria.",
  DATA_ANALYSIS:     "Include: data description, analysis goal, visualisation requirements, output format (table/chart/summary), statistical depth.",
  CREATIVE_FICTION:  "Include: genre, setting, character details, plot constraints, tone, length, POV, target audience.",
  RESEARCH:          "Include: topic, depth, sources to include/exclude, output structure, citation format, recency requirements.",
  VIDEO_SCRIPT:      "Include: platform, duration, tone, CTA, hook style, audience, format (talking head/voiceover/etc).",
  EDUCATION_TEACHING:"Include: subject, student level, learning objectives, teaching style, assessment method, examples to use.",
  PRODUCTIVITY:      "Include: workflow context, tool/software, input data, output format, frequency, stakeholders.",
  ROLEPLAY_PERSONA:  "Include: character backstory, personality, knowledge boundaries, interaction style, what to refuse.",
  GENERAL:           "Include: clear context, specific task, desired output format, constraints, examples if helpful.",
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      rawIdea      = "",
      category     = "GENERAL",
      targetModel  = "ANY",
      techniques   = [],
      outputFormat = "",
      tone         = "",
      complexity   = "intermediate",
      context      = "",
      mode         = "full",
      promptToExplain = "", // for explain mode
      promptToScore   = "", // for score mode (handled in score route)
    } = body;

    if (!rawIdea?.trim() && !promptToExplain?.trim()) {
      return NextResponse.json({ error: "Please describe what you want your prompt to do." }, { status: 400 });
    }

    const validModes = ["full", "quick", "image", "code", "chain", "variants", "explain"];
    const validMode  = validModes.includes(mode) ? mode : "full";

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const modelGuide    = MODEL_GUIDE[targetModel] ?? MODEL_GUIDE.ANY;
    const catPattern    = CATEGORY_PATTERNS[category] ?? CATEGORY_PATTERNS.GENERAL;
    const techList      = Array.isArray(techniques) ? techniques.join(", ") : techniques || "none specified";

    const systemPrompt = `You are a world-class prompt engineer. You understand the deep psychology of how large language models process instructions, and you know the precise techniques that separate amateur prompts from professional ones.

You've engineered prompts for Claude, GPT-4, Gemini, Midjourney, and every major AI model. You know what makes them respond accurately, creatively, and consistently.

Your output is always production-ready — something someone can copy and use immediately and get dramatically better results than their original attempt.

TARGET MODEL: ${targetModel}
Model guidance: ${modelGuide}

CATEGORY: ${category}
Category best practices: ${catPattern}

TECHNIQUES TO APPLY: ${techList}
COMPLEXITY LEVEL: ${complexity}
TONE: ${tone || "match task"}
OUTPUT FORMAT REQUIRED: ${outputFormat || "match task"}
ADDITIONAL CONTEXT: ${context || "none"}`;

    let userPrompt = "";

    // ── FULL mode ──────────────────────────────────────────────────────────
    if (validMode === "full") {
      userPrompt = `Transform this raw idea into a masterfully engineered prompt:

RAW IDEA: "${rawIdea}"

Create a comprehensive prompt engineering package. Write REAL prompts — not templates with [BRACKETS] that need filling. The prompts should be immediately usable.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings with \\".

{
  "title": "<a clear title for what this prompt does>",
  "category": "${category}",
  "targetModel": "${targetModel}",

  "mainPrompt": {
    "systemPrompt": "<if relevant: the system/role prompt that sets context — for models that support it. null if not needed>",
    "userPrompt": "<the main engineered prompt — complete, specific, immediately usable. This is the star of the show.>",
    "negativePrompt": "<for image models or where exclusions matter: what to avoid. null if not relevant>",
    "usage": "<exactly where to paste this — system prompt field, user message, etc>"
  },

  "promptAnalysis": {
    "whyItWorks": "<specific explanation of the techniques embedded and why they produce better results>",
    "keyIngredients": ["<technique/element 1 and why it's there>", "<element 2>", "<element 3>"],
    "modelSpecificNotes": "<specific notes about why this prompt is optimised for ${targetModel}>",
    "expectedOutput": "<what the AI should produce in response — what does a great output look like?>"
  },

  "variants": [
    {
      "name": "<variant name — e.g. 'Shorter version' | 'More creative' | 'More structured'>",
      "prompt": "<the complete variant prompt — fully written, not a template>",
      "whenToUse": "<when this variant is better than the main>"
    },
    {
      "name": "<variant 2>",
      "prompt": "<complete variant 2>",
      "whenToUse": "<when to use>"
    },
    {
      "name": "<variant 3>",
      "prompt": "<complete variant 3>",
      "whenToUse": "<when to use>"
    }
  ],

  "techniques": [
    {
      "name": "<technique name — e.g. 'Role Prompting' | 'Chain of Thought' | 'Few-Shot'>",
      "applied": "<how this technique is applied in the main prompt>",
      "whyEffective": "<why this technique improves AI output for this type of task>"
    }
  ],

  "advancedVersion": {
    "prompt": "<a more sophisticated version using advanced techniques — chain of thought, structured output, self-reflection, etc. Fully written.>",
    "addedTechniques": ["<what makes this version more advanced>"],
    "tradeOff": "<what you gain and lose vs the main version>"
  },

  "iterationGuide": {
    "ifOutputTooLong":  "<specific text to add/change to shorten output>",
    "ifOutputTooShort": "<specific text to add/change to get more detail>",
    "ifTooGeneric":     "<how to add specificity>",
    "ifWrongTone":      "<how to adjust the tone>",
    "paramToTweak":     "<the single most impactful thing to change when iterating>"
  },

  "promptDNA": {
    "role": "<the role/persona element of the prompt>",
    "context": "<the context element>",
    "task": "<the clear task definition>",
    "format": "<the output format specification>",
    "constraints": "<the constraints and boundaries>",
    "examples": "<any examples or few-shot elements>"
  },

  "commonMistakes": [
    "<specific mistake people make when writing prompts for this type of task>",
    "<mistake 2>",
    "<mistake 3>"
  ],

  "copyPasteReady": "<the single best prompt to copy — just the prompt text, nothing else, ready to paste>"
}`;
    }

    // ── QUICK mode ─────────────────────────────────────────────────────────
    else if (validMode === "quick") {
      userPrompt = `Write a high-quality prompt for this task: "${rawIdea}"
Target: ${targetModel}. Category: ${category}.
Be direct. Write the actual prompt, not a description of it.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "prompt": "<the complete, engineered prompt — immediately usable>",
  "systemPrompt": "<system prompt if helpful, null otherwise>",
  "whyItWorks": "<2 sentences on the key techniques embedded>",
  "quickTweak": "<the one change that would make the biggest difference>"
}`;
    }

    // ── IMAGE mode ─────────────────────────────────────────────────────────
    else if (validMode === "image") {
      userPrompt = `Engineer a professional image generation prompt for: "${rawIdea}"
Target model: ${targetModel === "ANY" ? "Midjourney" : targetModel}

Create multiple versions with different styles.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "mainPrompt": "<the complete Midjourney-style prompt>",
  "negativePrompt": "<what to exclude>",
  "variants": [
    { "style": "<e.g. Photorealistic>",    "prompt": "<complete variant>", "params": "<--ar --v etc>" },
    { "style": "<e.g. Digital art>",       "prompt": "<complete variant>", "params": "<params>"       },
    { "style": "<e.g. Oil painting>",      "prompt": "<complete variant>", "params": "<params>"       },
    { "style": "<e.g. Cinematic film>",    "prompt": "<complete variant>", "params": "<params>"       }
  ],
  "keyElements": {
    "subject": "<the main subject elements>",
    "environment": "<setting and background>",
    "lighting": "<lighting description>",
    "mood": "<emotional atmosphere>",
    "style": "<artistic/technical style>",
    "composition": "<camera angle, framing>"
  },
  "proTips": ["<tip 1 for getting better results>", "<tip 2>", "<tip 3>"]
}`;
    }

    // ── CODE mode ──────────────────────────────────────────────────────────
    else if (validMode === "code") {
      userPrompt = `Engineer a professional coding/app development prompt for: "${rawIdea}"
Target: ${targetModel}

Write a prompt that produces complete, working, production-quality code.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "systemPrompt": "<role: expert developer prompt>",
  "mainPrompt": "<the full coding prompt — with requirements, tech stack, architecture notes, error handling, testing, code style>",
  "specificationPrompt": "<a structured spec prompt that asks AI to first produce a technical spec before coding — prevents hallucination>",
  "iterativeApproach": {
    "step1": "<first prompt: high-level architecture>",
    "step2": "<second prompt: core functionality>",
    "step3": "<third prompt: error handling + edge cases>",
    "step4": "<fourth prompt: testing + documentation>"
  },
  "qualityCheckers": ["<follow-up prompt to check code quality>", "<prompt to add tests>", "<prompt to review for security>"],
  "commonCodePromptMistakes": ["<mistake 1>", "<mistake 2>"]
}`;
    }

    // ── CHAIN mode (chain of thought / multi-step) ─────────────────────────
    else if (validMode === "chain") {
      userPrompt = `Build a chain-of-thought or multi-step prompt sequence for: "${rawIdea}"
Target: ${targetModel}

Create a prompt chain where each step builds on the last.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "chainTitle": "<what this chain accomplishes>",
  "overview": "<why a prompt chain is better than a single prompt for this task>",
  "chain": [
    {
      "step": 1,
      "title": "<step title>",
      "prompt": "<the complete prompt for this step>",
      "expectedOutput": "<what AI should produce>",
      "howToFeedToNextStep": "<what from this output feeds into step 2>"
    }
  ],
  "finalSynthesisPrompt": "<a final prompt to synthesise all outputs>",
  "whenToUseChain": "<specific scenarios where chain beats single prompt>",
  "timeEstimate": "<rough time this chain takes to run>"
}`;
    }

    // ── VARIANTS mode ──────────────────────────────────────────────────────
    else if (validMode === "variants") {
      userPrompt = `Generate 6 distinct prompt variations for: "${rawIdea}"
Target: ${targetModel}. Each must use a different technique or angle.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "baseTask": "${rawIdea}",
  "variants": [
    {
      "id": 1,
      "technique": "<ROLE_PROMPTING | CHAIN_OF_THOUGHT | FEW_SHOT | STRUCTURED_OUTPUT | etc>",
      "techniqueName": "<human name>",
      "prompt": "<the complete, fully written prompt using this technique>",
      "bestFor": "<when this technique produces the best results>",
      "keyDifference": "<what makes this variant distinct>"
    }
  ],
  "techniqueComparison": "<which technique is best for this specific task and why>",
  "recommendation": "<the single best variant and why>"
}`;
    }

    // ── EXPLAIN mode ───────────────────────────────────────────────────────
    else if (validMode === "explain") {
      userPrompt = `Analyse and explain this prompt: "${promptToExplain || rawIdea}"

Teach the user why it works or why it doesn't. Then improve it.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "originalPrompt": "${(promptToExplain || rawIdea).replace(/"/g, '\\"')}",
  "overallAssessment": "<honest 2-sentence verdict on the quality of this prompt>",
  
  "anatomyBreakdown": [
    {
      "element": "<part of the prompt>",
      "type": "<ROLE | CONTEXT | TASK | FORMAT | CONSTRAINT | EXAMPLE | FILLER>",
      "quality": "<STRONG | WEAK | MISSING | UNNECESSARY>",
      "explanation": "<why this element works or doesn't>"
    }
  ],

  "strengths": ["<what the prompt does well — be specific>"],
  "weaknesses": ["<specific problem with the prompt — reference exact text>"],
  "missingElements": ["<what's not in the prompt that would dramatically improve it>"],

  "improvedPrompt": "<the fully rewritten, improved version — complete and immediately usable>",
  "improvementExplained": "<what changed and why each change matters>",

  "techniqueAnalysis": {
    "techniquesPresent": ["<technique already being used>"],
    "techniquesMissing": ["<technique that would help>"],
    "recommendation": "<the one technique addition that would help most>"
  },

  "quickFix": "<the single fastest change they could make right now that would improve results most>"
}`;
    }

    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  7000,
      temperature: 0.5,
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
      catch { result = { error: "Generation failed. Please try again.", mainPrompt: { userPrompt: "", systemPrompt: null } }; }
    }

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "prompt-architect/generate", { mode: validMode, category, processingMs });
    await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId, ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true });

    return NextResponse.json({ ok: true, result, mode: validMode, metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST } });

  } catch (err: any) {
    console.error("[prompt-architect/generate] Error:", err);
    try { await trackToolUsage({ toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req), processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message }); } catch {}
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
  }
}