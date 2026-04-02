// =============================================================================
// API: Award Tokens WITH TOKEN ECONOMY
// app/api/game/award/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { tokenEconomy } from "@/lib/game/token-economy-manager";

export async function POST(req: NextRequest) {
  console.log("[game/award] Received award request");
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

    const { 
      amount, 
      reason, 
      gameId, 
      gameType, 
      performance, 
      currentStreak 
    } = await req.json();
    console.log(`[game/award] Request details: gameType=${gameType}, performance=${performance}, currentStreak=${currentStreak}, amount=${amount}`);

    // Validate required fields for economy management
    if (!gameType || !performance) {
      return NextResponse.json({ 
        error: "Missing required fields: gameType and performance" 
      }, { status: 400 });
    }

    // Get today's earnings FIRST (critical for cap enforcement)
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
    console.log(`[game/award] Today's transactions for user ${user.id}:`, todaysTransactions);
    
    const todaysEarnings = todaysTransactions._sum.amount || 0;
    console.log(`[game/award] User ${user.id} has earned ${todaysEarnings} tokens today before this award.`);

    // Calculate reward using economy manager
    const reward = tokenEconomy.calculateReward(
      gameType,
      performance,
      currentStreak || 0,
      todaysEarnings
    );
    console.log(`[game/award] Calculated reward for user ${user.id}:`, reward);
    console.log(`[game/award] User ${user.id} would earn ${reward.finalReward} tokens for this performance.`);
    console.log(`[game/award] Daily earnings after this award would be ${todaysEarnings + reward.finalReward}/${tokenEconomy.getMaxDailyTokens()}`);
    console.log(`[game/award] USD value of this reward: $${reward.usdValue.toFixed(4)}`);
    console.log(`[game/award] Days to earn $1 at current rate: ${reward.daysToEarnOneDollar}`);

    // If user hit daily cap, return early with info
    if (reward.finalReward === 0) {
      const maxDaily = tokenEconomy.getMaxDailyTokens();
      return NextResponse.json({
        success: false,
        reason: "DAILY_CAP_REACHED",
        message: `You've reached today's earning limit (${maxDaily} tokens). Come back tomorrow for more rewards!`,
        todaysEarnings,
        dailyCap: maxDaily,
        remainingToday: maxDaily - todaysEarnings,
        usdValue: 0,
      }, { status: 200 }); // Still 200 OK, just not awarding
    }
    console.log(`[game/award] Awarding ${reward.finalReward} tokens to user ${user.id}`);

    // Optional: If client provided amount, validate it against economy calculation
    if (amount && amount !== reward.finalReward) {
      console.warn(`[game/award] Amount mismatch: client=${amount}, economy=${reward.finalReward}. Using economy value.`);
    }
    console.log(`[game/award] Final decision: awarding ${reward.finalReward} tokens to user ${user.id} for ${reason}`);

    // Get or create wallet using database ID
    let wallet = await prismadb.tokenWallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prismadb.tokenWallet.create({
        data: { 
          userId: user.id, 
          balance: 0, 
          totalEarned: 0, 
          totalSpent: 0 
        },
      });
    }

    // Update wallet with ECONOMY-CALCULATED amount
    const updated = await prismadb.tokenWallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: reward.finalReward },
        totalEarned: { increment: reward.finalReward },
        lastUpdated: new Date(),
      },
    });
    console.log(`[game/award] Updated wallet for user ${user.id}. New balance: ${updated.balance}, Total earned: ${updated.totalEarned}`);
    console.log(`[game/award] Transaction details for user ${user.id}:`, reward);

    // Create transaction with detailed economics metadata
    await prismadb.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: reward.finalReward,
        type: "GAME_REWARD",
        description: `${reason} | ${gameType} | ${performance} | ${reward.streakMultiplier}x streak | Daily: ${todaysEarnings + reward.finalReward}/${tokenEconomy.getMaxDailyTokens()}`,
        gameEventId: gameId,
        metadata: JSON.stringify({
          gameType,
          performance,
          baseReward: reward.baseReward,
          streakMultiplier: reward.streakMultiplier,
          streakUsed: currentStreak || 0,
          todaysEarningsBefore: todaysEarnings,
          dailyCap: tokenEconomy.getMaxDailyTokens(),
        }),
      },
    });
    console.log(`[game/award] Created transaction for user ${user.id} for this award.`);
    console.log(`[game/award] User ${user.id} earned ${reward.finalReward} tokens for ${reason} (Game: ${gameType}, Performance: ${performance}, Streak: ${currentStreak || 0}). Daily earnings now at ${todaysEarnings + reward.finalReward}/${tokenEconomy.getMaxDailyTokens()}. USD value: $${reward.usdValue.toFixed(4)}. Days to earn $1: ${reward.daysToEarnOneDollar}`);

    // Update participation if game exists
    if (gameId) {
      await prismadb.gameParticipation.create({
        data: {
          userId: user.id,
          gameEventId: gameId,
          rewardEarned: reward.finalReward,
          completedAt: new Date(),
          metadata: JSON.stringify({
            gameType,
            performance,
            baseReward: reward.baseReward,
            streakMultiplier: reward.streakMultiplier,
          }),
        },
      });
    }
    console.log(`[game/award] Updated game participation for user ${user.id} for game ${gameId}`);

    // Calculate progress to next reward tier (for gamification)
    const nextMilestone = Math.ceil((todaysEarnings + reward.finalReward) / 10) * 10;
    const progressToNextMilestone = ((todaysEarnings + reward.finalReward) % 10) * 10;

    return NextResponse.json({
      success: true,
      newBalance: updated.balance,
      awarded: reward.finalReward,
      usdValue: reward.usdValue.toFixed(4),
      economics: {
        baseReward: reward.baseReward,
        streakMultiplier: reward.streakMultiplier,
        todaysEarnings: todaysEarnings + reward.finalReward,
        dailyCapRemaining: tokenEconomy.getMaxDailyTokens() - (todaysEarnings + reward.finalReward),
        daysToEarnOneDollar: reward.daysToEarnOneDollar,
      },
      gamification: {
        nextMilestone: nextMilestone,
        progressToNextMilestone: progressToNextMilestone,
        message: getMilestoneMessage(todaysEarnings + reward.finalReward),
      }
    });
  } catch (error) {
    console.error("[game/award] Error:", error);
    return NextResponse.json({ 
      error: "Failed to award tokens",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Helper function for gamification messages
function getMilestoneMessage(dailyTotal: number): string {
  if (dailyTotal >= tokenEconomy.getMaxDailyTokens()) {
    return "🎉 You've maxed out today's earnings! Great job! Come back tomorrow for more!";
  }
  if (dailyTotal >= 30) {
    return "🔥 On fire! You're close to today's limit!";
  }
  if (dailyTotal >= 20) {
    return "⭐ Great progress! Keep going!";
  }
  if (dailyTotal >= 10) {
    return "👍 Good start! Play more to earn more!";
  }
  return "🎮 Play games to earn free tokens!";
}







// // =============================================================================
// // API: Award Tokens
// // app/api/game/award/route.ts
// // =============================================================================

// // app/api/game/award/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prismadb } from "@/lib/db";
// import { getAuth } from "@clerk/nextjs/server";

// export async function POST(req: NextRequest) {
//   try {
//     const { userId: clerkId } = getAuth(req);
//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Get database user ID
//     const user = await prismadb.user.findUnique({
//       where: { clerkId },
//       select: { id: true },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const { amount, reason, gameId } = await req.json();

//     if (!amount || amount <= 0) {
//       return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
//     }

//     // Get or create wallet using database ID
//     let wallet = await prismadb.tokenWallet.findUnique({
//       where: { userId: user.id },
//     });

//     if (!wallet) {
//       wallet = await prismadb.tokenWallet.create({
//         data: { 
//           userId: user.id, 
//           balance: 0, 
//           totalEarned: 0, 
//           totalSpent: 0 
//         },
//       });
//     }

//     // Update wallet
//     const updated = await prismadb.tokenWallet.update({
//       where: { userId: user.id },
//       data: {
//         balance: { increment: amount },
//         totalEarned: { increment: amount },
//         lastUpdated: new Date(),
//       },
//     });

//     // Create transaction
//     await prismadb.tokenTransaction.create({
//       data: {
//         userId: user.id,
//         amount,
//         type: "GAME_REWARD",
//         description: reason,
//         gameEventId: gameId,
//       },
//     });

//     // Update participation if game exists
//     if (gameId) {
//       await prismadb.gameParticipation.create({
//         data: {
//           userId: user.id,
//           gameEventId: gameId,
//           rewardEarned: amount,
//           completedAt: new Date(),
//         },
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       newBalance: updated.balance,
//     });
//   } catch (error) {
//     console.error("[game/award] Error:", error);
//     return NextResponse.json({ error: "Failed to award tokens" }, { status: 500 });
//   }
// }