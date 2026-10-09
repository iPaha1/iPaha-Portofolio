// =============================================================================
// YouTube Content Studio — AI Prompt Builder
// lib/youtube/prompts.ts
// =============================================================================

import type { ContentTone, TopicMemoryEntry } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-types";

// ─── Weekly Batch Prompt ─────────────────────────────────────────────────────

export function buildWeeklyBatchPrompt(params: {
  videosPerWeek: number;
  tone: ContentTone;
  themes: string[];
  personalContext?: string;
  targetAudience?: string;
  topicMemory?: TopicMemoryEntry[];
  narrativeContext?: string;
}): string {
  const { videosPerWeek, tone, themes, personalContext, targetAudience, topicMemory } = params;

  const memorySection = topicMemory && topicMemory.length > 0
    ? `\n\nPREVIOUSLY COVERED TOPICS (do NOT repeat these — build on them):\n${
        topicMemory.slice(-15).map(t =>
          `- Week ${t.weekNumber}: "${t.title}" (concepts: ${t.coreConcepts.join(", ")})`
        ).join("\n")
      }\n\nThe next videos should feel like natural progression, not repetition.`
    : "";

  return `You are an elite YouTube content strategist and scriptwriter specialising in deep-thinking, talking-head channels focused on life philosophy and human potential.

CREATOR PROFILE:
- Channel tone: ${tone}
- Core themes: ${themes.join(", ")}
- Target audience: ${targetAudience || "young adults seeking clarity and growth"}
- Personal context: ${personalContext || "A thoughtful creator focused on life philosophy and self-development"}
${memorySection}

TASK: Generate ${videosPerWeek} complete, production-ready YouTube video packages.

REQUIREMENTS:
- Each video must be GENUINELY original — not generic self-help clichés
- Scripts should read as natural speech, not essays — use short punchy sentences
- Build a NARRATIVE THREAD across the ${videosPerWeek} videos (they should feel like a series)
- Hooks must earn attention in the first 3 seconds
- Closing lines must linger after the video ends
- SEO titles must be click-worthy but not clickbait

Return ONLY a valid JSON array with exactly ${videosPerWeek} objects. No markdown, no preamble, no trailing text.

Each object must have EXACTLY these keys:
{
  "title": "working title",
  "seoTitle": "optimised YouTube title, max 60 chars, emotionally charged",
  "hook": "word-for-word opening 30-45 seconds — must grab attention immediately",
  "intro": "intro section 30-45 seconds — contextualise the hook, set up the body",
  "body": "full body script 3-5 minutes — structured with clear flow, 3-4 main points",
  "perspectiveShift": "the reframe or unexpected insight — 30-45 seconds, this is the 'aha' moment",
  "closingLine": "single powerful line — 1-2 sentences max, must be memorable",
  "deliveryNotes": "how to speak this — pacing, energy arc, tone shifts, when to slow down",
  "pausePoints": ["array of exact moments in the script to pause for effect"],
  "emphasisPoints": ["array of specific words/phrases to deliver with weight"],
  "facialCues": "facial expression guidance — when to be serious, smile, look away, look direct",
  "energyArc": "how energy should build and release across the video",
  "cameraPosition": "camera setup — distance, angle, framing recommendation",
  "lightingSuggestion": "lighting setup that matches this video's mood",
  "bodyLanguageTips": "posture, hand gestures, movement guidance",
  "setDressing": "background and environment suggestions",
  "description": "full YouTube description — include 2-3 paragraph hooks, key timestamps as placeholders, hashtags, CTA",
  "tags": ["array of 12-15 relevant tags"],
  "thumbnailIdeas": ["3 different thumbnail text/concept ideas"],
  "category": "YouTube category (Education, Entertainment, etc)",
  "twitterPost": "X/Twitter post — punchy, 1-2 sentences max, drives curiosity",
  "linkedinPost": "LinkedIn post — professional tone, story-led, 3-4 paragraphs",
  "facebookPost": "Facebook post — conversational, community-focused",
  "tiktokCaption": "TikTok/Shorts caption — trending language, emojis ok, 150 chars max",
  "shortsCaption": "YouTube Shorts caption — clean, simple, value-focused",
  "coreConcepts": ["3-5 core philosophical concepts this video covers"],
  "topicFingerprint": ["5-8 keywords that uniquely identify this video's territory"]
}`;
}

// ─── Idea to Full Script Prompt ─────────────────────────────────────────────

export function buildIdeaToScriptPrompt(params: {
  title: string;
  angle?: string;
  hook?: string;
  whyNow?: string;
  themes?: string[];
  targetEmotion?: string;
  tone: ContentTone;
  estimatedLength: number;
  additionalNotes?: string;
  topicMemory?: TopicMemoryEntry[];
}): string {
  const { 
    title, 
    angle, 
    hook, 
    whyNow, 
    themes, 
    targetEmotion, 
    tone, 
    estimatedLength, 
    additionalNotes,
    topicMemory 
  } = params;

  const memorySection = topicMemory && topicMemory.length > 0
    ? `\n\nPREVIOUSLY COVERED TOPICS (avoid repeating these exact angles):\n${
        topicMemory.slice(-10).map(t =>
          `- "${t.title}" (concepts: ${t.coreConcepts.slice(0, 3).join(", ")})`
        ).join("\n")
      }`
    : "";

  return `You are an elite YouTube scriptwriter. Create a complete, ready-to-film video script based on this idea.

## VIDEO IDEA
Title: ${title}
${angle ? `Angle: ${angle}` : ''}
${hook ? `Hook concept: ${hook}` : ''}
${whyNow ? `Why Now: ${whyNow}` : ''}
Themes: ${themes?.join(', ') || 'General'}
Target Emotion: ${targetEmotion || 'Inspiring'}
Tone: ${tone}
Target Length: ~${estimatedLength} minutes
${additionalNotes ? `\nAdditional Instructions: ${additionalNotes}` : ''}
${memorySection}

## REQUIREMENTS
Generate a COMPLETE YouTube script with all sections below. Make it:
- Conversational and natural (write for speaking, not reading)
- Specific and original (avoid generic self-help clichés)
- Emotionally resonant (match the target emotion)
- Production-ready (can be filmed as written)

## OUTPUT FORMAT
Return ONLY valid JSON with this exact structure. No markdown, no extra text:

{
  "title": "${title} (or slightly refined version)",
  "hook": "The opening lines — must grab attention in first 10 seconds, 30-45 seconds total",
  "intro": "Set up the problem/promise — 30-45 seconds, include why this matters now",
  "body": "Main content — 3-5 minutes, structured with clear flow, specific examples, practical insights",
  "perspectiveShift": "The key reframe or 'aha moment' — 30-45 seconds, the unexpected insight",
  "closingLine": "Single memorable line — 1-2 sentences, leaves them thinking",
  "seoTitle": "Click-optimized YouTube title, max 60 chars, emotionally charged",
  "description": "Full YouTube description — hook paragraph, key timestamps (00:00, 01:30, etc), hashtags, CTA",
  "tags": ["12-15 relevant tags including broad and specific keywords"],
  "thumbnailIdeas": ["3 different thumbnail text/concept ideas", "...", "..."],
  "twitterPost": "X/Twitter post — punchy, 1-2 sentences, creates curiosity, under 280 chars",
  "linkedinPost": "LinkedIn post — professional, story-led, 3-4 paragraphs with line breaks",
  "tiktokCaption": "TikTok/Shorts caption — trending language, emojis ok, max 150 chars",
  "shortsCaption": "YouTube Shorts caption — clean, value-focused, includes 2-3 hashtags",
  "deliveryNotes": "How to speak this — pacing, energy arc, tone shifts, emotional moments",
  "pausePoints": ["Specific moments to pause for effect (3-5 points)"],
  "facialCues": "Facial expression guidance — when to be serious, smile, look away, lean in",
  "cameraPosition": "Camera setup — distance, angle, framing (e.g., 'Medium close-up, slightly off-center')",
  "lightingSuggestion": "Lighting setup that matches the mood — e.g., 'Soft key light with subtle shadows for depth'",
  "bodyLanguageTips": "Posture, hand gestures, movement guidance for key moments",
  "coreConcepts": ["3-5 key philosophical concepts or takeaways from this video"],
  "topicFingerprint": ["5-8 unique keywords that identify this video's specific angle"]
}`;
}

// ─── Ideas Generation Prompt ──────────────────────────────────────────────────

export function buildIdeasPrompt(params: {
  count: number;
  themes: string[];
  tone: ContentTone;
  targetAudience: string;
  topicMemory?: TopicMemoryEntry[];
  avoidTopics?: string[];
}): string {
  const { count, themes, tone, targetAudience, topicMemory, avoidTopics } = params;

  const avoidSection = [
    ...(topicMemory?.slice(-20).map(t => t.title) ?? []),
    ...(avoidTopics ?? []),
  ];

  return `You are a YouTube content strategist specialising in deep-thinking talking-head channels.

Generate ${count} ORIGINAL video ideas for a channel focused on: ${themes.join(", ")}
Tone: ${tone}
Audience: ${targetAudience}

${avoidSection.length > 0 ? `AVOID ideas similar to these already covered topics:\n${avoidSection.map(t => `- ${t}`).join("\n")}\n\n` : ""}

Return ONLY a valid JSON array. No markdown, no extra text.

Each object:
{
  "title": "compelling, specific video title",
  "hook": "the opening line that would grab attention",
  "angle": "the unique perspective or angle — what makes this different from generic advice",
  "whyNow": "why this idea is timely or resonant for the target audience right now",
  "targetEmotion": "the primary emotion this video should evoke (e.g. 'empowered', 'challenged', 'seen')",
  "themes": ["relevant theme categories from: Life Understanding, Self-Belief, Confidence, Values, Mindset, Relationships, Career, Money, Purpose"],
  "difficulty": "easy | medium | deep",
  "estimatedLength": 8
}`;
}

// ─── Section Regeneration Prompt ─────────────────────────────────────────────

export function buildSectionRegenPrompt(params: {
  section: string;
  currentContent: string;
  videoTitle: string;
  tone: ContentTone;
  instruction?: string;
}): string {
  const { section, currentContent, videoTitle, tone, instruction } = params;
  return `You are rewriting a single section of a YouTube script.

Video title: "${videoTitle}"
Tone: ${tone}
Section: ${section}
Current content:
"""
${currentContent}
"""

${instruction ? `Special instruction: ${instruction}\n\n` : ""}Rewrite ONLY this section. Make it more impactful, natural, and specific.
Return ONLY the new section text — no preamble, no labels, no JSON.`;
}

// ─── Social Posts Regeneration ────────────────────────────────────────────────

export function buildSocialPostsPrompt(params: {
  videoTitle: string;
  seoTitle: string;
  hook: string;
  coreConcepts: string[];
  targetAudience: string;
}): string {
  const { videoTitle, seoTitle, hook, coreConcepts, targetAudience } = params;
  return `Create social media posts to promote a YouTube video.

Video: "${seoTitle}"
Opening hook: "${hook}"
Core concepts: ${coreConcepts.join(", ")}
Target audience: ${targetAudience}

Return ONLY valid JSON with exactly these keys (no markdown):
{
  "twitterPost": "punchy 1-2 sentence X/Twitter post, creates curiosity",
  "linkedinPost": "professional 3-paragraph LinkedIn post, story-led",
  "facebookPost": "conversational Facebook post, community-focused",
  "tiktokCaption": "TikTok caption max 150 chars, trending language",
  "shortsCaption": "YouTube Shorts caption, clean and value-focused"
}`;
}

// ─── Channel Name & Branding Prompt ──────────────────────────────────────────

export function buildChannelBrandingPrompt(params: {
  creatorName: string;
  themes: string[];
  targetAudience: string;
  creatorBio?: string;
}): string {
  const { creatorName, themes, targetAudience, creatorBio } = params;
  return `Generate YouTube channel branding suggestions for a creator.

Creator: ${creatorName}
Themes: ${themes.join(", ")}
Audience: ${targetAudience}
Bio: ${creatorBio || "Not provided"}

Return ONLY valid JSON:
{
  "channelNameOptions": ["5 channel name options"],
  "taglineOptions": ["5 tagline options"],
  "descriptionDraft": "full channel description for YouTube About section",
  "niche": "specific niche positioning statement",
  "contentPillars": ["4-5 core content pillars"],
  "uniqueSellingPoint": "what makes this channel different"
}`;
}

// ─── Script Score / Quality Assessment ───────────────────────────────────────

export function buildScriptScorePrompt(script: string, videoTitle: string): string {
  return `You are a YouTube content quality assessor. Score this script objectively.

Title: "${videoTitle}"
Script:
"""
${script.slice(0, 3000)}
"""

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "hookStrength": 0-100,
  "clarity": 0-100,
  "originality": 0-100,
  "deliverability": 0-100,
  "seoStrength": 0-100,
  "feedback": "2-3 sentence overall assessment",
  "topStrengths": ["2-3 specific strengths"],
  "improvements": ["2-3 specific improvements"]
}`;
}

// ─── Narrative Arc Analysis ───────────────────────────────────────────────────

export function buildNarrativeArcPrompt(
  pastVideos: Array<{ title: string; coreConcepts: string[]; weekNumber: number }>
): string {
  return `Analyse the narrative arc of this YouTube channel and suggest the next video direction.

Past videos (chronological):
${pastVideos.map(v => `- Week ${v.weekNumber}: "${v.title}" | Concepts: ${v.coreConcepts.join(", ")}`).join("\n")}

Return ONLY valid JSON:
{
  "arcSummary": "2-sentence summary of the channel's developing narrative",
  "currentTheme": "the dominant theme building right now",
  "narrativeGap": "what concept or perspective has NOT been addressed yet",
  "nextVideoDirection": "specific direction for the next video",
  "suggestedTitle": "suggested title for the next video",
  "reasoning": "why this direction makes sense as the next step"
}`;
}

// ─── JSON parse helper ────────────────────────────────────────────────────────

export function parseAiJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}