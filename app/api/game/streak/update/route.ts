// =============================================================================
// API: Streak Update
// app/api/game/streak/update/route.ts
// =============================================================================

// app/api/game/streak/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let streak = await prismadb.userStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await prismadb.userStreak.create({
        data: { userId: user.id },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastPlayed = streak.lastPlayedAt ? new Date(streak.lastPlayedAt) : null;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = streak.currentStreak;
    let streakBonus = 0;
    
    if (!lastPlayed || lastPlayed < yesterday) {
      // Missed a day - reset streak
      newStreak = 1;
    } else if (lastPlayed && lastPlayed.toDateString() === yesterday.toDateString()) {
      // Played yesterday - increment streak
      newStreak = streak.currentStreak + 1;
    } else if (lastPlayed && lastPlayed.toDateString() === today.toDateString()) {
      // Already played today - no change
      return NextResponse.json({ currentStreak: streak.currentStreak });
    }
    
    // Apply streak bonus
    if (newStreak >= 7 && newStreak % 7 === 0) {
      streakBonus = 50;
      await prismadb.tokenWallet.update({
        where: { userId: user.id },
        data: { balance: { increment: streakBonus }, totalEarned: { increment: streakBonus } },
      });
      
      await prismadb.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: streakBonus,
          type: "STREAK_BONUS",
          description: `${newStreak} day streak bonus!`,
        },
      });
    }
    
    const updated = await prismadb.userStreak.update({
      where: { userId: user.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastPlayedAt: today,
      },
    });
    
    return NextResponse.json({
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      streakBonus,
    });
  } catch (error) {
    console.error("[game/streak/update] Error:", error);
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
  }
}