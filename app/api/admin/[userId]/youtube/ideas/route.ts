// =============================================================================
// API: /api/admin/[userId]/youtube/ideas
// GET  — list ideas from the bank (with filters)
// POST — generate new ideas via Claude AI
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import Anthropic                      from "@anthropic-ai/sdk";
import { auth }                       from "@clerk/nextjs/server";

import { prismadb }                   from "@/lib/db";
import {
  getOrCreateProfile,
  createIdeas,
  getIdeasForProfile,
  getTopicMemory,
  logAiSession,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";
import {
  buildIdeasPrompt,
  parseAiJson,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL     = "claude-sonnet-4-20250514";

// ─── GET — list ideas ─────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const user = await prismadb.user.findFirst({
      where:  { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isAdmin && user.clerkId !== clerkId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await getOrCreateProfile(user.id);
    console.log("[GET /youtube/ideas] Fetching ideas for profile:", profile.id);

    const { searchParams } = new URL(req.url);
    const result = await getIdeasForProfile(profile.id, {
      saved:    searchParams.get("saved")    === "true" ? true : undefined,
      used:     searchParams.get("used")     === "true",
      page:     parseInt(searchParams.get("page")     || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
    });
    // console.log(`[GET /youtube/ideas] Retrieved ${result.data.length} ideas (total: ${result.total}) for profile ${profile.id}`);
    // console.log("All ideas in the database for this profile:", await prismadb.youtubeContentIdea.findMany({ where: { profileId: profile.id } }));

    // Parse JSON theme arrays before returning
    const ideas = result.data.map(i => ({
      ...i,
      themes: safeJsonParse<string[]>(i.themes, []),
    }));

    // console.log(`[GET /youtube/ideas] Parsed themes for ideas. Sample:`, ideas.slice(0, 3).map(i => ({ id: i.id, themes: i.themes })));

    return NextResponse.json({ 
    data: ideas,      // ← ideas array directly
    total: result.total 
  });


  } catch (error) {
    console.error("[youtube/ideas GET]", error);
    return NextResponse.json(
        { error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST — generate ideas via Claude ────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const startTime = Date.now();

  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const user = await prismadb.user.findFirst({
      where:  { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isAdmin && user.clerkId !== clerkId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await getOrCreateProfile(user.id);

    const body = await req.json();
    const {
      count          = 10,
      themes         = [],
      tone           = "calm",
      targetAudience = "young adults",
      avoidTopics    = [],
    } = body;

    if (count < 1 || count > 30) {
      return NextResponse.json(
        { error: "count must be between 1 and 30" },
        { status: 400 }
      );
    }

    // Topic memory for anti-repetition
    const topicMemory = await getTopicMemory(profile.id);

    // Build prompt
    const prompt = buildIdeasPrompt({
      count,
      themes:         themes.length > 0 ? themes : (safeJsonParse<string[]>(profile.coreThemes, [])),
      tone,
      targetAudience: targetAudience || profile.targetAudience || "young adults",
      topicMemory,
      avoidTopics,
    });

    // ── Call Claude (Anthropic SDK) ──────────────────────────────────────────
    let aiResponse: string | undefined;
    let wasSuccess  = true;
    let errorMessage: string | undefined;
    let parsedIdeas: Array<{
      title:          string;
      hook?:          string;
      angle?:         string;
      whyNow?:        string;
      targetEmotion?: string;
      themes?:        string[];
      difficulty?:    string;
      estimatedLength?: number;
    }> = [];

    try {
      const message = await anthropic.messages.create({
        model:       MODEL,
        max_tokens:  3000,
        temperature: 0.7,   // slightly higher for creative ideation
        messages:    [{ role: "user", content: prompt }],
      });

      aiResponse = message.content[0].type === "text"
        ? message.content[0].text
        : "";

      if (!aiResponse) throw new Error("AI response is empty");

      parsedIdeas = parseAiJson<typeof parsedIdeas>(aiResponse);

      if (!Array.isArray(parsedIdeas) || parsedIdeas.length === 0) {
        throw new Error("AI returned empty or invalid ideas array");
      }
    } catch (err) {
      wasSuccess   = false;
      errorMessage = err instanceof Error ? err.message : "Unknown AI error";
    }

    const durationMs = Date.now() - startTime;

    // Log AI session
    await logAiSession({
      profileId:   profile.id,
      sessionType: "ideas",
      prompt,
      response:    aiResponse,
      modelUsed:   MODEL,
      durationMs,
      wasSuccess,
      errorMessage,
    });

    if (!wasSuccess) {
      return NextResponse.json(
        { error: errorMessage ?? "Ideas generation failed" },
        { status: 500 }
      );
    }

    // Save ideas to DB
    await createIdeas(
      parsedIdeas.map(idea => ({
        profileId:      profile.id,
        title:          idea.title,
        hook:           idea.hook,
        angle:          idea.angle,
        whyNow:         idea.whyNow,
        targetEmotion:  idea.targetEmotion,
        themes:         idea.themes,
        difficulty:     idea.difficulty,
        estimatedLength: idea.estimatedLength,
      }))
    );

    return NextResponse.json({
      data:    parsedIdeas,
      message: `Generated ${parsedIdeas.length} new ideas`,
    });

  } catch (error) {
    console.error("[youtube/ideas POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}