// =============================================================================
// isaacpaha.com — Content Studio AI — Generate API
// app/api/tools/content-studio/generate/route.ts
//
// POST { topic, platform, tone, targetLength, targetAudience, creatorStyle,
//        niche, keyPoints, mode }
//
// mode: "full" | "script_only" | "short_form" | "thread" |
//        "blog" | "newsletter" | "repurpose" | "refine"
//
// Returns a complete, production-ready content package tailored to platform.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "content-studio";
const TOKEN_COST = 180;
const TOOL_NAME  = "Content Studio AI";

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
  if (!match) throw new Error("No JSON found");
  return JSON.parse(match[0]);
}

// ─── Platform configs ─────────────────────────────────────────────────────────

const PLATFORM_CFG: Record<string, {
  name: string;
  scriptNotes: string;
  lengthGuide: string;
  formatNotes: string;
}> = {
  YOUTUBE_LONG: {
    name: "YouTube (Long-form)",
    scriptNotes: "Full structured script with intro, main sections, and outro. Include B-roll suggestions, on-screen text cues, and visual direction notes in [brackets].",
    lengthGuide: "8–15 minutes (1,200–2,200 words spoken)",
    formatNotes: "Sections with timestamps. Strong hook in first 30s. Mid-roll retention hook at 40%. CTA before outro.",
  },
  YOUTUBE_SHORT: {
    name: "YouTube Shorts",
    scriptNotes: "Punchy, fast-paced script. Hook must land in first 2 seconds. No slow builds.",
    lengthGuide: "45–60 seconds (90–120 words spoken)",
    formatNotes: "Single idea, one payoff. Loop-friendly ending. Text overlay suggestions.",
  },
  TIKTOK: {
    name: "TikTok",
    scriptNotes: "Conversational, fast energy. Hook in first 1–2 seconds. Trending audio notes where relevant.",
    lengthGuide: "30–90 seconds (60–180 words spoken)",
    formatNotes: "Pattern interrupt every 5–7 seconds. Strong verbal hook. Loop trigger at end.",
  },
  INSTAGRAM_REELS: {
    name: "Instagram Reels",
    scriptNotes: "Visually-led script. Aesthetic matters. Captions/text overlay are often read without audio.",
    lengthGuide: "15–60 seconds (30–120 words spoken)",
    formatNotes: "Text overlay suggestions essential. Strong visual concept. Trending audio note.",
  },
  LINKEDIN_VIDEO: {
    name: "LinkedIn Video",
    scriptNotes: "Professional but human. Story-driven or data-backed. Personal insight works well.",
    lengthGuide: "1–3 minutes (150–450 words spoken)",
    formatNotes: "Hook with professional insight. Practical takeaway. CTA to comment or share.",
  },
  LINKEDIN_POST: {
    name: "LinkedIn Post",
    scriptNotes: "Text post. Hook line must stop the scroll. Short punchy sentences. White space matters.",
    lengthGuide: "150–300 words",
    formatNotes: "Opening hook line. 3–5 key points or story beats. CTA at end. No jargon.",
  },
  TWITTER_THREAD: {
    name: "Twitter/X Thread",
    scriptNotes: "Thread format. Each tweet must be standalone but drive to the next. Hook tweet must compel clicking 'show more'.",
    lengthGuide: "8–15 tweets",
    formatNotes: "Tweet 1: the hook promise. Tweets 2–N: content. Last tweet: CTA/summary.",
  },
  PODCAST_EPISODE: {
    name: "Podcast Episode",
    scriptNotes: "Spoken word only. Conversational tone. Natural sentence structures. No visual references.",
    lengthGuide: "20–45 minutes (3,000–6,500 words spoken)",
    formatNotes: "Cold open hook. Episode arc with clear sections. Guest question prompts if applicable. Outro with CTA.",
  },
  BLOG_POST: {
    name: "Blog Post / Article",
    scriptNotes: "Written SEO article. Subheadings, scannable structure. H2/H3 hierarchy.",
    lengthGuide: "1,200–2,500 words",
    formatNotes: "SEO title + meta description. Intro with hook. Subheadings every 300 words. Internal link placeholders. CTA.",
  },
  NEWSLETTER: {
    name: "Email Newsletter",
    scriptNotes: "Conversational email copy. Subject line + preview text are critical. Write like writing to one person.",
    lengthGuide: "400–800 words",
    formatNotes: "Subject line + preview text. Opening hook. 3–5 sections. Single clear CTA.",
  },
};

const TONE_GUIDE: Record<string, string> = {
  EDUCATIONAL:     "Clear, authoritative, structured. Teach concepts step by step. Use analogies.",
  ENTERTAINING:    "High energy, humour where appropriate, relatable examples, fast pace.",
  INSPIRATIONAL:   "Story-driven, emotionally resonant, build to a meaningful payoff.",
  CONTROVERSIAL:   "Take a clear stance. Challenge conventional wisdom. Defend the position.",
  STORYTELLING:    "Narrative arc: setup, conflict, resolution. Character-driven. Show don't tell.",
  NEWS_COMMENTARY: "Timely, informed opinion. Context + reaction + what it means for the audience.",
  TUTORIAL:        "Step-by-step practical. Clear actions. Expected outcomes stated at each step.",
  VLOG:            "Personal, behind-the-scenes, honest. Viewer feels like they're with you.",
};

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      topic          = "",
      platform       = "YOUTUBE_LONG",
      tone           = "EDUCATIONAL",
      targetLength   = "",
      targetAudience = "",
      creatorStyle   = "",
      niche          = "",
      keyPoints      = "",
      mode           = "full",
      existingScript = "", // for refine mode
    } = body;

    if (!topic?.trim() || topic.trim().length < 5) {
      return NextResponse.json({ error: "Please enter a content topic." }, { status: 400 });
    }

    const validModes = ["full", "script_only", "short_form", "thread", "blog", "newsletter", "repurpose", "refine"];
    const validMode  = validModes.includes(mode) ? mode : "full";

    // ── TOKEN GATE ──────────────────────────────────────────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const platCfg  = PLATFORM_CFG[platform]  ?? PLATFORM_CFG.YOUTUBE_LONG;
    const toneGuide = TONE_GUIDE[tone]        ?? TONE_GUIDE.EDUCATIONAL;

    const systemPrompt = `You are a world-class content writer and production director. You've written scripts for creators with millions of subscribers across YouTube, TikTok, LinkedIn, and every major platform.

You understand that content creation is a craft — every word must earn its place. You write scripts that are genuinely engaging, not AI-sounding fluff. Real sentences. Real rhythm. Real hooks.

Platform: ${platCfg.name}
Format guidance: ${platCfg.formatNotes}
Length target: ${targetLength || platCfg.lengthGuide}
Tone: ${toneGuide}
Creator niche: ${niche || "General"}
Target audience: ${targetAudience || "Not specified"}
Creator style notes: ${creatorStyle || "Neutral — match platform conventions"}
Key points to include: ${keyPoints || "None specified — use your expert judgment"}

CRITICAL: Write like a real creator would speak/write. Not like an AI assistant. Punchy. Direct. Human.`;

    let userPrompt = "";

    // ── FULL mode ──────────────────────────────────────────────────────────
    if (validMode === "full") {
      userPrompt = `Create a COMPLETE, production-ready content package for:

Topic: "${topic}"
Platform: ${platCfg.name}

${platCfg.scriptNotes}

CRITICAL JSON RULES: Return ONLY valid JSON. No preamble. No trailing commas. Escape all quotes inside strings with \\.

{
  "title": "<the final, optimised title for this platform>",
  "altTitles": ["<alt title 1>", "<alt title 2>"],
  
  "hook": {
    "openingLine": "<the very first thing said or written — the pattern interrupt>",
    "hookType": "<what psychological mechanism this uses>",
    "hookScript": "<full hook section — first 30-60 seconds for video, first paragraph for written>",
    "whyThisHook": "<why this hook works for this topic and audience>"
  },

  "contentBrief": {
    "corePremise": "<one sentence: what this piece of content actually delivers>",
    "uniqueAngle": "<what makes this treatment different from the 50 other videos on this topic>",
    "keyTakeaway": "<what the viewer/reader leaves knowing or feeling>",
    "estimatedRuntime": "<e.g. 11 minutes | 850 words | 8 tweets>",
    "wordCount": <estimated word count as integer>
  },

  "script": {
    "sections": [
      {
        "id": 1,
        "type": "<HOOK | INTRO | MAIN | TRANSITION | RETENTION_HOOK | OUTRO | CTA>",
        "title": "<section name — e.g. 'The Setup' or 'Why Most People Get This Wrong'>",
        "timestamp": "<e.g. 0:00–1:30 for video, or null for written>",
        "script": "<the full, word-for-word script for this section. Write how a real human speaks/writes. No asterisks, no [PAUSE] unless genuinely useful. Real sentences.>",
        "bRollNotes": "<for video: what should be on screen during this section — footage, graphics, text overlays. null for written content.>",
        "directorNotes": "<delivery, pacing, energy, camera notes for video. Formatting notes for written.>",
        "hookDevice": "<if this section has a retention hook — what is it? Otherwise null.>"
      }
    ],
    "fullScriptText": "<the complete script assembled as one continuous readable piece — no JSON formatting, just the actual script with natural section breaks>"
  },

  "promotionPackage": {
    "youtubeDescription": "<full YouTube description with hook paragraph, timestamps, links placeholders, hashtags — only if YOUTUBE platform>",
    "shortDescription": "<2-3 sentence platform description for non-YouTube platforms>",
    "chapters": [
      { "timestamp": "<0:00>", "title": "<chapter title>" }
    ],
    "tags": ["<tag 1>", "<tag 2>", "<tag 3>", "<tag 4>", "<tag 5>", "<tag 6>", "<tag 7>", "<tag 8>"],
    "promotionTweets": [
      "<tweet 1 to share this content — max 280 chars, compelling>",
      "<tweet 2 — different angle>",
      "<tweet 3 — quote or stat from the content>"
    ],
    "linkedinCaption": "<LinkedIn post caption to share this content>",
    "thumbnailBrief": "<detailed thumbnail brief: what's in frame, text overlay, facial expression, colour palette, visual style>"
  },

  "repurposeIdeas": [
    {
      "format": "<e.g. Twitter Thread | TikTok | LinkedIn Post | Email Newsletter | Short-form clip>",
      "angle": "<how to adapt this specific content for that format>",
      "hookLine": "<the hook for that repurposed piece>"
    }
  ],

  "engagementStrategy": {
    "commentHook": "<a question to ask at the end that drives comments>",
    "pollIdea": "<a poll idea related to this content>",
    "communityPost": "<a community/close friends post to complement this>",
    "bestTimeToPost": "<specific day and time for this niche>"
  }
}

Write the script sections with REAL CONTENT. Don't use placeholder text. This is a production-ready script.
Generate at least 6–8 script sections for long-form, 3–4 for short-form.
The fullScriptText must be the complete assembled script — every word, ready to read from a teleprompter or paste into a doc.`;
    }

    // ── SHORT FORM mode ────────────────────────────────────────────────────
    else if (validMode === "short_form") {
      userPrompt = `Write a complete short-form script for:
Topic: "${topic}"
Platform: ${platCfg.name}

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "title": "<title/caption>",
  "hook": "<opening line — must hook in 2 seconds>",
  "script": "<the complete word-for-word script — 60-180 words max>",
  "textOverlays": ["<text overlay 1 with timing>", "<text overlay 2>", "<text overlay 3>"],
  "audioNote": "<trending sound suggestion or vibe>",
  "captionText": "<the caption/description to post with this>",
  "hashtags": ["<tag 1>", "<tag 2>", "<tag 3>", "<tag 4>", "<tag 5>"],
  "loopTrigger": "<how does this loop back? What's the last line that makes people re-watch?>",
  "bRollIdeas": ["<b-roll shot 1>", "<b-roll shot 2>", "<b-roll shot 3>"]
}`;
    }

    // ── THREAD mode ────────────────────────────────────────────────────────
    else if (validMode === "thread") {
      userPrompt = `Write a complete Twitter/X thread about:
Topic: "${topic}"

Write 8–15 tweets. Each tweet must be under 280 characters, standalone, and compel reading the next.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas.

{
  "hookTweet": "<Tweet 1 — the hook that makes people click 'show more' or read on>",
  "tweets": [
    {
      "number": 1,
      "text": "<tweet text — under 280 chars>",
      "note": "<optional: what this tweet achieves in the thread>"
    }
  ],
  "ctaTweet": "<final tweet — summary + call to action>",
  "threadHook": "<the meta-hook: what promise does tweet 1 make to justify reading all N tweets>",
  "promotionLine": "<one sentence to quote-tweet or share this thread>"
}`;
    }

    // ── BLOG mode ─────────────────────────────────────────────────────────
    else if (validMode === "blog") {
      userPrompt = `Write a complete SEO blog post about:
Topic: "${topic}"
Audience: ${targetAudience || "General readers"}

Write 1,200–1,800 words of actual article content — not placeholder text.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings.

{
  "seoTitle": "<SEO-optimised H1 title>",
  "metaDescription": "<155 character meta description>",
  "slug": "<url-slug>",
  "targetKeywords": ["<primary keyword>", "<secondary 1>", "<secondary 2>"],
  "estimatedReadTime": "<e.g. 7 min read>",
  "article": "<the complete article in markdown format — H2s, H3s, paragraphs, bullet lists. Real content. 1200+ words.>",
  "internalLinkPlaceholders": ["<suggest where to add internal links: e.g. 'After paragraph 3: link to related post about X'>"],
  "imageAltTexts": ["<alt text for hero image>", "<alt text for section image>"],
  "promotionTweets": ["<tweet 1>", "<tweet 2>"],
  "linkedinPost": "<LinkedIn post to promote this article>"
}`;
    }

    // ── NEWSLETTER mode ────────────────────────────────────────────────────
    else if (validMode === "newsletter") {
      userPrompt = `Write a complete email newsletter about:
Topic: "${topic}"
List audience: ${targetAudience || "Subscribers interested in this topic"}

Write like writing to one specific person. Conversational but substantive.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes.

{
  "subjectLine": "<the subject line — under 50 chars, high open rate>",
  "previewText": "<preview text — 85 chars max, complements subject line>",
  "altSubjectLines": ["<alt subject 1>", "<alt subject 2>"],
  "emailBody": "<the full email — conversational, 400-700 words. Sections separated by line breaks. Real content. Single CTA at end.>",
  "cta": {
    "text": "<CTA button/link text>",
    "destination": "<what they're clicking to — e.g. 'full article', 'YouTube video', 'reply to email'>",
    "urgency": "<why they should click now>"
  },
  "psLine": "<P.S. line — often the most-read part of an email. Make it count.>",
  "bestSendTime": "<day + time for this audience>"
}`;
    }

    // ── REPURPOSE mode ─────────────────────────────────────────────────────
    else if (validMode === "repurpose") {
      userPrompt = `I have existing content: "${topic}"

Repurpose it into 5 different formats. Extract the core value and repackage it natively for each platform.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes.

{
  "sourceContent": "<brief summary of the core content being repurposed>",
  "repurposedVersions": [
    {
      "format": "<e.g. Twitter Thread | TikTok Script | LinkedIn Post | Email Newsletter | YouTube Short>",
      "nativeAdaptation": "<what changes about the angle/hook/structure for this platform>",
      "content": "<the actual repurposed content — not a description of it, the real thing>",
      "hookLine": "<the hook for this version>",
      "estimatedLength": "<e.g. 8 tweets | 45 seconds | 250 words>"
    }
  ],
  "repurposeStrategy": "<overall approach: what core insight/story travels across all formats>"
}`;
    }

    // ── REFINE mode ────────────────────────────────────────────────────────
    else if (validMode === "refine") {
      userPrompt = `Refine and improve this existing script/content:

ORIGINAL CONTENT:
"${existingScript || topic}"

Platform: ${platCfg.name}
Tone: ${tone}

Diagnose what's weak and fix it. Rewrite the full piece with specific improvements.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes.

{
  "diagnosis": {
    "whatWorked": "<what was already good in the original>",
    "mainWeaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "hookStrength": "<assessment of the original hook and why it works or doesn't>"
  },
  "improvedTitle": "<better title>",
  "improvedHook": "<rewritten opening — stronger, more compelling>",
  "refinedScript": "<the full rewritten/refined content — every section improved>",
  "keyChanges": ["<specific change made and why 1>", "<change 2>", "<change 3>"],
  "retentionImprovements": ["<specific retention device added>", "<device 2>"]
}`;
    }

    // ── SCRIPT_ONLY mode ───────────────────────────────────────────────────
    else if (validMode === "script_only") {
      userPrompt = `Write a clean, production-ready script for:
Topic: "${topic}"
Platform: ${platCfg.name}

Write the complete script with natural section breaks. Real content. Production ready.

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes.

{
  "title": "<title>",
  "estimatedRuntime": "<runtime>",
  "wordCount": <integer>,
  "script": "<the complete word-for-word script — natural language, production ready, with [B-ROLL: description] notes inline where helpful>",
  "keyMoments": [
    { "timestamp": "<e.g. 3:45>", "note": "<important moment — retention hook, CTA, key reveal>" }
  ]
}`;
    }

    // ── CALL CLAUDE ─────────────────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  8000,
      temperature: 0.6,
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
      catch { result = { error: "Script generation failed. Please try again.", title: "", script: { sections: [], fullScriptText: "" } }; }
    }

    // ── DEDUCT + TRACK ───────────────────────────────────────────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "content-studio/generate", {
      mode: validMode, platform, processingMs,
    });
    await trackToolUsage({
      toolId: TOOL_ID, toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs, tokenCost: TOKEN_COST, wasSuccess: true,
    });

    return NextResponse.json({
      ok: true, result, mode: validMode,
      metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST },
    });

  } catch (err: any) {
    console.error("[content-studio/generate] Error:", err);
    try {
      await trackToolUsage({
        toolId: TOOL_ID, toolName: TOOL_NAME,
        ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start,
        wasSuccess: false, errorMsg: err.message,
      });
    } catch {}
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
  }
}