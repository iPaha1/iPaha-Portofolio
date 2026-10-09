// =============================================================================
// API: /api/admin/[userId]/youtube/generate
// POST — Generate a full weekly content batch via Claude AI
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { auth }                      from "@clerk/nextjs/server";

import { prismadb } from "@/lib/db";
import {
  getOrCreateProfile,
  createWeeklyBatch,
  updateBatchStatus,
  createVideo,
  appendTopicMemory,
  getTopicMemory,
  logAiSession,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";
import {
  buildWeeklyBatchPrompt,
  parseAiJson,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-prompts";
import type {
  GenerateWeeklyRequest,
  GeneratedVideoPackage,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL     = "claude-sonnet-4-20250514";

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
      where:  { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf  = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Request body ───────────────────────────────────────────────────────
    const body: GenerateWeeklyRequest = await req.json();
    const {
      videosPerWeek   = 3,
      tone            = "calm",
      themes          = [],
      personalContext,
      targetAudience,
    } = body;

    if (themes.length === 0) {
      return NextResponse.json(
        { error: "At least one theme is required" },
        { status: 400 }
      );
    }
    if (videosPerWeek < 1 || videosPerWeek > 7) {
      return NextResponse.json(
        { error: "videosPerWeek must be between 1 and 7" },
        { status: 400 }
      );
    }

    // ── Profile + topic memory ──────────────────────────────────────────────
    const profile     = await getOrCreateProfile(user.id);
    const topicMemory = await getTopicMemory(profile.id);

    // ── ISO week ────────────────────────────────────────────────────────────
    const now        = new Date();
    const weekNumber = getISOWeek(now);
    const year       = now.getFullYear();
    const weekLabel  = `Week ${weekNumber} · ${now.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;

    // ── Create batch record (status: GENERATING) ───────────────────────────
    const batch = await createWeeklyBatch({
      profileId:       profile.id,
      weekNumber,
      year,
      weekLabel,
      videosRequested: videosPerWeek,
      toneUsed:        tone.toUpperCase(),
      themesUsed:      themes,
      personalContext,
      targetAudience,
      modelUsed:       MODEL,
    });

    // ── Build prompt ────────────────────────────────────────────────────────
    const prompt = buildWeeklyBatchPrompt({
      videosPerWeek,
      tone,
      themes,
      personalContext,
      targetAudience,
      topicMemory,
    });

    // ── Call Claude (Anthropic SDK — matches your explain route pattern) ────
    let aiResponse: string | undefined;
    let videos: GeneratedVideoPackage[] = [];
    let wasSuccess  = true;
    let errorMessage: string | undefined;

    try {
      const message = await anthropic.messages.create({
        model:       MODEL,
        max_tokens:  8000,
        temperature: 0.4,
        messages:    [{ role: "user", content: prompt }],
      });

      aiResponse = message.content[0].type === "text"
        ? message.content[0].text
        : "";

      if (!aiResponse) throw new Error("AI response is empty");

      videos = parseAiJson<GeneratedVideoPackage[]>(aiResponse);

      if (!Array.isArray(videos) || videos.length === 0) {
        throw new Error("AI returned empty or invalid video array");
      }
    } catch (err) {
      wasSuccess   = false;
      errorMessage = err instanceof Error ? err.message : "Unknown AI error";
    }

    const durationMs = Date.now() - startTime;

    // ── Log AI session ──────────────────────────────────────────────────────
    await logAiSession({
      profileId:    profile.id,
      batchId:      batch.id,
      sessionType:  "weekly_batch",
      prompt,
      response:     aiResponse,
      modelUsed:    MODEL,
      durationMs,
      wasSuccess,
      errorMessage,
    });

    if (!wasSuccess) {
      await updateBatchStatus(batch.id, { status: "ARCHIVED" });
      return NextResponse.json(
        { error: errorMessage ?? "AI generation failed" },
        { status: 500 }
      );
    }

    // ── Save videos to DB ───────────────────────────────────────────────────
    const savedVideos = await Promise.all(
      videos.slice(0, videosPerWeek).map((v, idx) =>
        createVideo({
          batchId:          batch.id,
          profileId:        profile.id,
          title:            v.title,
          orderInBatch:     idx,
          hook:             v.hook,
          intro:            v.intro,
          body:             v.body,
          perspectiveShift: v.perspectiveShift,
          closingLine:      v.closingLine,
          fullScript:       [v.hook, v.intro, v.body, v.perspectiveShift, v.closingLine]
                              .filter(Boolean)
                              .join("\n\n"),
          toneNotes:        v.deliveryNotes,
          pausePoints:      v.pausePoints,
          emphasisPoints:   v.emphasisPoints,
          facialCues:       v.facialCues,
          energyArc:        v.energyArc,
          cameraPosition:   v.cameraPosition,
          lightingSuggestion: v.lightingSuggestion,
          bodyLanguageTips: v.bodyLanguageTips,
          setDressing:      v.setDressing,
          seoTitle:         v.seoTitle,
          description:      v.description,
          tags:             v.tags,
          thumbnailTextIdeas: v.thumbnailIdeas,
          category:         v.category,
          twitterPost:      v.twitterPost,
          linkedinPost:     v.linkedinPost,
          facebookPost:     v.facebookPost,
          tiktokCaption:    v.tiktokCaption,
          shortsCaption:    v.shortsCaption,
          coreConcepts:     v.coreConcepts,
          topicFingerprint: v.topicFingerprint,
        })
      )
    );

    // ── Finalise batch ──────────────────────────────────────────────────────
    await updateBatchStatus(batch.id, {
      status:      "READY",
      generatedAt: new Date(),
      generationMs: durationMs,
      totalVideos: savedVideos.length,
    });

    // ── Update topic memory (anti-repetition) ───────────────────────────────
    await appendTopicMemory(
      profile.id,
      videos.map((v, idx) => ({
        id:           savedVideos[idx].id,
        title:        v.title,
        coreConcepts: v.coreConcepts ?? [],
        weekNumber,
        year,
        createdAt:    new Date().toISOString(),
      }))
    );

    // ── Update profile stats ────────────────────────────────────────────────
    await prismadb.youtubeCreatorProfile.update({
      where: { id: profile.id },
      data:  { totalVideos: { increment: savedVideos.length } },
    });

    // ── Return ──────────────────────────────────────────────────────────────
    return NextResponse.json({
      data: {
        batch: {
          id:           batch.id,
          weekLabel,
          weekNumber,
          year,
          status:       "READY",
          totalVideos:  savedVideos.length,
          generationMs: durationMs,
        },
        videos: savedVideos.map((sv, idx) => ({
          ...sv,
          pausePoints:        safeJsonParse(sv.pausePoints,        []),
          emphasisPoints:     safeJsonParse(sv.emphasisPoints,     []),
          tags:               safeJsonParse(sv.tags,               []),
          thumbnailTextIdeas: safeJsonParse(sv.thumbnailTextIdeas, []),
          coreConcepts:       safeJsonParse(sv.coreConcepts,       []),
          topicFingerprint:   safeJsonParse(sv.topicFingerprint,   []),
          aiData:             videos[idx],
        })),
      },
      message: `Successfully generated ${savedVideos.length} videos for ${weekLabel}`,
    });

  } catch (error) {
    console.error("[youtube/generate POST]", error);
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