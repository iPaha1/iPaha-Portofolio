// =============================================================================
// isaacpaha.com — Debt Recovery Planner: Save/Load API
// app/api/tools/debt-planner/save/route.ts
//
// GET            → load profile + active plan + payment logs
// POST (profile) → save/update debt profile
// POST (plan)    → save a generated plan
// POST (payment) → log a payment
// DELETE ?planId → delete a plan
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function getUserId(clerkId: string): Promise<string | null> {
  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  return user?.id ?? null;
}

// ─── GET: load everything for the user ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ profile: null, activePlan: null, payments: [] });

  const [profile, activePlan] = await Promise.all([
    prismadb.debtProfile.findUnique({
      where: { userId },
    }),
    prismadb.repaymentPlan.findFirst({
      where:   { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        payments: { orderBy: { paidAt: "desc" }, take: 50 },
      },
    }),
  ]);

  return NextResponse.json({ profile, activePlan });
}

// ─── POST: multi-purpose save ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Sign in to save your plan" }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sp   = new URL(req.url).searchParams;
  const type = sp.get("type"); // "profile" | "plan" | "payment"
  const body = await req.json();

  // ── Save/update debt profile ──────────────────────────────────────────────

  if (type === "profile") {
    const {
      monthlyIncome, currency = "GBP",
      fixedExpenses, variableExpenses, debts,
      strategy = "AVALANCHE", targetMonths,
    } = body;

    if (!monthlyIncome || !debts?.length) {
      return NextResponse.json({ error: "monthlyIncome and debts are required" }, { status: 400 });
    }

    const totalDebt     = debts.reduce((s: number, d: any) => s + d.balance, 0);
    const totalFixed    = fixedExpenses?.reduce((s: number, e: any) => s + e.amount, 0) ?? 0;
    const totalVariable = variableExpenses?.reduce((s: number, e: any) => s + e.amount, 0) ?? 0;
    const surplus       = monthlyIncome - totalFixed - totalVariable;
    const minimums      = debts.reduce((s: number, d: any) => s + (d.minPayment ?? 0), 0);

    const riskLevel = (() => {
      if (surplus < 0)          return "CRITICAL";
      if (surplus < minimums)   return "HIGH";
      if (surplus < minimums * 1.5) return "MEDIUM";
      return "LOW";
    })();

    const profile = await prismadb.debtProfile.upsert({
      where:  { userId },
      create: {
        userId,
        monthlyIncome,
        currency,
        fixedExpenses:    JSON.stringify(fixedExpenses   ?? []),
        variableExpenses: JSON.stringify(variableExpenses ?? []),
        debts:            JSON.stringify(debts),
        strategy:         strategy as any,
        targetMonths:     targetMonths ?? null,
        totalDebt,
        monthlyMinimums:  minimums,
        monthlySurplus:   surplus,
        riskLevel:        riskLevel as any,
      },
      update: {
        monthlyIncome,
        currency,
        fixedExpenses:    JSON.stringify(fixedExpenses   ?? []),
        variableExpenses: JSON.stringify(variableExpenses ?? []),
        debts:            JSON.stringify(debts),
        strategy:         strategy as any,
        targetMonths:     targetMonths ?? null,
        totalDebt,
        monthlyMinimums:  minimums,
        monthlySurplus:   surplus,
        riskLevel:        riskLevel as any,
      },
    });

    return NextResponse.json({ ok: true, profileId: profile.id });
  }

  // ── Save generated plan ───────────────────────────────────────────────────

  if (type === "plan") {
    const { plan, strategy, profileId } = body;
    if (!plan || !profileId) {
      return NextResponse.json({ error: "plan and profileId required" }, { status: 400 });
    }

    // Archive existing active plans
    await prismadb.repaymentPlan.updateMany({
      where:  { userId, status: "ACTIVE" },
      data:   { status: "ARCHIVED" },
    });

    const snap    = plan.financialSnapshot;
    const label   = `${strategy} Plan — ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
    const payoff  = snap.estimatedMonthsToDebtFree
      ? new Date(Date.now() + snap.estimatedMonthsToDebtFree * 30.5 * 86400000)
      : null;

    const saved = await prismadb.repaymentPlan.create({
      data: {
        userId,
        profileId,
        label,
        strategy:             strategy as any,
        status:               "ACTIVE",
        planJson:             JSON.stringify(plan.monthlyPlan ?? []),
        weeklyActions:        JSON.stringify(plan.weeklyActions ?? []),
        insights:             JSON.stringify(plan.insights ?? []),
        totalDebtAtStart:     snap.totalDebt ?? 0,
        estimatedMonths:      snap.estimatedMonthsToDebtFree ?? 0,
        estimatedPayoffDate:  payoff,
        monthlyPayment:       snap.recommendedMonthlyPayment ?? 0,
        totalInterest:        snap.totalInterestEstimate ?? 0,
        remainingDebt:        snap.totalDebt ?? 0,
      },
    });

    return NextResponse.json({ ok: true, planId: saved.id });
  }

  // ── Log a payment ─────────────────────────────────────────────────────────

  if (type === "payment") {
    const { planId, amount, debtLabel, note } = body;
    if (!planId || !amount || amount <= 0) {
      return NextResponse.json({ error: "planId and positive amount required" }, { status: 400 });
    }

    // Verify plan belongs to user
    const plan = await prismadb.repaymentPlan.findFirst({
      where: { id: planId, userId }, select: { id: true, remainingDebt: true, totalDebtAtStart: true },
    });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const [log] = await Promise.all([
      prismadb.paymentLog.create({ data: { planId, userId, amount, debtLabel: debtLabel ?? null, note: note ?? null } }),
      prismadb.repaymentPlan.update({
        where: { id: planId },
        data: {
          paidToDate:   { increment: amount },
          remainingDebt: Math.max(0, plan.remainingDebt - amount),
          isCompleted:  plan.remainingDebt - amount <= 0,
          completedAt:  plan.remainingDebt - amount <= 0 ? new Date() : null,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, paymentId: log.id });
  }

  return NextResponse.json({ error: "Unknown type — use ?type=profile|plan|payment" }, { status: 400 });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const planId = new URL(req.url).searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

  await prismadb.repaymentPlan.deleteMany({ where: { id: planId, userId } });
  return NextResponse.json({ ok: true });
}