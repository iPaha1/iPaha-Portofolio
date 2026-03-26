// =============================================================================
// API: /api/game/stats — Full user game stats for the Game Page
// app/api/game/stats/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Parallel fetch everything
    const [wallet, streak, settings, participations, achievements] = await Promise.all([
      prismadb.tokenWallet.findUnique({ where: { userId: user.id } }),
      prismadb.userStreak.findUnique({ where: { userId: user.id } }),
      prismadb.gameSettings.findUnique({ where: { userId: user.id } }),
      prismadb.gameParticipation.findMany({
        where: { userId: user.id },
        include: { gameEvent: { select: { type: true, title: true, isFlash: true } } },
        orderBy: { completedAt: "desc" },
        take: 100,
      }),
      prismadb.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
      }),
    ]);

    // Per-game best scores
    const gameBreakdown: Record<string, { played: number; bestScore: number; bestReward: number; totalEarned: number }> = {};
    for (const p of participations) {
      const type = p.gameEvent?.type ?? "UNKNOWN";
      if (!gameBreakdown[type]) gameBreakdown[type] = { played: 0, bestScore: 0, bestReward: 0, totalEarned: 0 };
      gameBreakdown[type].played      += 1;
      gameBreakdown[type].bestScore    = Math.max(gameBreakdown[type].bestScore,  p.score ?? 0);
      gameBreakdown[type].bestReward   = Math.max(gameBreakdown[type].bestReward, p.rewardEarned);
      gameBreakdown[type].totalEarned += p.rewardEarned;
    }

    // Recent history (last 20)
    const recent = participations.slice(0, 20).map(p => ({
      id:          p.id,
      gameType:    p.gameEvent?.type ?? "UNKNOWN",
      gameTitle:   p.gameEvent?.title ?? "Game",
      isFlash:     p.gameEvent?.isFlash ?? false,
      score:       p.score ?? 0,
      reward:      p.rewardEarned,
      isWinner:    p.isWinner,
      completedAt: p.completedAt,
    }));

    const totalGames   = participations.length;
    const totalEarned  = participations.reduce((s, p) => s + p.rewardEarned, 0);
    const avgScore     = totalGames > 0
      ? Math.round(participations.reduce((s, p) => s + (p.score ?? 0), 0) / totalGames)
      : 0;
    const winRate      = totalGames > 0
      ? Math.round((participations.filter(p => p.isWinner).length / totalGames) * 100)
      : 0;

    return NextResponse.json({
      user: { displayName: user.displayName, avatarUrl: user.avatarUrl },
      wallet:   { balance: wallet?.balance ?? 0, totalEarned: wallet?.totalEarned ?? 0, totalSpent: wallet?.totalSpent ?? 0 },
      streak:   { current: streak?.currentStreak ?? 0, longest: streak?.longestStreak ?? 0, lastPlayed: streak?.lastPlayedAt },
      settings: { gameEnabled: settings?.gameEnabled ?? true, soundEnabled: settings?.soundEnabled ?? true },
      stats:    { totalGames, totalEarned, avgScore, winRate },
      gameBreakdown,
      recent,
      achievements: achievements.map(a => ({
        id: a.achievementId, name: a.achievement.name, icon: a.achievement.icon,
        rarity: a.achievement.rarity, unlockedAt: a.unlockedAt,
      })),
    });
  } catch (error) {
    console.error("[game/stats]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}