// =============================================================================
// app/api/admin/[userId]/youtube/narrative/route.ts
// GET — AI narrative arc analysis across published videos
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { auth }                      from "@clerk/nextjs/server";

import { prismadb }                  from "@/lib/db";
import { getOrCreateProfile }        from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";
import {
  buildNarrativeArcPrompt,
  parseAiJson,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL     = "claude-sonnet-4-20250514";

function safeJsonParse<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const user = await prismadb.user.findFirst({
      where:  { OR: [{ id: userId }, { clerkId }] },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const profile = await getOrCreateProfile(user.id);

    const videos = await prismadb.youtubeVideo.findMany({
      where:   { profileId: profile.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "asc" },
      take:    15,
      select:  { title: true, coreConcepts: true, publishedAt: true },
    });

    if (videos.length < 2) {
      return NextResponse.json({
        data: {
          arcSummary:         "Publish at least 2 videos to unlock narrative arc analysis.",
          currentTheme:       null,
          narrativeGap:       null,
          nextVideoDirection: null,
          suggestedTitle:     null,
          reasoning:          null,
        },
      });
    }

    const prompt = buildNarrativeArcPrompt(
      videos.map((v, i) => ({
        title:        v.title,
        coreConcepts: safeJsonParse<string[]>(v.coreConcepts, []),
        weekNumber:   i + 1,
      }))
    );

    // ── Call Claude (Anthropic SDK) ──────────────────────────────────────────
    const message = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 800,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    const arc = parseAiJson(text);
    return NextResponse.json({ data: arc });

  } catch (error) {
    console.error("[youtube/narrative GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}