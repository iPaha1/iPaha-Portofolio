// =============================================================================
// isaacpaha.com — Viral Hook Engine — Analyse API
// app/api/tools/viral-hook-engine/analyse/route.ts
//
// POST { idea, platform, niche, targetAudience, contentFormat, mode }
//   mode: "full" | "hooks_only" | "thumbnail" | "script_opener" | "ideas"
//
// Returns a complete viral content breakdown:
//   - Virality score (0–100) with tier + reasoning
//   - 10 hook rewrites, each with psychological trigger, score, platform fit
//   - Thumbnail concept (3 variations)
//   - Retention arc (opening 30s script)
//   - Algorithm metadata (title, tags, description hooks)
//   - Competitor gap analysis
//   - Best time to post
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "viral-hook-engine";
const TOKEN_COST = 130;
const TOOL_NAME  = "Viral Hook Engine";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanJSON(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
    .replace(/,\s*([\]}])/g, "$1");
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

const PLATFORM_CONTEXT: Record<string, string> = {
  YOUTUBE:           "YouTube (long-form video, 8–20 min sweet spot, algorithm rewards watch time and CTR)",
  TIKTOK:            "TikTok (short-form 15–90s, hook must land in first 2 seconds, loop-friendly)",
  INSTAGRAM_REELS:   "Instagram Reels (15–60s, visual-first, aesthetic matters as much as hook)",
  TWITTER_X:         "Twitter/X (text-first, first line is the hook, controversy and strong opinions perform)",
  LINKEDIN:          "LinkedIn (professional audience, personal stories + data + career insights perform)",
  PODCAST:           "Podcast (audio-only, episode title + description must sell the listen)",
  NEWSLETTER:        "Email Newsletter (subject line is the hook, open rate is the viral metric)",
  BLOG:              "Blog/SEO article (headline + meta description drive clicks from search)",
};

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      idea            = "",
      platform        = "YOUTUBE",
      niche           = "",
      targetAudience  = "",
      contentFormat   = "",
      mode            = "full",
    } = body;

    if (!idea?.trim() || idea.trim().length < 5) {
      return NextResponse.json({ error: "Please enter a content idea (minimum 5 characters)." }, { status: 400 });
    }

    const validModes = ["full", "hooks_only", "thumbnail", "script_opener", "ideas"];
    const validMode  = validModes.includes(mode) ? mode : "full";

    // ── TOKEN GATE ──────────────────────────────────────────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const platformCtx = PLATFORM_CONTEXT[platform] ?? PLATFORM_CONTEXT.YOUTUBE;

    const systemPrompt = `You are the world's leading viral content strategist. You've studied every viral video, post, and article of the last decade. You understand the precise psychological mechanisms that make content spread — curiosity gaps, pattern interrupts, identity triggers, fear of missing out, social currency.

You know the difference between content that gets 200 views and content that gets 2 million. You can articulate exactly WHY with precision.

Platform context: ${platformCtx}
Creator niche: ${niche || "General / not specified"}
Target audience: ${targetAudience || "Not specified"}
Content format: ${contentFormat || "Not specified"}

Be ruthlessly specific. No generic advice. Real psychological mechanisms. Real platform knowledge.`;

    let userPrompt = "";

    // ── FULL mode ──────────────────────────────────────────────────────────
    if (validMode === "full") {
      userPrompt = `Analyse this content idea and give a COMPLETE viral breakdown:

"${idea}"

CRITICAL JSON RULES: Return ONLY valid JSON. No preamble. No trailing commas. Escape all quotes inside strings.

{
  "originalIdea": "${idea.replace(/"/g, '\\"')}",
  "conceptStrength": "<2-3 sentence honest diagnosis of the raw idea — what's working, what isn't>",
  
  "viralityScore": <integer 0-100>,
  "viralityTier": "<SLEEPER | DECENT | STRONG | HOT | EXPLOSIVE>",
  "viralityBreakdown": {
    "hookStrength":      <0-25>,
    "emotionalPull":     <0-25>,
    "shareability":      <0-25>,
    "platformFit":       <0-25>,
    "reasoning": "<2-3 sentences explaining the score — be blunt>"
  },

  "hooks": [
    {
      "id": 1,
      "hook": "<the rewritten hook — title, opening line, or subject line depending on platform>",
      "type": "<CURIOSITY_GAP | CONTROVERSIAL | NUMBERS_DATA | PERSONAL_STORY | FEAR_FOMO | SHOCK_SURPRISE | HOW_TO | LISTICLE | CHALLENGE | TRANSFORMATION>",
      "typeName": "<human-readable type name>",
      "psychologicalTrigger": "<the specific psychological mechanism this exploits>",
      "score": <0-100>,
      "platformFit": "<why this specifically works on ${platform}>",
      "whyItWorks": "<precise explanation of why this hook would make someone stop scrolling>",
      "warning": "<optional: potential downside or who this won't work for>"
    }
  ],

  "thumbnailConcepts": [
    {
      "id": 1,
      "concept": "<visual description — what's in frame, text overlay, colours, emotion on face>",
      "textOverlay": "<exact words on thumbnail — 3-5 words max>",
      "whyItWorks": "<the thumbnail psychology>",
      "emotionToConvey": "<shock | curiosity | inspiration | fear | joy | disgust>",
      "colourStrategy": "<specific colour psychology for this thumbnail>"
    }
  ],

  "openingScript": {
    "firstLine": "<the very first sentence spoken or written — the pattern interrupt>",
    "first30Seconds": "<beat-by-beat breakdown of the opening 30 seconds that retains viewers>",
    "retentionHook": "<the 'stay to find out X' promise planted in the opening>",
    "paceNotes": "<pacing, energy, tone guidance for the opening>"
  },

  "algorithmPackage": {
    "bestTitle": "<the single best SEO + click optimised title>",
    "altTitles": ["<alt title 1>", "<alt title 2>"],
    "descriptionHook": "<first 2 lines of description — what shows before 'show more'>",
    "tags": ["<tag 1>", "<tag 2>", "<tag 3>", "<tag 4>", "<tag 5>", "<tag 6>", "<tag 7>", "<tag 8>"],
    "bestTimeToPost": "<specific day/time and why for this niche on ${platform}>",
    "contentLength": "<optimal length for this content on ${platform} and why>"
  },

  "competitorGap": {
    "whatEveryoneElseIsDoing": "<the oversaturated angle in this niche>",
    "yourAngle": "<the specific gap or differentiated angle this creator can own>",
    "untappedKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"]
  },

  "contentSeries": {
    "seriesPotential": "<HIGH | MEDIUM | LOW>",
    "seriesIdea": "<if high: what recurring series this could anchor>",
    "followUpVideos": ["<follow-up idea 1>", "<follow-up idea 2>", "<follow-up idea 3>"]
  },

  "viralAmplifiers": [
    "<specific tactic to increase shareability — e.g. add a controversial take at 4:30>",
    "<specific tactic 2>",
    "<specific tactic 3>"
  ],

  "creatorWarnings": [
    "<honest warning about what could kill this video's performance>"
  ],

  "verdict": "<3-sentence honest verdict: what to keep, what to change, and the single most important thing to do before publishing>"
}

Generate exactly 10 hooks. Make each one distinctly different — don't repeat the same angle with different words.`;
    }

    // ── HOOKS ONLY mode ────────────────────────────────────────────────────
    else if (validMode === "hooks_only") {
      userPrompt = `Generate 15 viral hook variations for this content idea:

"${idea}"

Platform: ${platform}. Make each hook a genuinely different psychological approach.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "hooks": [
    {
      "id": 1,
      "hook": "<the hook>",
      "type": "<type>",
      "typeName": "<human name>",
      "psychologicalTrigger": "<mechanism>",
      "score": <0-100>,
      "whyItWorks": "<one sentence>"
    }
  ]
}`;
    }

    // ── THUMBNAIL mode ─────────────────────────────────────────────────────
    else if (validMode === "thumbnail") {
      userPrompt = `Design 5 thumbnail concepts for this content:

"${idea}"

Platform: ${platform}. Study what makes thumbnails get clicked in this niche.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "thumbnailConcepts": [
    {
      "id": 1,
      "concept": "<full visual description>",
      "textOverlay": "<exact 3-5 words>",
      "faceExpression": "<exactly what emotion/expression — if person in shot>",
      "backgroundStyle": "<description of background>",
      "colourPalette": "<specific colours and why>",
      "whyItWorks": "<thumbnail psychology>",
      "aOrBTest": "<what to A/B test against this>"
    }
  ],
  "thumbnailPrinciples": ["<rule 1 for this niche>", "<rule 2>", "<rule 3>"]
}`;
    }

    // ── SCRIPT OPENER mode ─────────────────────────────────────────────────
    else if (validMode === "script_opener") {
      userPrompt = `Write 3 different opening scripts (first 60 seconds) for this content:

"${idea}"

Platform: ${platform}. Each opener should use a different hook strategy.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "openers": [
    {
      "id": 1,
      "strategy": "<hook strategy name>",
      "script": "<the full 60-second script — word for word>",
      "retentionTechnique": "<what psychological technique keeps them watching>",
      "callToAction": "<what CTA to plant in the opener>",
      "paceNotes": "<delivery guidance>"
    }
  ]
}`;
    }

    // ── IDEAS mode (spark new content from a niche) ───────────────────────
    else if (validMode === "ideas") {
      userPrompt = `Generate 12 high-potential viral content ideas for this niche/topic area:

"${idea}"

Platform: ${platform}. Mix formats: controversial takes, data-driven, personal stories, challenges, tutorials.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "ideas": [
    {
      "id": 1,
      "title": "<the optimised title>",
      "hook": "<one-line hook>",
      "angle": "<what makes this different from the obvious version>",
      "viralMechanism": "<why this would spread>",
      "difficulty": "<EASY | MEDIUM | HARD to produce>",
      "estimatedViralPotential": "<LOW | MEDIUM | HIGH | EXPLOSIVE>",
      "format": "<talking head | tutorial | reaction | challenge | story | list | etc>"
    }
  ],
  "nicheTrends": ["<emerging trend in this niche>", "<trend 2>", "<trend 3>"],
  "contentGaps": ["<underserved topic 1>", "<topic 2>", "<topic 3>"]
}`;
    }

    // ── CALL CLAUDE ─────────────────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  6000,
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
      catch { result = { error: "Analysis failed. Please try again.", hooks: [] }; }
    }

    // Validate hooks array for full mode
    if (validMode === "full" && (!result.hooks || !Array.isArray(result.hooks))) {
      result.hooks = [];
    }

    // ── DEDUCT + TRACK ───────────────────────────────────────────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "viral-hook-engine/analyse", {
      mode: validMode, platform, processingMs,
    });

    await trackToolUsage({
      toolId:      TOOL_ID,
      toolName:    TOOL_NAME,
      userId:      gateResult.dbUserId,
      ipAddress:   getIpFromRequest(req),
      processingMs,
      tokenCost:   TOKEN_COST,
      wasSuccess:  true,
    });

    return NextResponse.json({
      ok: true, result, mode: validMode,
      metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST },
    });

  } catch (err: any) {
    console.error("[viral-hook-engine/analyse] Error:", err);
    try {
      await trackToolUsage({
        toolId: TOOL_ID, toolName: TOOL_NAME,
        ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start,
        wasSuccess: false, errorMsg: err.message,
      });
    } catch {}
    return NextResponse.json({ error: err.message ?? "Analysis failed" }, { status: 500 });
  }
}