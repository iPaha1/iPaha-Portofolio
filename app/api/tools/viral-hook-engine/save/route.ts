// =============================================================================
// isaacpaha.com — Viral Hook Engine — Save / Workspace API
// app/api/tools/viral-hook-engine/save/route.ts
//
// GET    → fetch saved queries + workspace for signed-in user
// POST   → save a full query result
// DELETE ?id=xxx → delete a saved query
// PATCH  ?id=xxx&action=star|notes|chosenHook|saveHook|removeHook|addToCalendar
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ queries: [], workspace: null });

  const [queries, workspace] = await Promise.all([
    prismadb.viralHookQuery.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { createdAt: "desc" },
      take:    30,
    }),
    prismadb.creatorWorkspace.findUnique({ where: { userId: user.id } }),
  ]);
  console.log("Fetched workspace:", workspace);

  return NextResponse.json({ queries, workspace });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sp   = new URL(req.url).searchParams;
  const type = sp.get("type");
  const body = await req.json();

  // ── Save a hook to workspace ─────────────────────────────────────────────
  if (type === "hook") {
    const { hook } = body;
    console.log("Saving hook to workspace:", hook);
    if (!hook) return NextResponse.json({ error: "hook required" }, { status: 400 });

    const ws = await prismadb.creatorWorkspace.findUnique({ where: { userId: user.id } });
    console.log("Current workspace:", ws);
    let saved: any[] = [];
    try { saved = JSON.parse(ws?.savedHooksJson ?? "[]"); } catch {}
    // Prevent duplicates
    if (!saved.find((h: any) => h.hook === hook.hook)) {
      saved.unshift({ ...hook, savedAt: new Date().toISOString() });
      if (saved.length > 50) saved = saved.slice(0, 50); // cap at 50
    }
    await upsertWorkspace(user.id, { savedHooksJson: JSON.stringify(saved) });
    return NextResponse.json({ ok: true });
  }

  // ── Add idea to content calendar ─────────────────────────────────────────
  if (type === "calendar") {
    const { idea } = body;
    if (!idea) return NextResponse.json({ error: "idea required" }, { status: 400 });

    const ws = await prismadb.creatorWorkspace.findUnique({ where: { userId: user.id } });
    let calendar: any[] = [];
    try { calendar = JSON.parse(ws?.contentCalendar ?? "[]"); } catch {}
    calendar.unshift({ ...idea, addedAt: new Date().toISOString(), status: "idea" });
    if (calendar.length > 30) calendar = calendar.slice(0, 30);
    await upsertWorkspace(user.id, { contentCalendar: JSON.stringify(calendar) });
    return NextResponse.json({ ok: true });
  }

  // ── Save a full query result ──────────────────────────────────────────────
  const { idea, platform, niche, targetAudience, contentFormat, result } = body;
  if (!result) return NextResponse.json({ error: "result required" }, { status: 400 });

  const count = await prismadb.viralHookQuery.count({ where: { userId: user.id, isSaved: true } });
  if (count >= 30) {
    return NextResponse.json({ error: "30 saved analyses limit reached. Delete an older one first." }, { status: 429 });
  }

  const PLATFORM_MAP: Record<string, string> = {
    YOUTUBE: "YOUTUBE", TIKTOK: "TIKTOK", INSTAGRAM_REELS: "INSTAGRAM_REELS",
    TWITTER_X: "TWITTER_X", LINKEDIN: "LINKEDIN", PODCAST: "PODCAST",
    NEWSLETTER: "NEWSLETTER", BLOG: "BLOG",
  };
  const TIER_MAP: Record<string, string> = {
    SLEEPER: "SLEEPER", DECENT: "DECENT", STRONG: "STRONG", HOT: "HOT", EXPLOSIVE: "EXPLOSIVE",
  };

  const saved = await prismadb.viralHookQuery.create({
    data: {
      userId:          user.id,
      originalIdea:    (idea ?? "").slice(0, 1000),
      platform:        (PLATFORM_MAP[platform] ?? "YOUTUBE") as any,
      niche:           (niche ?? "").slice(0, 300) || null,
      targetAudience:  (targetAudience ?? "").slice(0, 300) || null,
      contentFormat:   (contentFormat ?? "").slice(0, 200) || null,
      resultJson:      JSON.stringify(result),
      viralityScore:   result.viralityScore ?? null,
      viralityTier:    (TIER_MAP[result.viralityTier] ?? null) as any,
      hooksGenerated:  result.hooks?.length ?? 0,
      isSaved:         true,
    },
  });

  await upsertWorkspace(user.id, { totalQueries: { increment: 1 }, hooksGenerated: { increment: result.hooks?.length ?? 0 } }, platform);
  return NextResponse.json({ ok: true, queryId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.viralHookQuery.deleteMany({ where: { id, userId: user.id } });
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

  if (action === "star" && id) {
    await prismadb.viralHookQuery.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "notes" && id) {
    await prismadb.viralHookQuery.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "chosenHook" && id) {
    await prismadb.viralHookQuery.updateMany({ where: { id, userId: user.id }, data: { chosenHookIndex: body.index ?? null } });
  } else if (action === "nicheProfile") {
    await upsertWorkspace(user.id, { nicheProfileJson: JSON.stringify(body.profile) });
  } else if (action === "removeHook") {
    // Remove a saved hook from workspace by hook text
    const ws = await prismadb.creatorWorkspace.findUnique({ where: { userId: user.id } });
    let saved: any[] = [];
    try { saved = JSON.parse(ws?.savedHooksJson ?? "[]"); } catch {}
    saved = saved.filter((h: any) => h.hook !== body.hook);
    await upsertWorkspace(user.id, { savedHooksJson: JSON.stringify(saved) });
  } else if (action === "updateCalendarItem") {
    const ws = await prismadb.creatorWorkspace.findUnique({ where: { userId: user.id } });
    let calendar: any[] = [];
    try { calendar = JSON.parse(ws?.contentCalendar ?? "[]"); } catch {}
    calendar = calendar.map((item: any) =>
      item.addedAt === body.addedAt ? { ...item, ...body.updates } : item
    );
    await upsertWorkspace(user.id, { contentCalendar: JSON.stringify(calendar) });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Workspace upsert ─────────────────────────────────────────────────────────
async function upsertWorkspace(userId: string, data: any, platform?: string) {
  const existing = await prismadb.creatorWorkspace.findUnique({ where: { userId } });

  if (!existing) {
    const platforms = platform ? JSON.stringify([{ platform, count: 1 }]) : "[]";

    // Extract any increment values for CREATE (we use the actual number instead)
    const totalQueriesValue = data.totalQueries?.increment ?? data.totalQueries ?? 1;
    const hooksGeneratedValue = data.hooksGenerated?.increment ?? data.hooksGenerated ?? 0;
    
    await prismadb.creatorWorkspace.create({
      data: {
        userId,

        // ← Always provide these required fields
        savedHooksJson: "[]",
        contentCalendar: "[]",
        nicheProfileJson: null,        // or "{}" if you prefer
        
        totalQueries:    totalQueriesValue,
        hooksGenerated:  hooksGeneratedValue,
        xpPoints:        20,
        streakDays:      1,
        lastActivityDate: new Date(),
        platformsJson:   platforms,

        // Spread the rest (but skip the increment objects)
        ...Object.fromEntries(
          Object.entries(data).filter(([key]) => 
            !["totalQueries", "hooksGenerated"].includes(key)
          )
        ),

        // ...data,
      },
    });
    return;
  }

  // Update platforms
  if (platform) {
    let platforms: { platform: string; count: number }[] = [];
    try { platforms = JSON.parse(existing.platformsJson || "[]"); } catch {}
    const found = platforms.find(p => p.platform === platform);
    if (found) found.count += 1;
    else platforms.push({ platform, count: 1 });
    data.platformsJson = JSON.stringify(platforms);
  }

  // Streak
  const lastDate  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay   = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  // Extract increment fields
  const { increment: _, ...directData } = data;

  await prismadb.creatorWorkspace.update({
    where: { userId },
    data: {
      streakDays:      newStreak,
      lastActivityDate: new Date(),
      xpPoints:        { increment: 20 + (newStreak > 1 ? 5 : 0) },
    //   ...(data.totalQueries  ? { totalQueries:  data.totalQueries  } : {}),
    //   ...(data.hooksGenerated ? { hooksGenerated: data.hooksGenerated } : {}),

    // Only apply increment if it was passed as { increment: X }
      ...(data.totalQueries?.increment !== undefined 
        ? { totalQueries: data.totalQueries } 
        : {}),
      ...(data.hooksGenerated?.increment !== undefined 
        ? { hooksGenerated: data.hooksGenerated } 
        : {}),

      ...Object.fromEntries(
        Object.entries(directData).filter(([k]) =>
          !["totalQueries", "hooksGenerated"].includes(k)
        )
      ),
    },
  });
}