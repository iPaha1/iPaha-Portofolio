// app/api/game/referrals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true, displayName: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get referral code
    let referralCode = await prismadb.referralCode.findUnique({
      where: { userId: user.id },
    });

    if (!referralCode) {
      const code = generateReferralCode(user.displayName || user.email || "user", user.id);
      referralCode = await prismadb.referralCode.create({
        data: {
          userId: user.id,
          code,
          uses: 0,
          isActive: true,
        },
      });
    }

    // Get referrals
    const referrals = await prismadb.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referred: {
          select: { email: true, displayName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const totalEarned = await prismadb.tokenTransaction.aggregate({
      where: {
        userId: user.id,
        type: "REFERRAL",
      },
      _sum: { amount: true },
    });

    const pendingRewards = referrals.filter(r => !r.rewardGiven).length * 50; // 50 tokens per referral

    return NextResponse.json({
      code: referralCode.code,
      referralLink: `https://isaacpaha.com/sign-up?ref=${referralCode.code}`,
      totalReferrals: referrals.length,
      totalEarned: totalEarned._sum.amount || 0,
      pendingRewards,
      referrals: referrals.map(r => ({
        id: r.id,
        email: r.referred?.email || "Unknown",
        status: r.status,
        rewardGiven: r.rewardGiven,
        completedAt: r.completedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[game/referrals] Error:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

function generateReferralCode(displayName: string, userId: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const suffix = userId.slice(-4);
  
  return `${base || "user"}${random}${suffix}`.toUpperCase();
}