// =============================================================================
// API: /api/admin/[userId]/youtube/generate-from-idea
// POST — Generate a full video script from an existing idea via Claude AI
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";

import { prismadb } from "@/lib/db";
import type {
  GeneratedVideoPackage,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-types";
import { buildIdeaToScriptPrompt, parseAiJson } from "@/lib/youtube/prompts";
import { appendTopicMemory, createVideo, getOrCreateProfile, getTopicMemory, logAiSession } from "@/lib/youtube/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-sonnet-4-20250514";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const startTime = Date.now();

  try {
    const { userId } = await params;

    // ── Auth ───────────────────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Request body ───────────────────────────────────────────────────────
    const body = await req.json();
    const {
      ideaId,
      title,
      angle,
      hook,
      whyNow,
      themes = [],
      targetEmotion,
      tone = "calm",
      estimatedLength = 8,
      additionalNotes,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // ── Profile + topic memory ──────────────────────────────────────────────
    const profile = await getOrCreateProfile(user.id);
    const topicMemory = await getTopicMemory(profile.id);

    // ── Build prompt ────────────────────────────────────────────────────────
    const prompt = buildIdeaToScriptPrompt({
      title,
      angle,
      hook,
      whyNow,
      themes,
      targetEmotion,
      tone,
      estimatedLength,
      additionalNotes,
      topicMemory,
    });

    // ── Call Claude (Anthropic SDK) ────────────────────────────────────────
    let aiResponse: string | undefined;
    let generatedVideo: GeneratedVideoPackage | null = null;
    let wasSuccess = true;
    let errorMessage: string | undefined;

    try {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      });

      aiResponse = message.content[0].type === "text"
        ? message.content[0].text
        : "";

      if (!aiResponse) throw new Error("AI response is empty");

      generatedVideo = parseAiJson<GeneratedVideoPackage>(aiResponse);

      if (!generatedVideo || typeof generatedVideo !== 'object') {
        throw new Error("AI returned invalid video object");
      }
    } catch (err) {
      wasSuccess = false;
      errorMessage = err instanceof Error ? err.message : "Unknown AI error";
    }

    const durationMs = Date.now() - startTime;

    // ── Log AI session ──────────────────────────────────────────────────────
    await logAiSession({
      profileId: profile.id,
      sessionType: "single_video",
      prompt,
      response: aiResponse,
      modelUsed: MODEL,
      durationMs,
      wasSuccess,
      errorMessage,
    });

    if (!wasSuccess || !generatedVideo) {
      return NextResponse.json(
        { error: errorMessage ?? "AI generation failed" },
        { status: 500 }
      );
    }

    // ── Save video to DB ───────────────────────────────────────────────────
    const savedVideo = await createVideo({
      profileId: profile.id,
      title: generatedVideo.title || title,
      orderInBatch: 0,
      hook: generatedVideo.hook,
      intro: generatedVideo.intro,
      body: generatedVideo.body,
      perspectiveShift: generatedVideo.perspectiveShift,
      closingLine: generatedVideo.closingLine,
      fullScript: [generatedVideo.hook, generatedVideo.intro, generatedVideo.body, generatedVideo.perspectiveShift, generatedVideo.closingLine]
        .filter(Boolean)
        .join("\n\n"),
      toneNotes: generatedVideo.deliveryNotes,
      pausePoints: generatedVideo.pausePoints,
      emphasisPoints: generatedVideo.emphasisPoints,
      facialCues: generatedVideo.facialCues,
      energyArc: generatedVideo.energyArc,
      cameraPosition: generatedVideo.cameraPosition,
      lightingSuggestion: generatedVideo.lightingSuggestion,
      bodyLanguageTips: generatedVideo.bodyLanguageTips,
      setDressing: generatedVideo.setDressing,
      seoTitle: generatedVideo.seoTitle,
      description: generatedVideo.description,
      tags: generatedVideo.tags,
      thumbnailTextIdeas: generatedVideo.thumbnailIdeas,
      category: generatedVideo.category,
      twitterPost: generatedVideo.twitterPost,
      linkedinPost: generatedVideo.linkedinPost,
      facebookPost: generatedVideo.facebookPost,
      tiktokCaption: generatedVideo.tiktokCaption,
      shortsCaption: generatedVideo.shortsCaption,
      coreConcepts: generatedVideo.coreConcepts,
      topicFingerprint: generatedVideo.topicFingerprint,
    });

    // ── Mark idea as used ───────────────────────────────────────────────────
    if (ideaId) {
      await prismadb.youtubeContentIdea.update({
        where: { id: ideaId },
        data: { isUsed: true, usedInVideoId: savedVideo.id },
      });
    }

    // ── Update topic memory (anti-repetition) ───────────────────────────────
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const year = now.getFullYear();

    await appendTopicMemory(
      profile.id,
      [{
        id: savedVideo.id,
        title: savedVideo.title,
        coreConcepts: generatedVideo.coreConcepts ?? [],
        weekNumber,
        year,
        createdAt: now.toISOString(),
      }]
    );

    // ── Update profile stats ────────────────────────────────────────────────
    await prismadb.youtubeCreatorProfile.update({
      where: { id: profile.id },
      data: { totalVideos: { increment: 1 } },
    });

    // ── Return ──────────────────────────────────────────────────────────────
    return NextResponse.json({
      data: {
        ...savedVideo,
        pausePoints: safeJsonParse(savedVideo.pausePoints, []),
        emphasisPoints: safeJsonParse(savedVideo.emphasisPoints, []),
        tags: safeJsonParse(savedVideo.tags, []),
        thumbnailTextIdeas: safeJsonParse(savedVideo.thumbnailTextIdeas, []),
        coreConcepts: safeJsonParse(savedVideo.coreConcepts, []),
        topicFingerprint: safeJsonParse(savedVideo.topicFingerprint, []),
      },
      message: `Successfully generated video "${savedVideo.title}" from idea`,
    });

  } catch (error) {
    console.error("[youtube/generate-from-idea POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}