// =============================================================================
// isaacpaha.com — AI CV Analyser: Save Analysis API
// app/api/tools/cv-analyser/save/route.ts
//
// POST → save analysis result to DB
// GET  → fetch user's saved analyses
// DELETE ?id=xxx → delete a saved analysis
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET: fetch user's saved analyses ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ analyses: [] });

  const sp      = new URL(req.url).searchParams;
  const include = sp.get("include"); // "coverLetters" | "questions" | "all"

  const analyses = await prismadb.cvAnalysis.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      coverLetters:       (include === "all" || include === "coverLetters"),
      interviewSessions:  (include === "all" || include === "questions"),
    },
  });

  return NextResponse.json({ analyses });
}

// ─── POST: save a new analysis ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save your analysis" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    cvText,
    jobDescription,
    roleMode,
    targetRole,
    jobTitle,
    companyName,
    analysis,           // the full analysis JSON
    coverLetter,        // optional: cover letter text
    coverLetterStyle,   // optional: style used
  } = body;

  if (!cvText?.trim() || !analysis) {
    return NextResponse.json({ error: "cvText and analysis are required" }, { status: 400 });
  }

  // Check how many analyses this user has (soft limit: 20)
  const count = await prismadb.cvAnalysis.count({ where: { userId: user.id } });
  if (count >= 20) {
    return NextResponse.json({ error: "You've reached the 20 saved analyses limit. Delete an old one to save a new one." }, { status: 429 });
  }

  // Build a label for this analysis
  const label = jobTitle
    ? `${jobTitle}${companyName ? ` @ ${companyName}` : ""}`
    : `Analysis ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  const saved = await prismadb.cvAnalysis.create({
    data: {
      userId:        user.id,
      label,
      jobTitle:      jobTitle      ?? null,
      companyName:   companyName   ?? null,
      targetRole:    targetRole    ?? null,
      roleMode:      roleMode      ?? "general",
      cvText:        cvText.slice(0, 15000),
      jobDescription: jobDescription ? jobDescription.slice(0, 5000) : null,
      // Scores
      overallScore:  analysis.overallScore  ?? 0,
      atsScore:      analysis.atsScore      ?? 0,
      keywordScore:  analysis.keywordScore  ?? 0,
      languageScore: analysis.languageScore ?? 0,
      structureScore:analysis.structureScore ?? 0,
      jobMatchScore: analysis.jobMatchScore  ?? 0,
      // Full analysis JSON
      analysisJson:  JSON.stringify(analysis),
    },
  });

  // Save cover letter if provided
  if (coverLetter?.trim()) {
    await prismadb.cvCoverLetter.create({
      data: {
        analysisId: saved.id,
        userId:     user.id,
        content:    coverLetter.slice(0, 5000),
        style:      coverLetterStyle ?? "professional",
        jobTitle:   jobTitle    ?? null,
        companyName:companyName ?? null,
      },
    });
  }

  // Save interview questions if present
  if (analysis.interviewQuestions?.length) {
    await prismadb.cvInterviewSession.create({
      data: {
        analysisId: saved.id,
        userId:     user.id,
        jobTitle:   jobTitle ?? null,
        questions:  JSON.stringify(analysis.interviewQuestions),
      },
    });
  }

  return NextResponse.json({ ok: true, analysisId: saved.id, label });
}

// ─── DELETE: remove a saved analysis ─────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.cvAnalysis.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

// ─── PATCH: update study progress / star / notes ──────────────────────────────

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const action = sp.get("action"); // "study" | "star" | "notes"

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  if (action === "study") {
    // Update interview session study progress
    await prismadb.cvInterviewSession.updateMany({
      where: { analysisId: id, userId: user.id },
      data: {
        markedReady: body.markedReady,
        studyCount:  { increment: 1 },
        lastStudied: new Date(),
      },
    });
  } else if (action === "star") {
    await prismadb.cvAnalysis.updateMany({
      where: { id, userId: user.id },
      data:  { isStarred: body.isStarred },
    });
  } else if (action === "notes") {
    await prismadb.cvAnalysis.updateMany({
      where: { id, userId: user.id },
      data:  { notes: body.notes },
    });
  }

  return NextResponse.json({ ok: true });
}