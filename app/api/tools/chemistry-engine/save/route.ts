// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Save / Workspace API
// app/api/tools/chemistry-engine/save/route.ts
//
// GET    → fetch all saved queries + learning progress
// POST   → save explanation + optional practice questions (30-query soft limit)
// DELETE ?id=xxx → delete saved query (cascades to practice sessions)
// PATCH  ?id=xxx&action=star|notes|practice|study → update metadata/progress
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
  if (!user) return NextResponse.json({ queries: [], progress: null });

  const [queries, progress] = await Promise.all([
    prismadb.chemistryQuery.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { createdAt: "desc" },
      include: {
        practiceSessions: {
          orderBy: { createdAt: "desc" },
          take:    5,
        },
      },
    }),
    prismadb.chemistryLearningProgress.findUnique({
      where: { userId: user.id },
    }),
  ]);

  return NextResponse.json({ queries, progress });
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

  const body = await req.json();
  const {
    question,
    level                = "gcse",
    explorerMode         = false,
    result,
    practiceQuestions,
    practiceSessionType = "practice",
  } = body;

  if (!question?.trim() || !result) {
    return NextResponse.json({ error: "question and result are required" }, { status: 400 });
  }

  // Soft limit
  const count = await prismadb.chemistryQuery.count({
    where: { userId: user.id, isSaved: true },
  });
  if (count >= 30) {
    return NextResponse.json({ error: "30-explanation limit reached. Delete an older one to save a new one." }, { status: 429 });
  }

  const VIZ_ENUM: Record<string, string> = {
    energy_diagram:   "ENERGY_DIAGRAM",
    periodic_element: "PERIODIC_ELEMENT",
    molecular:        "MOLECULAR",
    wave:             "WAVE",
    function_graph:   "FUNCTION_GRAPH",
    none:             "NONE",
  };

  const LEVEL_MAP: Record<string, string> = {
    gcse:       "GCSE",
    alevel:     "ALEVEL",
    university: "UNIVERSITY",
  };

  const rawViz    = result.visualisation?.type ?? "none";
  const vizEnum   = (VIZ_ENUM[rawViz]     ?? "NONE")  as any;
  const levelEnum = (LEVEL_MAP[level.toLowerCase()] ?? "GCSE") as any;

  const saved = await prismadb.chemistryQuery.create({
    data: {
      userId:            user.id,
      question:          question.trim().slice(0, 2000),
      level:             levelEnum,
      isExplorerMode:    explorerMode,
      topic:             result.topic        ?? null,
      conceptName:       result.conceptName  ?? null,
      difficulty:        result.difficulty   ?? null,
      resultJson:        JSON.stringify(result),
      hasVisualisation:  rawViz !== "none",
      visualisationType: vizEnum,
      isSaved:           true,
    },
  });

  if (practiceQuestions?.length) {
    await prismadb.chemistryPracticeSession.create({
      data: {
        queryId:       saved.id,
        userId:        user.id,
        topic:         result.topic       ?? null,
        conceptName:   result.conceptName ?? null,
        level:         levelEnum,
        sessionType:   practiceSessionType,
        questionsJson: JSON.stringify(practiceQuestions),
      },
    });
  }

  await upsertLearningProgress(user.id, result.topic, level);

  return NextResponse.json({ ok: true, queryId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.chemistryQuery.deleteMany({ where: { id, userId: user.id } });
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
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  if (action === "star") {
    await prismadb.chemistryQuery.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "notes") {
    await prismadb.chemistryQuery.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "practice") {
    const { questions, level = "GCSE", sessionType = "practice" } = body;
    if (!questions?.length) return NextResponse.json({ error: "questions required" }, { status: 400 });
    const query = await prismadb.chemistryQuery.findFirst({ where: { id, userId: user.id }, select: { topic: true, conceptName: true } });
    if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });
    const sess = await prismadb.chemistryPracticeSession.create({
      data: { queryId: id, userId: user.id, topic: query.topic ?? null, conceptName: query.conceptName ?? null, level: level as any, sessionType, questionsJson: JSON.stringify(questions) },
    });
    return NextResponse.json({ ok: true, sessionId: sess.id });
  } else if (action === "study") {
    const sessionId = sp.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    await prismadb.chemistryPracticeSession.updateMany({
      where: { id: sessionId, userId: user.id },
      data: { attemptedIds: body.attemptedIds ?? undefined, correctIds: body.correctIds ?? undefined, score: body.score ?? undefined, completedAt: body.score != null ? new Date() : undefined },
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Learning progress upsert ─────────────────────────────────────────────────

async function upsertLearningProgress(userId: string, topic?: string, level?: string) {
  const existing = await prismadb.chemistryLearningProgress.findUnique({ where: { userId } });
  const entry    = topic ? { topic, count: 1, lastStudied: new Date().toISOString(), level } : null;

  if (!existing) {
    await prismadb.chemistryLearningProgress.create({
      data: { userId, totalQueries: 1, topicsJson: entry ? JSON.stringify([entry]) : "[]", lastActivityDate: new Date(), xpPoints: 20, streakDays: 1 },
    });
    return;
  }

  let topics: { topic: string; count: number; lastStudied: string; level?: string }[] = [];
  try { topics = JSON.parse(existing.topicsJson || "[]"); } catch {}

  if (topic) {
    const found = topics.find((t) => t.topic === topic);
    if (found) { found.count += 1; found.lastStudied = new Date().toISOString(); if (level) found.level = level; }
    else topics.push({ topic, count: 1, lastStudied: new Date().toISOString(), level });
  }

  const lastDay  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  if (lastDay)   lastDay.setHours(0, 0, 0, 0);
  const diffDays = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const streak   = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;
  const xpGain   = 20 + (streak > 1 ? 10 : 0);

  await prismadb.chemistryLearningProgress.update({
    where: { userId },
    data: { totalQueries: { increment: 1 }, topicsJson: JSON.stringify(topics), streakDays: streak, lastActivityDate: new Date(), xpPoints: { increment: xpGain } },
  });
}