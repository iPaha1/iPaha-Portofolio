// =============================================================================
// isaacpaha.com — Business Intelligence Engine — Save / Workspace API
// app/api/tools/business-intelligence/save/route.ts
//
// GET    → fetch saved ideas + workspace stats
// POST   → save or update a business idea (validation + plan results)
// DELETE ?id=xxx → delete idea
// PATCH  ?id=xxx&action=star|notes|status|plan|tags
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ ideas: [], workspace: null });

  const [ideas, workspace] = await Promise.all([
    prismadb.businessIdea.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { updatedAt: "desc" },
      take:    25,
    }),
    prismadb.businessWorkspace.findUnique({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ideas, workspace });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sp   = new URL(req.url).searchParams;
  const type = sp.get("type");  // "validation" | "plan"
  const body = await req.json();

  const {
    id, // if updating an existing record
    ideaName, description, industry, targetMarket, problemSolved,
    uniqueAdvantage, stage, businessModel, location, budget,
    founderBackground, validationResult, planResult,
  } = body;

  const count = await prismadb.businessIdea.count({ where: { userId: user.id, isSaved: true } });

  // Map enums safely
  const STAGE_MAP: Record<string, string>  = { IDEA:"IDEA", VALIDATION:"VALIDATION", MVP:"MVP", EARLY_TRACTION:"EARLY_TRACTION", GROWTH:"GROWTH", ESTABLISHED:"ESTABLISHED" };
  const MODEL_MAP: Record<string, string>  = { SAAS:"SAAS", MARKETPLACE:"MARKETPLACE", E_COMMERCE:"E_COMMERCE", SUBSCRIPTION:"SUBSCRIPTION", AGENCY:"AGENCY", CONTENT:"CONTENT", HARDWARE:"HARDWARE", FRANCHISE:"FRANCHISE", FREEMIUM:"FREEMIUM", OTHER:"OTHER" };
  const VERDICT_MAP: Record<string, string>= { STRONG_BUY:"STRONG_BUY", BUY:"BUY", HOLD:"HOLD", NEEDS_WORK:"NEEDS_WORK", PIVOT_REQUIRED:"PIVOT_REQUIRED" };

  const verdictKey = validationResult?.verdict ?? null;

  // ── UPDATE existing idea (add plan results) ──────────────────────────
  if (id && type === "plan") {
    const updated = await prismadb.businessIdea.updateMany({
      where: { id, userId: user.id },
      data: {
        planJson:      planResult ? JSON.stringify(planResult) : null,
        planGenerated: true,
        status:        "PLAN_COMPLETE",
        updatedAt:     new Date(),
      },
    });
    await upsertWorkspace(user.id, industry, businessModel, "plan");
    return NextResponse.json({ ok: true, updated: updated.count });
  }

  // ── UPDATE existing idea (add validation) ───────────────────────────
  if (id && type === "validation") {
    await prismadb.businessIdea.updateMany({
      where: { id, userId: user.id },
      data: {
        validationJson:    validationResult ? JSON.stringify(validationResult) : null,
        validationScore:   validationResult?.overallScore ?? null,
        validationVerdict: (VERDICT_MAP[verdictKey] ?? null) as any,
        status:            "VALIDATED",
      },
    });
    await upsertWorkspace(user.id, industry, businessModel, "validation");
    return NextResponse.json({ ok: true });
  }

  // ── CREATE new idea ──────────────────────────────────────────────────
  if (count >= 25) {
    return NextResponse.json({ error: "25 saved ideas limit reached. Delete an older one first." }, { status: 429 });
  }

  const saved = await prismadb.businessIdea.create({
    data: {
      userId:          user.id,
      ideaName:        (ideaName ?? "").slice(0, 300),
      description:     (description ?? "").slice(0, 5000),
      industry:        (industry ?? "").slice(0, 200) || null,
      targetMarket:    (targetMarket ?? "").slice(0, 500) || null,
      problemSolved:   (problemSolved ?? "").slice(0, 1000) || null,
      uniqueAdvantage: (uniqueAdvantage ?? "").slice(0, 1000) || null,
      stage:           (STAGE_MAP[stage] ?? "IDEA") as any,
      businessModel:   (MODEL_MAP[businessModel] ?? "OTHER") as any,
      location:        (location ?? "").slice(0, 200) || null,
      budget:          (budget ?? "").slice(0, 100) || null,
      founderBackground:(founderBackground ?? "").slice(0, 1000) || null,
      validationJson:  validationResult ? JSON.stringify(validationResult) : null,
      validationScore: validationResult?.overallScore ?? null,
      validationVerdict: (VERDICT_MAP[verdictKey] ?? null) as any,
      planJson:        planResult ? JSON.stringify(planResult) : null,
      planGenerated:   !!planResult,
      isSaved:         true,
      status:          validationResult ? "VALIDATED" : "DRAFT",
    },
  });

  await upsertWorkspace(user.id, industry, businessModel, "new");
  return NextResponse.json({ ok: true, ideaId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.businessIdea.deleteMany({ where: { id, userId: user.id } });
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

  const STATUS_MAP: Record<string, string> = { DRAFT:"DRAFT", VALIDATED:"VALIDATED", IN_PROGRESS:"IN_PROGRESS", PLAN_COMPLETE:"PLAN_COMPLETE", PITCHING:"PITCHING", LAUNCHED:"LAUNCHED", ARCHIVED:"ARCHIVED" };

  if (action === "star") {
    await prismadb.businessIdea.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "notes") {
    await prismadb.businessIdea.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "status") {
    const statusVal = STATUS_MAP[body.status] ?? "DRAFT";
    await prismadb.businessIdea.updateMany({ where: { id, userId: user.id }, data: { status: statusVal as any } });
    if (statusVal === "LAUNCHED") {
      await prismadb.businessWorkspace.updateMany({ where: { userId: user.id }, data: { launchedIdeas: { increment: 1 } } });
    }
  } else if (action === "tags") {
    await prismadb.businessIdea.updateMany({ where: { id, userId: user.id }, data: { tags: JSON.stringify(body.tags ?? []) } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Workspace upsert ─────────────────────────────────────────────────────────
async function upsertWorkspace(userId: string, industry: string, model: string, type: "new" | "validation" | "plan") {
  const existing = await prismadb.businessWorkspace.findUnique({ where: { userId } });

  if (!existing) {
    await prismadb.businessWorkspace.create({
      data: {
        userId,
        totalIdeas:      type === "new" ? 1 : 0,
        validatedIdeas:  type === "validation" ? 1 : 0,
        completePlans:   type === "plan" ? 1 : 0,
        xpPoints:        40,
        streakDays:      1,
        lastActivityDate: new Date(),
        industriesJson:  industry ? JSON.stringify([{ industry, count: 1 }]) : "[]",
        modelsJson:      model ? JSON.stringify([{ model, count: 1 }]) : "[]",
      },
    });
    return;
  }

  // Update industries
  let industries: { industry: string; count: number }[] = [];
  try { industries = JSON.parse(existing.industriesJson ?? "[]"); } catch {}
  if (industry) {
    const found = industries.find(i => i.industry === industry);
    if (found) found.count += 1;
    else industries.push({ industry, count: 1 });
  }

  // Update models
  let models: { model: string; count: number }[] = [];
  try { models = JSON.parse(existing.modelsJson ?? "[]"); } catch {}
  if (model) {
    const found = models.find(m => m.model === model);
    if (found) found.count += 1;
    else models.push({ model, count: 1 });
  }

  // Streak
  const lastDate  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay   = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  await prismadb.businessWorkspace.update({
    where: { userId },
    data: {
      totalIdeas:     type === "new"        ? { increment: 1 } : undefined,
      validatedIdeas: type === "validation" ? { increment: 1 } : undefined,
      completePlans:  type === "plan"       ? { increment: 1 } : undefined,
      xpPoints:       { increment: 40 + (newStreak > 1 ? 10 : 0) },
      streakDays:     newStreak,
      lastActivityDate: new Date(),
      industriesJson: JSON.stringify(industries),
      modelsJson:     JSON.stringify(models),
    },
  });
}