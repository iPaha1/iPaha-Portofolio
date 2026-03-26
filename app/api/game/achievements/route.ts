// =============================================================================
// API: Achievements
// app/api/game/achievements/route.ts
// =============================================================================


// app/api/game/achievements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get database user ID
    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all achievements with user progress
    const achievements = await prismadb.achievement.findMany({
      include: {
        category: true,
        userAchievements: {
          where: { userId: user.id },
        },
      },
      orderBy: {
        category: { sortOrder: "asc" },
      },
    });

    // Get user stats
    const stats = await prismadb.$transaction([
      prismadb.achievement.count(),
      prismadb.userAchievement.count({ where: { userId: user.id } }),
      prismadb.tokenTransaction.aggregate({
        where: { userId: user.id, type: "ACHIEVEMENT" },
        _sum: { amount: true },
      }),
    ]);

    const formattedAchievements = achievements.map((ach) => {
      const userAchievement = ach.userAchievements[0];
      const requirement = JSON.parse(ach.requirement);
      
      return {
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        rarity: ach.rarity,
        rewardTokens: ach.rewardTokens,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt?.toISOString(),
        progress: userAchievement?.progress,
        totalRequired: requirement.totalRequired,
        isHidden: ach.isHidden,
      };
    });

    return NextResponse.json({
      achievements: formattedAchievements,
      stats: {
        total: stats[0],
        unlocked: stats[1],
        totalRewards: stats[2]._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("[achievements] Error:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}