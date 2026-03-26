// =============================================================================
// isaacpaha.com — Math Understanding Engine — Save / Workspace API
// app/api/tools/math-engine/save/route.ts
//
// GET    → fetch all saved queries + learning progress for signed-in user
// POST   → save explanation result + optional practice questions
// DELETE ?id=xxx → delete a saved query (cascades to practice sessions)
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
    prismadb.mathQuery.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { createdAt: "desc" },
      include: {
        practiceSessions: {
          orderBy: { createdAt: "desc" },
          take:    5,
        },
      },
    }),
    prismadb.mathLearningProgress.findUnique({
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
    result,                          // full MathExplanation JSON
    practiceQuestions,               // optional practice questions to save alongside
    practiceSessionType = "practice",// "practice" (default)
  } = body;

  if (!question?.trim() || !result) {
    return NextResponse.json({ error: "question and result are required" }, { status: 400 });
  }

  // Soft limit: 30 saved queries per user
  const count = await prismadb.mathQuery.count({
    where: { userId: user.id, isSaved: true },
  });
  if (count >= 30) {
    return NextResponse.json({
      error: "You've reached the 30 saved explanations limit. Delete an older one to save a new one.",
    }, { status: 429 });
  }

  // Map string viz type to enum
  const VIZ_ENUM: Record<string, string> = {
    function_graph: "FUNCTION_GRAPH",
    linear_graph:   "LINEAR_GRAPH",
    geometric:      "GEOMETRIC",
    statistical:    "STATISTICAL",
    vector:         "VECTOR",
    sequence:       "SEQUENCE",
    ratio:          "RATIO",
    none:           "NONE",
  };

  const rawVizType = result.visualisation?.type ?? "none";
  const vizEnum    = (VIZ_ENUM[rawVizType] ?? "NONE") as any;
  const hasViz     = rawVizType !== "none" && !!rawVizType;

  // Map level string to enum
  const LEVEL_MAP: Record<string, string> = {
    gcse:         "GCSE",
    alevel:       "ALEVEL",
    university:   "UNIVERSITY",
    middle_school:"MIDDLE_SCHOOL",
    high_school:  "HIGH_SCHOOL",
    college:      "COLLEGE",
  };
  const levelEnum = (LEVEL_MAP[level.toLowerCase()] ?? "GCSE") as any;

  const saved = await prismadb.mathQuery.create({
    data: {
      userId:               user.id,
      question:             question.trim().slice(0, 2000),
      level:                levelEnum,
      topic:                result.topic        ?? null,
      conceptName:          result.conceptName  ?? null,
      difficulty:           result.difficulty   ?? null,
      resultJson:           JSON.stringify(result),
      hasVisualisation:     hasViz,
      visualisationType:    vizEnum,
      isSaved:              true,
    },
  });

  // Save practice questions if provided
  if (practiceQuestions?.length) {
    await prismadb.mathPracticeSession.create({
      data: {
        queryId:       saved.id,
        userId:        user.id,
        topic:         result.topic        ?? null,
        conceptName:   result.conceptName  ?? null,
        level:         levelEnum,
        questionsJson: JSON.stringify(practiceQuestions),
      },
    });
  }

  // Update learning progress (topic map, streak, XP)
  await upsertLearningProgress(user.id, result.topic, level);

  return NextResponse.json({ ok: true, queryId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Cascade deletes practice sessions via the schema relation
  await prismadb.mathQuery.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
// ?action=star        → toggle starred
// ?action=notes       → save personal notes on a query
// ?action=practice    → attach a new practice session to an existing saved query
// ?action=study       → update practice session progress (attempted / correct / score)

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const action = sp.get("action");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  if (action === "star") {
    await prismadb.mathQuery.updateMany({
      where: { id, userId: user.id },
      data:  { isStarred: body.isStarred },
    });
  }

  else if (action === "notes") {
    await prismadb.mathQuery.updateMany({
      where: { id, userId: user.id },
      data:  { notes: body.notes ?? null },
    });
  }

  else if (action === "practice") {
    // Attach new practice questions to an existing saved query
    const { questions, level = "GCSE" } = body;
    if (!questions?.length) return NextResponse.json({ error: "questions required" }, { status: 400 });

    const query = await prismadb.mathQuery.findFirst({
      where:  { id, userId: user.id },
      select: { topic: true, conceptName: true },
    });
    if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });

    const session = await prismadb.mathPracticeSession.create({
      data: {
        queryId:       id,
        userId:        user.id,
        topic:         query.topic       ?? null,
        conceptName:   query.conceptName ?? null,
        level:         level as any,
        questionsJson: JSON.stringify(questions),
      },
    });
    return NextResponse.json({ ok: true, sessionId: session.id });
  }

  else if (action === "study") {
    // Update practice session study progress
    const sessionId = sp.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    await prismadb.mathPracticeSession.updateMany({
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
  const existing = await prismadb.mathLearningProgress.findUnique({ where: { userId } });

  const topicEntry = topic
    ? { topic, count: 1, lastStudied: new Date().toISOString(), level }
    : null;

  if (!existing) {
    await prismadb.mathLearningProgress.create({
      data: {
        userId,
        totalQueries:    1,
        topicsJson:      topicEntry ? JSON.stringify([topicEntry]) : "[]",
        lastActivityDate: new Date(),
        xpPoints:         20,
        streakDays:       1,
      },
    });
    return;
  }

  // Update topics list
  let topics: { topic: string; count: number; lastStudied: string; level?: string }[] = [];
  try { topics = JSON.parse(existing.topicsJson || "[]"); } catch {}

  if (topic) {
    const found = topics.find((t) => t.topic === topic);
    if (found) {
      found.count += 1;
      found.lastStudied = new Date().toISOString();
      if (level) found.level = level;
    } else {
      topics.push({ topic, count: 1, lastStudied: new Date().toISOString(), level });
    }
  }

  // Streak calculation
  const lastDate  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay   = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;
  const xpGain    = 20 + (newStreak > 1 ? 10 : 0); // bonus for streaks

  await prismadb.mathLearningProgress.update({
    where: { userId },
    data:  {
      totalQueries:     { increment: 1 },
      topicsJson:       JSON.stringify(topics),
      streakDays:       newStreak,
      lastActivityDate: new Date(),
      xpPoints:         { increment: xpGain },
    },
  });
}