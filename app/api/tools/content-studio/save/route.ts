// =============================================================================
// isaacpaha.com — Content Studio AI — Save / Workspace API
// app/api/tools/content-studio/save/route.ts
//
// GET    → fetch all saved projects + workspace stats
// POST   → save a full project result
// DELETE ?id=xxx → delete project
// PATCH  ?id=xxx&action=star|notes|status|title|published
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ projects: [], workspace: null });

  const [projects, workspace] = await Promise.all([
    prismadb.contentStudioProject.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { updatedAt: "desc" },
      take:    30,
    }),
    prismadb.contentStudioWorkspace.findUnique({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ projects, workspace });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { topic, platform, tone, targetLength, targetAudience, creatorStyle, niche, keyPoints, result } = body;

  if (!result) return NextResponse.json({ error: "result required" }, { status: 400 });

  const count = await prismadb.contentStudioProject.count({ where: { userId: user.id, isSaved: true } });
  if (count >= 30) {
    return NextResponse.json({ error: "30 saved projects limit reached. Delete an older one first." }, { status: 429 });
  }

  const PLATFORM_MAP: Record<string, string> = {
    YOUTUBE_LONG: "YOUTUBE_LONG", YOUTUBE_SHORT: "YOUTUBE_SHORT", TIKTOK: "TIKTOK",
    INSTAGRAM_REELS: "INSTAGRAM_REELS", LINKEDIN_VIDEO: "LINKEDIN_VIDEO", LINKEDIN_POST: "LINKEDIN_POST",
    TWITTER_THREAD: "TWITTER_THREAD", PODCAST_EPISODE: "PODCAST_EPISODE",
    BLOG_POST: "BLOG_POST", NEWSLETTER: "NEWSLETTER",
  };
  const TONE_MAP: Record<string, string> = {
    EDUCATIONAL: "EDUCATIONAL", ENTERTAINING: "ENTERTAINING", INSPIRATIONAL: "INSPIRATIONAL",
    CONTROVERSIAL: "CONTROVERSIAL", STORYTELLING: "STORYTELLING", NEWS_COMMENTARY: "NEWS_COMMENTARY",
    TUTORIAL: "TUTORIAL", VLOG: "VLOG",
  };

  const wordCount = result.contentBrief?.wordCount
    ?? result.script?.fullScriptText?.split(/\s+/).length
    ?? 0;

  const saved = await prismadb.contentStudioProject.create({
    data: {
      userId:          user.id,
      topic:           (topic ?? "").slice(0, 1000),
      platform:        (PLATFORM_MAP[platform] ?? "YOUTUBE_LONG") as any,
      tone:            (TONE_MAP[tone] ?? "EDUCATIONAL") as any,
      targetLength:    (targetLength ?? "").slice(0, 100) || null,
      targetAudience:  (targetAudience ?? "").slice(0, 300) || null,
      creatorStyle:    (creatorStyle ?? "").slice(0, 500) || null,
      niche:           (niche ?? "").slice(0, 200) || null,
      keyPoints:       (keyPoints ?? "").slice(0, 1000) || null,
      resultJson:      JSON.stringify(result),
      title:           (result.title ?? result.seoTitle ?? "").slice(0, 500) || null,
      hookText:        (result.hook?.openingLine ?? result.hook ?? result.hookTweet ?? "").slice(0, 500) || null,
      wordCount,
      estimatedRuntime: result.contentBrief?.estimatedRuntime ?? result.estimatedRuntime ?? null,
      isSaved:          true,
      status:           "DRAFT",
    },
  });

  await upsertWorkspace(user.id, platform, tone, wordCount);
  return NextResponse.json({ ok: true, projectId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.contentStudioProject.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const action = sp.get("action");
  const body   = await req.json();

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const STATUS_MAP: Record<string, string> = {
    DRAFT: "DRAFT", IN_PRODUCTION: "IN_PRODUCTION", FILMED: "FILMED",
    EDITED: "EDITED", PUBLISHED: "PUBLISHED",
  };

  if (action === "star") {
    await prismadb.contentStudioProject.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "notes") {
    await prismadb.contentStudioProject.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "status") {
    const statusVal = STATUS_MAP[body.status] ?? "DRAFT";
    await prismadb.contentStudioProject.updateMany({
      where: { id, userId: user.id },
      data: { status: statusVal as any, ...(statusVal === "PUBLISHED" ? { publishedUrl: body.url ?? null } : {}) },
    });
    if (statusVal === "PUBLISHED") {
      await prismadb.contentStudioWorkspace.updateMany({
        where: { userId: user.id },
        data:  { publishedCount: { increment: 1 } },
      });
    }
  } else if (action === "title") {
    await prismadb.contentStudioProject.updateMany({ where: { id, userId: user.id }, data: { title: body.title?.slice(0, 500) ?? null } });
  } else if (action === "published") {
    await prismadb.contentStudioProject.updateMany({
      where: { id, userId: user.id },
      data:  { status: "PUBLISHED", publishedUrl: body.url ?? null },
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Workspace upsert ─────────────────────────────────────────────────────────
async function upsertWorkspace(userId: string, platform: string, tone: string, wordCount: number) {
  const existing = await prismadb.contentStudioWorkspace.findUnique({ where: { userId } });

  if (!existing) {
    await prismadb.contentStudioWorkspace.create({
      data: {
        userId,
        totalProjects:   1,
        totalWords:      wordCount,
        xpPoints:        30,
        streakDays:      1,
        lastActivityDate: new Date(),
        platformsJson:   JSON.stringify([{ platform, count: 1 }]),
        tonesJson:       JSON.stringify([{ tone, count: 1 }]),
      },
    });
    return;
  }

  // Update platforms
  let platforms: { platform: string; count: number }[] = [];
  try { platforms = JSON.parse(existing.platformsJson ?? "[]"); } catch {}
  const pf = platforms.find(p => p.platform === platform);
  if (pf) pf.count += 1; else platforms.push({ platform, count: 1 });

  // Update tones
  let tones: { tone: string; count: number }[] = [];
  try { tones = JSON.parse(existing.tonesJson ?? "[]"); } catch {}
  const tn = tones.find(t => t.tone === tone);
  if (tn) tn.count += 1; else tones.push({ tone, count: 1 });

  // Streak
  const lastDate  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay   = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  await prismadb.contentStudioWorkspace.update({
    where: { userId },
    data: {
      totalProjects:   { increment: 1 },
      totalWords:      { increment: wordCount },
      xpPoints:        { increment: 30 + (newStreak > 1 ? 10 : 0) },
      streakDays:      newStreak,
      lastActivityDate: new Date(),
      platformsJson:   JSON.stringify(platforms),
      tonesJson:       JSON.stringify(tones),
    },
  });
}