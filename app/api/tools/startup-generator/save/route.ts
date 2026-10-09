// =============================================================================
// isaacpaha.com — Startup Idea Generator — Save / Workspace API
// app/api/tools/startup-generator/save/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ ideas: [], workspace: null });

  const [ideas, workspace] = await Promise.all([
    prismadb.startupIdea.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { updatedAt: "desc" },
      take:    30,
    }),
    prismadb.startupIdeaWorkspace.findUnique({ where: { userId: user.id } }),
  ]);
  return NextResponse.json({ ideas, workspace });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    founderBackground, skills, interests, sector, ambitiousness,
    generationMode, locationContext, budgetContext, timeCommitment,
    avoidSectors, result, savedIdea, // savedIdea = the specific idea the user clicked Save on
  } = body;

  if (!result && !savedIdea) return NextResponse.json({ error: "result required" }, { status: 400 });

  const count = await prismadb.startupIdea.count({ where: { userId: user.id, isSaved: true } });
  if (count >= 30) return NextResponse.json({ error: "30 saved ideas limit reached." }, { status: 429 });

  const CAT_MAP: Record<string, string> = {
    DEEPTECH:"DEEPTECH",CONSUMER:"CONSUMER",B2B_SAAS:"B2B_SAAS",FINTECH:"FINTECH",
    HEALTHTECH:"HEALTHTECH",CLIMATETECH:"CLIMATETECH",EDTECH:"EDTECH",
    CREATOR_ECONOMY:"CREATOR_ECONOMY",INFRASTRUCTURE:"INFRASTRUCTURE",
    FUTURE_OF_WORK:"FUTURE_OF_WORK",WEB3:"WEB3",BIOTECH:"BIOTECH",OTHER:"OTHER",
  };
  const AMB_MAP: Record<string, string> = {
    MOONSHOT:"MOONSHOT",UNICORN:"UNICORN",ROCKETSHIP:"ROCKETSHIP",SOLID_STARTUP:"SOLID_STARTUP",
  };
  const MODE_MAP: Record<string, string> = {
    founder_matched:"FOUNDER_MATCHED",sector_focused:"SECTOR_FOCUSED",
    contrarian:"CONTRARIAN",timing_arbitrage:"TIMING_ARBITRAGE",
    white_space:"WHITE_SPACE",free_form:"FREE_FORM",
  };

  const saved = await prismadb.startupIdea.create({
    data: {
      userId:            user.id,
      founderBackground: (founderBackground ?? "").slice(0, 2000) || null,
      skills:            JSON.stringify(Array.isArray(skills) ? skills : []),
      interests:         JSON.stringify(Array.isArray(interests) ? interests : []),
      sector:            (CAT_MAP[sector] ?? "OTHER") as any,
      ambitiousness:     (AMB_MAP[ambitiousness] ?? "UNICORN") as any,
      generationMode:    (MODE_MAP[generationMode] ?? "FOUNDER_MATCHED") as any,
      locationContext:   (locationContext ?? "").slice(0, 200) || null,
      budgetContext:     (budgetContext ?? "").slice(0, 100) || null,
      timeCommitment:    (timeCommitment ?? "").slice(0, 100) || null,
      avoidSectors:      JSON.stringify(Array.isArray(avoidSectors) ? avoidSectors : []),
      ideasJson:         result ? JSON.stringify(result) : null,
      ideaCount:         result?.ideas?.length ?? 0,
      savedIdeaJson:     savedIdea ? JSON.stringify(savedIdea) : null,
      savedIdeaTitle:    savedIdea?.name ? String(savedIdea.name).slice(0, 300) : null,
      savedIdeaCategory: savedIdea?.category ? (CAT_MAP[savedIdea.category] ?? null) as any : null,
      isSaved:           true,
    },
  });

  await upsertWorkspace(user.id, sector, generationMode);
  return NextResponse.json({ ok: true, ideaId: saved.id });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prismadb.startupIdea.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

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

  if (action === "star") {
    await prismadb.startupIdea.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "status") {
    await prismadb.startupIdea.updateMany({ where: { id, userId: user.id }, data: { status: body.status ?? "EXPLORING" } });
    if (body.status === "BUILDING") {
      await prismadb.startupIdeaWorkspace.updateMany({ where: { userId: user.id }, data: { ideasBuilding: { increment: 1 } } });
    }
  } else if (action === "notes") {
    await prismadb.startupIdea.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "saveIdea") {
    // Save a specific idea from a batch
    const CAT_MAP: Record<string, string> = { DEEPTECH:"DEEPTECH",CONSUMER:"CONSUMER",B2B_SAAS:"B2B_SAAS",FINTECH:"FINTECH",HEALTHTECH:"HEALTHTECH",CLIMATETECH:"CLIMATETECH",EDTECH:"EDTECH",CREATOR_ECONOMY:"CREATOR_ECONOMY",INFRASTRUCTURE:"INFRASTRUCTURE",FUTURE_OF_WORK:"FUTURE_OF_WORK",WEB3:"WEB3",BIOTECH:"BIOTECH",OTHER:"OTHER" };
    await prismadb.startupIdea.updateMany({
      where: { id, userId: user.id },
      data: {
        savedIdeaJson:     body.idea ? JSON.stringify(body.idea) : null,
        savedIdeaTitle:    body.idea?.name ? String(body.idea.name).slice(0, 300) : null,
        savedIdeaCategory: body.idea?.category ? (CAT_MAP[body.idea.category] ?? null) as any : null,
      },
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

async function upsertWorkspace(userId: string, sector: string, mode: string) {
  const existing = await prismadb.startupIdeaWorkspace.findUnique({ where: { userId } });
  if (!existing) {
    await prismadb.startupIdeaWorkspace.create({
      data: {
        userId, totalGenerated: 1, totalSaved: 1, xpPoints: 20, streakDays: 1,
        lastActivityDate: new Date(),
        categoriesJson: sector ? JSON.stringify([{ sector, count: 1 }]) : "[]",
        modesJson:      mode   ? JSON.stringify([{ mode, count: 1 }]) : "[]",
      },
    });
    return;
  }

  let categories: any[] = []; try { categories = JSON.parse(existing.categoriesJson ?? "[]"); } catch {}
  const fc = categories.find((c: any) => c.sector === sector);
  if (fc) fc.count += 1; else if (sector) categories.push({ sector, count: 1 });

  let modes: any[] = []; try { modes = JSON.parse(existing.modesJson ?? "[]"); } catch {}
  const fm = modes.find((m: any) => m.mode === mode);
  if (fm) fm.count += 1; else if (mode) modes.push({ mode, count: 1 });

  const lastDate = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today    = new Date(); today.setHours(0,0,0,0);
  const lastDay  = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0,0,0,0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  await prismadb.startupIdeaWorkspace.update({
    where: { userId },
    data: {
      totalGenerated:  { increment: 1 },
      totalSaved:      { increment: 1 },
      xpPoints:        { increment: 20 + (newStreak > 1 ? 5 : 0) },
      streakDays:      newStreak,
      lastActivityDate: new Date(),
      categoriesJson:  JSON.stringify(categories),
      modesJson:       JSON.stringify(modes),
    },
  });
}