// =============================================================================
// isaacpaha.com — First Home Planner: Save / Load Plan API
// app/api/tools/home-planner/save/route.ts
//
// GET  → load user's saved plan + milestone progress
// POST → save / update plan
// PATCH ?action=milestone → mark milestone achieved
// DELETE → delete plan
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null);

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json(null);

  const plan = await prismadb.homeOwnershipPlan.findFirst({
    where:   { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { milestones: { orderBy: { targetMonth: "asc" } } },
  });

  return NextResponse.json(plan);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save your plan" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const {
    label, monthlyIncome, currentSavings, monthlyExpenses, existingDebt,
    targetPrice, depositPercent, timeframeMonths, propertyType, location,
    currency, creditScore, isFirstTimeBuyer, plan,
  } = await req.json();

  if (!plan) return NextResponse.json({ error: "plan is required" }, { status: 400 });

  const snap = plan.readinessSnapshot;

  // Upsert — one plan per user (replace on re-generate)
  const existing = await prismadb.homeOwnershipPlan.findFirst({
    where: { userId: user.id },
  });

  const planData = {
    label:                  label ?? `${propertyType} — ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`,
    monthlyIncome:          monthlyIncome  ?? 0,
    currentSavings:         currentSavings ?? 0,
    monthlyExpenses:        monthlyExpenses ?? 0,
    existingDebt:           existingDebt   ?? 0,
    targetPrice:            targetPrice    ?? 0,
    depositPercent:         depositPercent ?? 10,
    timeframeMonths:        timeframeMonths ?? 36,
    propertyType:           propertyType   ?? "flat",
    location:               location       ?? null,
    currency:               currency       ?? "GBP",
    creditScore:            creditScore    ?? null,
    isFirstTimeBuyer:       isFirstTimeBuyer ?? true,
    overallReadinessScore:  snap?.overallReadinessScore  ?? 0,
    depositReadinessScore:  snap?.depositReadinessScore  ?? 0,
    incomeReadinessScore:   snap?.incomeReadinessScore   ?? 0,
    creditReadinessScore:   snap?.creditReadinessScore   ?? 0,
    realisticTimelineMonths: snap?.realisticTimelineMonths ?? 0,
    realisticTargetDate:    snap?.realisticTargetDate    ?? null,
    planJson:               JSON.stringify(plan),
    updatedAt:              new Date(),
  };

  let saved;
  if (existing) {
    saved = await prismadb.homeOwnershipPlan.update({
      where: { id: existing.id },
      data:  planData,
    });
    // Delete old milestones — will regenerate
    await prismadb.homeMilestone.deleteMany({ where: { planId: existing.id } });
  } else {
    saved = await prismadb.homeOwnershipPlan.create({
      data: { userId: user.id, ...planData },
    });
  }

  // Create milestones from deposit plan
  const milestones = plan.depositPlan?.depositMilestones ?? [];
  if (milestones.length) {
    await prismadb.homeMilestone.createMany({
      data: milestones.map((m: any) => ({
        planId:       saved.id,
        label:        m.milestone,
        targetAmount: m.amount,
        targetMonth:  m.estimatedMonth,
        isAchieved:   false,
      })),
    });
  }

  return NextResponse.json({ ok: true, planId: saved.id });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const action = sp.get("action");
  const body   = await req.json();

  if (action === "milestone") {
    const { milestoneId, isAchieved } = body;
    await prismadb.homeMilestone.updateMany({
      where: { id: milestoneId },
      data:  { isAchieved, achievedAt: isAchieved ? new Date() : null },
    });
    // Award XP if achieved (future feature hook)
    return NextResponse.json({ ok: true });
  }

  if (action === "savings") {
    // Update current savings snapshot
    const { currentSavings } = body;
    await prismadb.homeOwnershipPlan.updateMany({
      where: { userId: user.id },
      data:  { currentSavings, updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prismadb.homeOwnershipPlan.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}