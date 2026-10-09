// =============================================================================
// isaacpaha.com — Salary Intelligence Engine — Save / Workspace API
// app/api/tools/salary-intelligence/save/route.ts
//
// GET    → fetch saved checks + negotiations + progress
// POST   → save a salary check or negotiation session
// DELETE ?id=xxx | ?negId=xxx → delete
// PATCH  ?id=xxx&action=star|notes|status|outcome
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ checks: [], negotiations: [], progress: null });

  const [checks, negotiations, progress] = await Promise.all([
    prismadb.salaryCheck.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      take:    20,
      include: { negotiations: { take: 3, orderBy: { createdAt: "desc" } } },
    }),
    prismadb.negotiationSession.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      take:    10,
    }),
    prismadb.salaryIntelligenceProgress.findUnique({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ checks, negotiations, progress });
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

  // ── Save a negotiation session ──────────────────────────────────────────
  if (type === "negotiation") {
    const { askingFor, currentSalary, targetSalary, context, result, salaryCheckId } = body;

    const RISK_MAP: Record<string, string> = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH" };

    const session = await prismadb.negotiationSession.create({
      data: {
        userId:        user.id,
        salaryCheckId: salaryCheckId ?? null,
        askingFor:     (askingFor ?? "").slice(0, 500),
        currentSalary: currentSalary ? Number(currentSalary) : null,
        targetSalary:  targetSalary  ? Number(targetSalary)  : null,
        context:       (context ?? "").slice(0, 1000) || null,
        scriptJson:    JSON.stringify(result),
        riskLevel:     (RISK_MAP[result?.situationAssessment?.riskLevel] ?? "MEDIUM") as any,
        confidenceScore: result?.situationAssessment?.confidenceScore ?? 50,
      },
    });

    await upsertProgress(user.id, "negotiation");
    return NextResponse.json({ ok: true, sessionId: session.id });
  }

  // ── Save a full salary check ────────────────────────────────────────────
  const {
    jobTitle, industry, location, yearsExperience, currentSalary,
    currency, educationLevel, companySize, skills, remoteSetup,
    benefits, lastRaiseMonths, result,
  } = body;

  if (!result) return NextResponse.json({ error: "result required" }, { status: 400 });

  const count = await prismadb.salaryCheck.count({ where: { userId: user.id } });
  if (count >= 20) {
    return NextResponse.json({ error: "20 saved checks limit reached. Delete an older one first." }, { status: 429 });
  }

  const VERDICT_MAP: Record<string, string> = {
    SIGNIFICANTLY_UNDERPAID: "SIGNIFICANTLY_UNDERPAID",
    UNDERPAID:               "UNDERPAID",
    FAIRLY_PAID:             "FAIRLY_PAID",
    WELL_PAID:               "WELL_PAID",
    EXCEPTIONALLY_PAID:      "EXCEPTIONALLY_PAID",
  };

  const marketMedian = result.salaryData?.marketMedian ?? null;
  const gapAmount    = marketMedian != null ? (Number(currentSalary) - marketMedian) : null;
  const gapPercent   = marketMedian != null && marketMedian > 0
    ? parseFloat((((Number(currentSalary) - marketMedian) / marketMedian) * 100).toFixed(2))
    : null;

  const saved = await prismadb.salaryCheck.create({
    data: {
      userId:          user.id,
      jobTitle:        (jobTitle ?? "").slice(0, 300),
      industry:        (industry ?? "").slice(0, 200),
      location:        (location ?? "").slice(0, 200),
      yearsExperience: Number(yearsExperience) || 0,
      currentSalary:   Number(currentSalary)   || 0,
      currency:        (currency ?? "GBP").slice(0, 10),
      educationLevel:  (educationLevel ?? "").slice(0, 100) || null,
      companySize:     (companySize ?? "").slice(0, 100)    || null,
      skills:          JSON.stringify(Array.isArray(skills) ? skills : []),
      remoteSetup:     (remoteSetup ?? "").slice(0, 100)    || null,
      benefits:        JSON.stringify(Array.isArray(benefits) ? benefits : []),
      lastRaiseMonths: lastRaiseMonths != null ? Number(lastRaiseMonths) : null,
      resultJson:      JSON.stringify(result),
      verdict:         (VERDICT_MAP[result.verdict] ?? null) as any,
      marketMedian,
      gapAmount,
      gapPercent,
      status:          "SAVED",
    },
  });

  await upsertProgress(user.id, "check", industry);
  return NextResponse.json({ ok: true, checkId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const negId  = sp.get("negId");

  if (negId) {
    await prismadb.negotiationSession.deleteMany({ where: { id: negId, userId: user.id } });
  } else if (id) {
    await prismadb.salaryCheck.deleteMany({ where: { id, userId: user.id } });
  } else {
    return NextResponse.json({ error: "id or negId required" }, { status: 400 });
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
  const id     = sp.get("id");
  const negId  = sp.get("negId");
  const action = sp.get("action");
  const body   = await req.json();

  const STATUS_MAP: Record<string, string> = {
    DRAFT: "DRAFT", SAVED: "SAVED", ACTING_ON_IT: "ACTING_ON_IT",
    NEGOTIATED: "NEGOTIATED", OUTCOME_RECORDED: "OUTCOME_RECORDED",
  };

  if (action === "star" && id) {
    await prismadb.salaryCheck.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "notes" && id) {
    await prismadb.salaryCheck.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "status" && id) {
    await prismadb.salaryCheck.updateMany({ where: { id, userId: user.id }, data: { status: (STATUS_MAP[body.status] ?? "SAVED") as any } });
  } else if (action === "outcome" && id) {
    await prismadb.salaryCheck.updateMany({
      where: { id, userId: user.id },
      data: { negotiationOutcome: body.outcome ?? null, status: "OUTCOME_RECORDED" },
    });
    if (body.raiseAmount && Number(body.raiseAmount) > 0) {
      await prismadb.salaryIntelligenceProgress.updateMany({
        where: { userId: user.id },
        data: { successfulRaises: { increment: 1 }, totalRaiseAmount: { increment: Number(body.raiseAmount) } },
      });
    }
  } else if (action === "negOutcome" && negId) {
    await prismadb.negotiationSession.updateMany({
      where: { id: negId, userId: user.id },
      data: { outcomeAmount: body.amount ? Number(body.amount) : null, wasSuccessful: body.wasSuccessful ?? null, outcomeNotes: body.notes ?? null },
    });
    if (body.wasSuccessful && body.amount) {
      await prismadb.salaryIntelligenceProgress.updateMany({
        where: { userId: user.id },
        data: { successfulRaises: { increment: 1 }, totalRaiseAmount: { increment: Number(body.amount) } },
      });
    }
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Progress upsert ──────────────────────────────────────────────────────────
async function upsertProgress(userId: string, type: "check" | "negotiation", industry?: string) {
  const existing = await prismadb.salaryIntelligenceProgress.findUnique({ where: { userId } });

  if (!existing) {
    const industries = industry ? JSON.stringify([{ industry, count: 1 }]) : "[]";
    await prismadb.salaryIntelligenceProgress.create({
      data: {
        userId,
        totalChecks:      type === "check" ? 1 : 0,
        totalNegotiations: type === "negotiation" ? 1 : 0,
        xpPoints:         30,
        streakDays:       1,
        lastActivityDate: new Date(),
        industriesJson:   industries,
      },
    });
    return;
  }

  let industries: { industry: string; count: number }[] = [];
  try { industries = JSON.parse(existing.industriesJson ?? "[]"); } catch {}
  if (industry) {
    const found = industries.find(i => i.industry === industry);
    if (found) found.count += 1;
    else industries.push({ industry, count: 1 });
  }

  const lastDate  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay   = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  await prismadb.salaryIntelligenceProgress.update({
    where: { userId },
    data: {
      totalChecks:       type === "check"       ? { increment: 1 } : undefined,
      totalNegotiations: type === "negotiation" ? { increment: 1 } : undefined,
      xpPoints:          { increment: 30 + (newStreak > 1 ? 10 : 0) },
      streakDays:        newStreak,
      lastActivityDate:  new Date(),
      industriesJson:    JSON.stringify(industries),
    },
  });
}