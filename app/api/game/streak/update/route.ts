// =============================================================================
// API: Streak Update WITH TOKEN ECONOMY
// app/api/game/streak/update/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { tokenEconomy } from "@/lib/game/token-economy-manager";

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

    // Get today's earnings first
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTransactions = await prismadb.tokenTransaction.aggregate({
      where: {
        userId: user.id,
        type: "GAME_REWARD",
        createdAt: { gte: today },
      },
      _sum: {
        amount: true,
      },
    });
    
    const todaysEarnings = todaysTransactions._sum.amount || 0;

    let streak = await prismadb.userStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await prismadb.userStreak.create({
        data: { userId: user.id },
      });
    }
    
    const lastPlayed = streak.lastPlayedAt ? new Date(streak.lastPlayedAt) : null;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = streak.currentStreak;
    let streakBonus = 0;
    
    if (!lastPlayed || lastPlayed < yesterday) {
      newStreak = 1;
    } else if (lastPlayed && lastPlayed.toDateString() === yesterday.toDateString()) {
      newStreak = streak.currentStreak + 1;
    } else if (lastPlayed && lastPlayed.toDateString() === today.toDateString()) {
      return NextResponse.json({ currentStreak: streak.currentStreak });
    }
    
    // ============================================================
    // USE ECONOMY MANAGER FOR STREAK BONUS
    // ============================================================
    if (newStreak >= 7 && newStreak % 7 === 0) {
      // Calculate reward using economy manager
      const reward = tokenEconomy.calculateReward(
        "daily_challenge",
        "completed",
        newStreak,
        todaysEarnings
      );
      console.log(`[Streak] Calculated reward for ${newStreak} day streak:`, reward);
      
      streakBonus = reward.finalReward;
      console.log(`[Streak] Applying bonus of ${streakBonus} tokens for user ${user.id} (Daily earnings: ${todaysEarnings}/${tokenEconomy.getMaxDailyTokens()})`);
      
      if (streakBonus > 0) {
        await prismadb.tokenWallet.update({
          where: { userId: user.id },
          data: { 
            balance: { increment: streakBonus }, 
            totalEarned: { increment: streakBonus } 
          },
        });
        console.log(`[Streak] Updated wallet for user ${user.id} with bonus, new balance will reflect on next fetch`);
        
        await prismadb.tokenTransaction.create({
          data: {
            userId: user.id,
            amount: streakBonus,
            type: "STREAK_BONUS",
            description: `${newStreak} day streak! +${streakBonus} tokens (Daily cap: ${todaysEarnings}/${tokenEconomy.getMaxDailyTokens()})`,
          },
        });
        console.log(`[Streak] Created transaction for user ${user.id} for streak bonus`);
        console.log(`[Streak] User ${user.id} earned a streak bonus of ${streakBonus} tokens for a ${newStreak}-day streak!`);
      } else {
        // Log that user hit daily cap
        console.log(`[Streak] User ${user.id} hit daily cap, no bonus awarded`);
      }
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
      dailyCapRemaining: tokenEconomy.getMaxDailyTokens() - (todaysEarnings + streakBonus),
      economics: {
        daysToEarnOneDollar: tokenEconomy.getMaxDailyTokens() > 0 ? 
          Math.ceil(1 / (tokenEconomy.getMaxDailyTokens() * 0.00083)) : 30,
      }
    });
  } catch (error) {
    console.error("[game/streak/update] Error:", error);
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
  }
}









// // =============================================================================
// // API: Streak Update
// // app/api/game/streak/update/route.ts
// // =============================================================================

// // app/api/game/streak/update/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prismadb } from "@/lib/db";
// import { getAuth } from "@clerk/nextjs/server";

// export async function POST(req: NextRequest) {
//   try {
//     const { userId: clerkId } = getAuth(req);
//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await prismadb.user.findUnique({
//       where: { clerkId },
//       select: { id: true },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     let streak = await prismadb.userStreak.findUnique({
//       where: { userId: user.id },
//     });

//     if (!streak) {
//       streak = await prismadb.userStreak.create({
//         data: { userId: user.id },
//       });
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const lastPlayed = streak.lastPlayedAt ? new Date(streak.lastPlayedAt) : null;
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);
    
//     let newStreak = streak.currentStreak;
//     let streakBonus = 0;
    
//     if (!lastPlayed || lastPlayed < yesterday) {
//       // Missed a day - reset streak
//       newStreak = 1;
//     } else if (lastPlayed && lastPlayed.toDateString() === yesterday.toDateString()) {
//       // Played yesterday - increment streak
//       newStreak = streak.currentStreak + 1;
//     } else if (lastPlayed && lastPlayed.toDateString() === today.toDateString()) {
//       // Already played today - no change
//       return NextResponse.json({ currentStreak: streak.currentStreak });
//     }
    
//     // Apply streak bonus
//     if (newStreak >= 7 && newStreak % 7 === 0) {
//       streakBonus = 50;
//       await prismadb.tokenWallet.update({
//         where: { userId: user.id },
//         data: { balance: { increment: streakBonus }, totalEarned: { increment: streakBonus } },
//       });
      
//       await prismadb.tokenTransaction.create({
//         data: {
//           userId: user.id,
//           amount: streakBonus,
//           type: "STREAK_BONUS",
//           description: `${newStreak} day streak bonus!`,
//         },
//       });
//     }
    
//     const updated = await prismadb.userStreak.update({
//       where: { userId: user.id },
//       data: {
//         currentStreak: newStreak,
//         longestStreak: Math.max(streak.longestStreak, newStreak),
//         lastPlayedAt: today,
//       },
//     });
    
//     return NextResponse.json({
//       currentStreak: updated.currentStreak,
//       longestStreak: updated.longestStreak,
//       streakBonus,
//     });
//   } catch (error) {
//     console.error("[game/streak/update] Error:", error);
//     return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
//   }
// }