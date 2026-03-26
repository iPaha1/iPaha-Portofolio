// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Save / Workspace API
// app/api/tools/physics-engine/save/route.ts
//
// GET    → fetch all saved queries for signed-in user (with practice sessions)
// POST   → save a full explanation result + optional practice questions
// DELETE ?id=xxx → delete a saved query
// PATCH  ?id=xxx&action=star|notes|practice → update metadata or study progress
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ queries: [] });

  const queries = await prismadb.physicsQuery.findMany({
    where:   { userId: user.id, isSaved: true },
    orderBy: { createdAt: "desc" },
    include: {
      practiceSessions: {
        orderBy: { createdAt: "desc" },
        take:    5,
      },
    },
  });

  // Also fetch learning progress
  const progress = await prismadb.physicsLearningProgress.findUnique({
    where: { userId: user.id },
  });

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
    level          = "gcse",
    explorerMode   = false,
    result,                    // the full PhysicsExplanation JSON
    practiceQuestions,         // optional: questions[] from the practice panel
    practiceSessionType = "practice",
  } = body;

  if (!question?.trim() || !result) {
    return NextResponse.json({ error: "question and result are required" }, { status: 400 });
  }

  // Soft limit: 30 saved queries per user
  const count = await prismadb.physicsQuery.count({
    where: { userId: user.id, isSaved: true },
  });
  if (count >= 30) {
    return NextResponse.json({
      error: "You've reached the 30 saved explanations limit. Delete an older one to save a new one.",
    }, { status: 429 });
  }

  // Detect visualisation type from result
  const vizType = result.visualisation?.type ?? "none";
  const hasViz  = vizType !== "none" && vizType != null;

  // Map vizType string to enum-safe value
  const VIZ_ENUM: Record<string, string> = {
    wave:          "WAVE",
    motion_graph:  "MOTION_GRAPH",
    circuit:       "CIRCUIT",
    vector:        "VECTOR",
    function_graph:"FUNCTION_GRAPH",
    geometric:     "GEOMETRIC",
    none:          "NONE",
  };

  const saved = await prismadb.physicsQuery.create({
    data: {
      userId:               user.id,
      question:             question.trim().slice(0, 2000),
      level:                (level.toUpperCase() as any),
      isExplorerMode:       explorerMode,
      topic:                result.topic           ?? null,
      conceptName:          result.conceptName     ?? null,
      difficulty:           result.difficulty      ?? null,
      resultJson:           JSON.stringify(result),
      hasVisualisation:     hasViz,
      visualisationType:    (VIZ_ENUM[vizType] ?? "NONE") as any,
      isSaved:              true,
    },
  });

  // Save practice questions if provided
  if (practiceQuestions?.length) {
    await prismadb.physicsPracticeSession.create({
      data: {
        queryId:       saved.id,
        userId:        user.id,
        topic:         result.topic        ?? null,
        conceptName:   result.conceptName  ?? null,
        level:         (level.toUpperCase() as any),
        sessionType:   practiceSessionType,
        questionsJson: JSON.stringify(practiceQuestions),
      },
    });
  }

  // Update learning progress
  await upsertLearningProgress(user.id, result.topic, level);

  return NextResponse.json({ ok: true, queryId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.physicsQuery.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
// action=star        → toggle star
// action=notes       → save personal notes
// action=practice    → save practice questions to existing query
// action=study       → update practice session study progress

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const action = sp.get("action");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  if (action === "star") {
    await prismadb.physicsQuery.updateMany({
      where: { id, userId: user.id },
      data:  { isStarred: body.isStarred },
    });
  }

  else if (action === "notes") {
    await prismadb.physicsQuery.updateMany({
      where: { id, userId: user.id },
      data:  { notes: body.notes ?? null },
    });
  }

  else if (action === "practice") {
    // Add practice session to an existing query
    const { questions, sessionType = "practice", level = "GCSE" } = body;
    if (!questions?.length) return NextResponse.json({ error: "questions required" }, { status: 400 });

    const query = await prismadb.physicsQuery.findFirst({ where: { id, userId: user.id }, select: { topic: true, conceptName: true } });
    if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });

    const session = await prismadb.physicsPracticeSession.create({
      data: {
        queryId:       id,
        userId:        user.id,
        topic:         query.topic       ?? null,
        conceptName:   query.conceptName ?? null,
        level:         level as any,
        sessionType,
        questionsJson: JSON.stringify(questions),
      },
    });
    return NextResponse.json({ ok: true, sessionId: session.id });
  }

  else if (action === "study") {
    // Update practice session study progress (mark questions as attempted/correct)
    const sessionId = sp.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    await prismadb.physicsPracticeSession.updateMany({
      where: { id: sessionId, userId: user.id },
      data:  {
        attemptedIds: body.attemptedIds ?? undefined,
        correctIds:   body.correctIds   ?? undefined,
        score:        body.score        ?? undefined,
        completedAt:  body.score != null ? new Date() : undefined,
      },
    });
  }

  else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Learning progress upsert ─────────────────────────────────────────────────

async function upsertLearningProgress(userId: string, topic?: string, level?: string) {
  const existing = await prismadb.physicsLearningProgress.findUnique({ where: { userId } });

  if (!existing) {
    await prismadb.physicsLearningProgress.create({
      data: {
        userId,
        totalQueries: 1,
        topicsJson: topic ? JSON.stringify([{ topic, count: 1, lastStudied: new Date().toISOString(), level }]) : "[]",
        lastActivityDate: new Date(),
      },
    });
    return;
  }

  // Update topics list
  let topics: { topic: string; count: number; lastStudied: string; level?: string }[] = [];
  try { topics = JSON.parse(existing.topicsJson || "[]"); } catch {}

  const existing_topic = topics.find((t) => t.topic === topic);
  if (topic) {
    if (existing_topic) {
      existing_topic.count += 1;
      existing_topic.lastStudied = new Date().toISOString();
      existing_topic.level = level;
    } else {
      topics.push({ topic, count: 1, lastStudied: new Date().toISOString(), level });
    }
  }

  // Update streak
  const lastDate = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = lastDate ? Math.floor((today.getTime() - lastDate.setHours(0,0,0,0)) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;
  const xpGain    = 20 + (newStreak > 1 ? 10 : 0);

  await prismadb.physicsLearningProgress.update({
    where: { userId },
    data:  {
      totalQueries:    { increment: 1 },
      topicsJson:      JSON.stringify(topics),
      streakDays:      newStreak,
      lastActivityDate: new Date(),
      xpPoints:        { increment: xpGain },
    },
  });
}