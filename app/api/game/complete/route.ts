// =============================================================================
// API: /api/game/complete — Record a completed game with full metrics
// app/api/game/complete/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const {
      gameEventId,
      rewardEarned,
      score,
      timeTaken,   // ms
      isWinner,
      metadata,    // JSON string: { accuracy, combo, bestTime, etc. }
    } = await req.json();

    if (!gameEventId || rewardEarned === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if already completed (prevent double-submit)
    const existing = await prismadb.gameParticipation.findFirst({
      where: { userId: user.id, gameEventId },
    });

    let participation;
    if (existing) {
      // Update if somehow called twice
      participation = await prismadb.gameParticipation.update({
        where: { id: existing.id },
        data: {
          rewardEarned: Math.max(existing.rewardEarned, rewardEarned),
          score:        Math.max(existing.score ?? 0, score ?? 0),
          timeTaken:    timeTaken ?? existing.timeTaken,
          isWinner:     isWinner ?? existing.isWinner,
          metadata:     metadata ?? existing.metadata,
        },
      });
    } else {
      participation = await prismadb.gameParticipation.create({
        data: {
          userId:      user.id,
          gameEventId,
          rewardEarned,
          score:       score ?? 0,
          timeTaken:   timeTaken,
          isWinner:    isWinner ?? false,
          metadata:    metadata ? JSON.stringify(metadata) : null,
          completedAt: new Date(),
        },
      });
    }

    // Award tokens
    const wallet = await prismadb.tokenWallet.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, balance: rewardEarned, totalEarned: rewardEarned, totalSpent: 0 },
      update: { balance: { increment: rewardEarned }, totalEarned: { increment: rewardEarned } },
    });

    // Transaction record
    await prismadb.tokenTransaction.create({
      data: {
        userId:      user.id,
        amount:      rewardEarned,
        type:        "GAME_REWARD",
        description: `Game reward`,
        gameEventId,
      },
    });

    // Update streak
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const streak    = await prismadb.userStreak.findUnique({ where: { userId: user.id } });
    let newStreak   = 1;
    if (streak?.lastPlayedAt) {
      const last = new Date(streak.lastPlayedAt); last.setHours(0, 0, 0, 0);
      if (last.getTime() === today.getTime())     newStreak = streak.currentStreak;
      else if (last.getTime() === yesterday.getTime()) newStreak = (streak.currentStreak ?? 0) + 1;
    }
    await prismadb.userStreak.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, currentStreak: 1, longestStreak: 1, lastPlayedAt: today },
      update: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak?.longestStreak ?? 0, newStreak),
        lastPlayedAt:  today,
      },
    });

    // Update user counters
    await prismadb.user.update({
      where: { id: user.id },
      data:  { totalLikes: { increment: 1 } }, // reuse as games played counter
    });

    // Streak milestone bonus (7-day multiple)
    let streakBonus = 0;
    if (newStreak >= 7 && newStreak % 7 === 0) {
      streakBonus = 50;
      await prismadb.tokenWallet.update({
        where: { userId: user.id },
        data:  { balance: { increment: streakBonus }, totalEarned: { increment: streakBonus } },
      });
      await prismadb.tokenTransaction.create({
        data: { userId: user.id, amount: streakBonus, type: "STREAK_BONUS", description: `${newStreak}-day streak bonus!` },
      });
    }

    return NextResponse.json({
      success:      true,
      newBalance:   wallet.balance + streakBonus,
      streakBonus,
      currentStreak: newStreak,
      participation: { id: participation.id, rewardEarned, score },
    });
  } catch (error) {
    console.error("[game/complete]", error);
    return NextResponse.json({ error: "Failed to record game completion" }, { status: 500 });
  }
}