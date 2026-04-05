// =============================================================================
// isaacpaha.com — Career Discovery Engine — Save / Workspace API
// app/api/tools/career-discovery/save/route.ts
//
// GET    → fetch all saved queries + saved careers + progress for signed-in user
// POST   → save a full query result
// DELETE ?id=xxx → delete query (or ?careerId=xxx to delete a saved career)
// PATCH  ?action=star|notes|progress|saveCareer|updateCareer
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ queries: [], savedCareers: [], progress: null });

  const [queries, savedCareers, progress] = await Promise.all([
    prismadb.careerDiscoveryQuery.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
    prismadb.savedCareer.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prismadb.careerDiscoveryProgress.findUnique({
      where: { userId: user.id },
    }),
  ]);
  console.log("Fetched queries:", queries);

  return NextResponse.json({ queries, savedCareers, progress });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sp   = new URL(req.url).searchParams;
  const type = sp.get("type"); // "career" to save a single career card

  const body = await req.json();

  // ── Save a single career card ────────────────────────────────────────────
  if (type === "career") {
    const { career, queryId } = body;
    if (!career?.title) return NextResponse.json({ error: "career required" }, { status: 400 });

    const slug = career.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Upsert — don't duplicate
    const existing = await prismadb.savedCareer.findUnique({
      where: { userId_careerSlug: { userId: user.id, careerSlug: slug } },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadySaved: true, careerId: existing.id });
    }

    const COMP_MAP: Record<string, string> = {
      VERY_LOW: "VERY_LOW", LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", VERY_HIGH: "VERY_HIGH",
    };
    const ENTRY_MAP: Record<string, string> = {
      UNDER_3_MONTHS: "UNDER_3_MONTHS",
      THREE_TO_6_MONTHS: "THREE_TO_6_MONTHS",
      SIX_TO_12_MONTHS: "SIX_TO_12_MONTHS",
      ONE_TO_2_YEARS: "ONE_TO_2_YEARS",
      TWO_PLUS_YEARS: "TWO_PLUS_YEARS",
    };

    const saved = await prismadb.savedCareer.create({
      data: {
        userId:          user.id,
        queryId:         queryId ?? null,
        careerTitle:     career.title,
        careerSlug:      slug,
        industry:        career.industry ?? "Other",
        competitionLevel:(COMP_MAP[career.competitionLevel] ?? "MEDIUM") as any,
        entryTimeframe:  (ENTRY_MAP[career.entryTimeframeEnum] ?? "SIX_TO_12_MONTHS") as any,
        salaryEntryGbp:  parseSalaryLow(career.salaryEntry),
        salarySeniorGbp: parseSalaryLow(career.salarySenior),
        skillMatchPct:   career.skillMatchPct ?? 0,
        careerJson:      JSON.stringify(career),
      },
    });
    console.log("Saved career:", saved);

    await upsertProgress(user.id, career.industry);
    return NextResponse.json({ ok: true, careerId: saved.id });
  }

  // ── Save a full query result ──────────────────────────────────────────────
  const { skills, education, goals, experienceLevel, currentRole, salaryTarget, result } = body;

  if (!result) return NextResponse.json({ error: "result required" }, { status: 400 });

  const count = await prismadb.careerDiscoveryQuery.count({
    where: { userId: user.id, isSaved: true },
  });
  if (count >= 25) {
    return NextResponse.json(
      { error: "You've reached the 25 saved queries limit. Delete an older one first." },
      { status: 429 }
    );
  }

  const LEVEL_MAP: Record<string, string> = {
    entry: "ENTRY", mid: "MID", senior: "SENIOR", executive: "EXECUTIVE",
  };

  const saved = await prismadb.careerDiscoveryQuery.create({
    data: {
      userId:         user.id,
      skillsJson:     JSON.stringify(Array.isArray(skills) ? skills : []),
      education:      (education ?? "").slice(0, 500),
      goals:          (goals ?? "").slice(0, 1000),
      experienceLevel:(LEVEL_MAP[experienceLevel?.toLowerCase()] ?? "ENTRY") as any,
      currentRole:    (currentRole ?? "").slice(0, 300),
      salaryTarget:   salaryTarget ? Number(salaryTarget) : null,
      resultJson:     JSON.stringify(result),
      careerCount:    result.careers?.length ?? 0,
      isSaved:        true,
    },
  });

  await upsertProgress(user.id, null);
  return NextResponse.json({ ok: true, queryId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp       = new URL(req.url).searchParams;
  const id       = sp.get("id");
  const careerId = sp.get("careerId");

  if (careerId) {
    await prismadb.savedCareer.deleteMany({ where: { id: careerId, userId: user.id } });
  } else if (id) {
    await prismadb.careerDiscoveryQuery.deleteMany({ where: { id, userId: user.id } });
  } else {
    return NextResponse.json({ error: "id or careerId required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");         // query id
  const cid    = sp.get("careerId");   // career id
  const action = sp.get("action");
  const body   = await req.json();

  if (action === "star" && id) {
    await prismadb.careerDiscoveryQuery.updateMany({
      where: { id, userId: user.id },
      data:  { isStarred: body.isStarred },
    });
  }
  else if (action === "notes" && id) {
    await prismadb.careerDiscoveryQuery.updateMany({
      where: { id, userId: user.id },
      data:  { notes: body.notes ?? null },
    });
  }
  else if (action === "starCareer" && cid) {
    await prismadb.savedCareer.updateMany({
      where: { id: cid, userId: user.id },
      data:  { isStarred: body.isStarred },
    });
  }
  else if (action === "applyCareer" && cid) {
    await prismadb.savedCareer.updateMany({
      where: { id: cid, userId: user.id },
      data:  { isApplying: body.isApplying },
    });
  }
  else if (action === "roadmapStep" && cid) {
    await prismadb.savedCareer.updateMany({
      where: { id: cid, userId: user.id },
      data:  { roadmapStep: body.step ?? 0 },
    });
  }
  else if (action === "progressNotes" && cid) {
    await prismadb.savedCareer.updateMany({
      where: { id: cid, userId: user.id },
      data:  { progressNotes: body.notes ?? null },
    });
  }
  else {
    return NextResponse.json({ error: "Unknown action or missing id" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseSalaryLow(salaryStr?: string): number | null {
  if (!salaryStr) return null;
  const match = salaryStr.match(/[\d,]+/);
  if (!match) return null;
  return parseInt(match[0].replace(/,/g, ""), 10);
}

async function upsertProgress(userId: string, industry: string | null) {
  const existing = await prismadb.careerDiscoveryProgress.findUnique({ where: { userId } });

  if (!existing) {
    await prismadb.careerDiscoveryProgress.create({
      data: {
        userId,
        totalQueries:    1,
        careersExplored: industry ? 1 : 0,
        xpPoints:        25,
        streakDays:      1,
        lastActivityDate: new Date(),
        industriesJson:  industry ? JSON.stringify([{ industry, count: 1 }]) : "[]",
        topSkillsJson:   "[]",
      },
    });
    return;
  }

  // Update industries
  let industries: { industry: string; count: number }[] = [];
  try { industries = JSON.parse(existing.industriesJson || "[]"); } catch {}
  if (industry) {
    const found = industries.find((i) => i.industry === industry);
    if (found) found.count += 1;
    else industries.push({ industry, count: 1 });
  }

  // Streak
  const lastDate = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay  = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  await prismadb.careerDiscoveryProgress.update({
    where: { userId },
    data: {
      totalQueries:    { increment: 1 },
      careersExplored: { increment: industry ? 1 : 0 },
      xpPoints:        { increment: 25 + (newStreak > 1 ? 10 : 0) },
      streakDays:      newStreak,
      lastActivityDate: new Date(),
      industriesJson:  JSON.stringify(industries),
    },
  });
}