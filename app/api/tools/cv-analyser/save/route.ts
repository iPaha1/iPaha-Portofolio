// =============================================================================
// isaacpaha.com — AI CV Analyser: Save Analysis API
// app/api/tools/cv-analyser/save/route.ts
//
// POST → save analysis result to DB
// GET  → fetch user's saved analyses
// DELETE ?id=xxx → delete a saved analysis
// PATCH → update study progress / star / notes
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

// Define enum values to match Prisma schema
type CVRoleMode = "GENERAL" | "TECH" | "FINANCE" | "GRADUATE" | "BUSINESS" | "HEALTHCARE" | "CREATIVE";
type CoverLetterStyle = "PROFESSIONAL" | "CREATIVE" | "CONCISE";

// Map from lowercase input to uppercase enum
const roleModeMap: Record<string, CVRoleMode> = {
  general: "GENERAL",
  tech: "TECH",
  finance: "FINANCE",
  graduate: "GRADUATE",
  business: "BUSINESS",
  healthcare: "HEALTHCARE",
  creative: "CREATIVE",
};

const styleMap: Record<string, CoverLetterStyle> = {
  professional: "PROFESSIONAL",
  creative: "CREATIVE",
  concise: "CONCISE",
};

// ─── GET: fetch user's saved analyses ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ analyses: [] });
    }

    const sp = new URL(req.url).searchParams;
    const include = sp.get("include"); // "coverLetters" | "questions" | "all"
    const limit = parseInt(sp.get("limit") || "50");
    const offset = parseInt(sp.get("offset") || "0");

    const analyses = await prismadb.cvAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: Math.min(limit, 100),
      include: {
        coverLetters: include === "all" || include === "coverLetters",
        interviewSessions: include === "all" || include === "questions",
      },
    });

    const total = await prismadb.cvAnalysis.count({ where: { userId: user.id } });

    return NextResponse.json({ 
      analyses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + analyses.length < total
      }
    });
  } catch (err: any) {
    console.error("[cv-analyser/save] GET error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}

// ─── POST: save a new analysis ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to save your analysis" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      cvText,
      jobDescription,
      roleMode = "general",
      targetRole,
      jobTitle,
      companyName,
      analysis,           // the full analysis JSON
      coverLetter,        // optional: cover letter text
      coverLetterStyle,   // optional: style used
    } = body;

    // Validate required fields
    if (!cvText?.trim() || !analysis) {
      return NextResponse.json(
        { error: "cvText and analysis are required" },
        { status: 400 }
      );
    }

    // Check how many analyses this user has (soft limit: 20)
    const count = await prismadb.cvAnalysis.count({ where: { userId: user.id } });
    if (count >= 20) {
      return NextResponse.json(
        { error: "You've reached the 20 saved analyses limit. Delete an old one to save a new one." },
        { status: 429 }
      );
    }

    // Map roleMode to enum value
    const mappedRoleMode = roleModeMap[roleMode.toLowerCase()] || "GENERAL";
    
    // Build a label for this analysis
    const label = jobTitle
      ? `${jobTitle}${companyName ? ` @ ${companyName}` : ""}`
      : `Analysis ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

    // Extract scores with fallbacks
    const overallScore = analysis.overallScore ?? 
      Math.round((analysis.jobMatchScore + analysis.atsScore + analysis.keywordScore + 
                  analysis.languageScore + analysis.structureScore) / 5) ?? 0;

    const saved = await prismadb.cvAnalysis.create({
      data: {
        userId: user.id,
        label: label.slice(0, 255),
        jobTitle: jobTitle?.slice(0, 255) ?? null,
        companyName: companyName?.slice(0, 255) ?? null,
        targetRole: targetRole?.slice(0, 255) ?? null,
        roleMode: mappedRoleMode,
        cvText: cvText.slice(0, 15000),
        jobDescription: jobDescription ? jobDescription.slice(0, 5000) : null,
        // Scores
        overallScore: overallScore,
        atsScore: analysis.atsScore ?? 0,
        keywordScore: analysis.keywordScore ?? 0,
        languageScore: analysis.languageScore ?? 0,
        structureScore: analysis.structureScore ?? 0,
        jobMatchScore: analysis.jobMatchScore ?? 0,
        // Full analysis JSON
        analysisJson: JSON.stringify(analysis),
      },
    });

    console.log(`[cv-analyser/save] Saved analysis ${saved.id} for user ${user.id}`);

    // Save cover letter if provided
    if (coverLetter?.trim()) {
      const mappedStyle = styleMap[coverLetterStyle?.toLowerCase() || "professional"] || "PROFESSIONAL";
      
      await prismadb.cvCoverLetter.create({
        data: {
          analysisId: saved.id,
          userId: user.id,
          content: coverLetter.slice(0, 5000),
          style: mappedStyle,
          jobTitle: jobTitle?.slice(0, 255) ?? null,
          companyName: companyName?.slice(0, 255) ?? null,
        },
      });
      console.log(`[cv-analyser/save] Saved cover letter for analysis ${saved.id}`);
    }

    // Save interview questions if present
    if (analysis.interviewQuestions?.length) {
      await prismadb.cvInterviewSession.create({
        data: {
          analysisId: saved.id,
          userId: user.id,
          jobTitle: jobTitle?.slice(0, 255) ?? null,
          questions: JSON.stringify(analysis.interviewQuestions),
        },
      });
      console.log(`[cv-analyser/save] Saved ${analysis.interviewQuestions.length} interview questions for analysis ${saved.id}`);
    }

    return NextResponse.json({ 
      ok: true, 
      analysisId: saved.id, 
      label,
      savedCount: count + 1
    });
  } catch (err: any) {
    console.error("[cv-analyser/save] POST error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to save analysis" },
      { status: 500 }
    );
  }
}

// ─── DELETE: remove a saved analysis ─────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Check if analysis exists and belongs to user
    const existing = await prismadb.cvAnalysis.findFirst({
      where: { id, userId: user.id },
    });
    
    if (!existing) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Delete will cascade to cover letters and interview sessions
    await prismadb.cvAnalysis.deleteMany({
      where: { id, userId: user.id },
    });
    
    console.log(`[cv-analyser/save] Deleted analysis ${id} for user ${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[cv-analyser/save] DELETE error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete analysis" },
      { status: 500 }
    );
  }
}

// ─── PATCH: update study progress / star / notes ──────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    const action = sp.get("action"); // "study" | "star" | "notes"

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Verify analysis belongs to user
    const analysis = await prismadb.cvAnalysis.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const body = await req.json();

    if (action === "study") {
      // Update interview session study progress
      const result = await prismadb.cvInterviewSession.updateMany({
        where: { analysisId: id, userId: user.id },
        data: {
          markedReady: body.markedReady ? JSON.stringify(body.markedReady) : null,
          studyCount: { increment: 1 },
          lastStudied: new Date(),
        },
      });
      
      if (result.count === 0) {
        // Create interview session if it doesn't exist
        const interviewQuestions = body.questions ? JSON.stringify(body.questions) : "[]";
        await prismadb.cvInterviewSession.create({
          data: {
            analysisId: id,
            userId: user.id,
            questions: interviewQuestions,
            markedReady: body.markedReady ? JSON.stringify(body.markedReady) : null,
            studyCount: 1,
            lastStudied: new Date(),
          },
        });
      }
      
      console.log(`[cv-analyser/save] Updated study progress for analysis ${id}`);
    } else if (action === "star") {
      await prismadb.cvAnalysis.updateMany({
        where: { id, userId: user.id },
        data: { isStarred: body.isStarred === true },
      });
      console.log(`[cv-analyser/save] Updated star status for analysis ${id}: ${body.isStarred}`);
    } else if (action === "notes") {
      await prismadb.cvAnalysis.updateMany({
        where: { id, userId: user.id },
        data: { notes: body.notes?.slice(0, 5000) ?? null },
      });
      console.log(`[cv-analyser/save] Updated notes for analysis ${id}`);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'study', 'star', or 'notes'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[cv-analyser/save] PATCH error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to update analysis" },
      { status: 500 }
    );
  }
}