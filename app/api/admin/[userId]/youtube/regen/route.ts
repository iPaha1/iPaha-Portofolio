// =============================================================================
// API: /api/admin/[userId]/youtube/regen
// POST — Regenerate a script section or social posts via Claude AI
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { auth }                      from "@clerk/nextjs/server";

import { prismadb }                  from "@/lib/db";
import {
  buildSectionRegenPrompt,
  buildSocialPostsPrompt,
  parseAiJson,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL     = "claude-sonnet-4-20250514";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    if (userId !== clerkId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      videoId,
      section,
      currentContent,
      videoTitle,
      tone,
      instruction,
      type,
    } = body;

    // ── Build prompt ─────────────────────────────────────────────────────────
    const prompt = type === "social_posts"
      ? buildSocialPostsPrompt({
          videoTitle,
          seoTitle:       body.seoTitle,
          hook:           body.hook,
          coreConcepts:   body.coreConcepts   || [],
          targetAudience: body.targetAudience || "young adults",
        })
      : buildSectionRegenPrompt({
          section,
          currentContent,
          videoTitle,
          tone,
          instruction,
        });

    // ── Call Claude (Anthropic SDK) ──────────────────────────────────────────
    const message = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 2000,
      messages:   [{ role: "user", content: prompt }],
    });

    const result = message.content[0].type === "text"
      ? message.content[0].text.trim()
      : "";
      console.log(`[youtube/regen] Claude response for video ${videoId}, section ${section}:`, result);

    // ── Persist section update to DB ─────────────────────────────────────────
    if (videoId && type !== "social_posts") {
      const fieldMap: Record<string, string> = {
        HOOK:             "hook",
        INTRO:            "intro",
        BODY:             "body",
        PERSPECTIVE_SHIFT: "perspectiveShift",
        CLOSING:          "closingLine",
      };
      const field = fieldMap[section];
      if (field) {
        await prismadb.youtubeVideo.update({
          where: { id: videoId },
          data:  { [field]: result, isEdited: true, editedAt: new Date() },
        });
      }
    }

    const parsed = type === "social_posts" ? parseAiJson(result) : result;
    console.log(`[youtube/regen] Parsed result for video ${videoId}, section ${section}:`, parsed);
    return NextResponse.json({ data: parsed });

  } catch (error) {
    console.error("[youtube/regen POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}