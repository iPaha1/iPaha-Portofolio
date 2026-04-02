// =============================================================================
// API: /api/game/complete — Record a completed game with full metrics
// WITH TOKEN ECONOMY INTEGRATION
// app/api/game/complete/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { tokenEconomy } from "@/lib/game/token-economy-manager";

export async function POST(req: NextRequest) {
  console.log("[game/complete] Received game completion request");
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
      rewardEarned,      // Will be overridden by economy manager
      score,
      timeTaken,         // ms
      isWinner,
      gameType,          // REQUIRED: "memory" | "quiz" | "puzzle" | "daily_challenge"
      performance,       // REQUIRED: "win" | "perfect" | "solved" | "completed" etc.
      metadata,          // JSON string: { accuracy, combo, bestTime, etc. }
    } = await req.json();
    console.log(`[game/complete] Payload for user ${user.id}:`, {
      gameEventId,
      rewardEarned,
      score,
      timeTaken,
      isWinner,
      gameType,
      performance,
      metadata
    });

    // Validate required fields
    if (!gameEventId) {
      return NextResponse.json({ error: "Missing gameEventId" }, { status: 400 });
    }
    
    if (!gameType || !performance) {
      return NextResponse.json({ 
        error: "Missing required fields: gameType and performance" 
      }, { status: 400 });
    }

    // ============================================================
    // 1. GET TODAY'S EARNINGS FOR CAP CHECKING
    // ============================================================
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    
    const todaysTransactions = await prismadb.tokenTransaction.aggregate({
      where: {
        userId: user.id,
        type: "GAME_REWARD",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });
    console.log(`[game/complete] Today's transactions for user ${user.id}:`, todaysTransactions);
    
    const todaysEarnings = todaysTransactions._sum.amount || 0;
    console.log(`[game/complete] User ${user.id} has earned ${todaysEarnings} tokens today before this award.`);

    // ============================================================
    // 2. GET CURRENT STREAK
    // ============================================================
    let streak = await prismadb.userStreak.findUnique({ 
      where: { userId: user.id } 
    });
    
    let currentStreak = streak?.currentStreak || 0;
    console.log(`[game/complete] User ${user.id} has a current streak of ${currentStreak}`);

    // ============================================================
    // 3. CALCULATE REWARD USING ECONOMY MANAGER
    // ============================================================
    const reward = tokenEconomy.calculateReward(
      gameType,
      performance,
      currentStreak,
      todaysEarnings
    );
    console.log(`[game/complete] Calculated reward for user ${user.id}:`, reward);

    // ============================================================
    // 4. CHECK IF USER HIT DAILY CAP
    // ============================================================
    if (reward.finalReward === 0) {
      const maxDaily = tokenEconomy.getMaxDailyTokens();
      return NextResponse.json({
        success: false,
        reason: "DAILY_CAP_REACHED",
        message: `You've reached today's earning limit (${maxDaily} tokens). Come back tomorrow for more rewards!`,
        todaysEarnings,
        dailyCap: maxDaily,
        remainingToday: maxDaily - todaysEarnings,
      }, { status: 200 });
    }
    console.log(`[game/complete] User ${user.id} is within daily earning limit.`);

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
          rewardEarned: Math.max(existing.rewardEarned, reward.finalReward),
          score:        Math.max(existing.score ?? 0, score ?? 0),
          timeTaken:    timeTaken ?? existing.timeTaken,
          isWinner:     isWinner ?? existing.isWinner,
          metadata:     metadata ? JSON.stringify(metadata) : existing.metadata,
        },
      });
    } else {
      participation = await prismadb.gameParticipation.create({
        data: {
          userId:      user.id,
          gameEventId,
          rewardEarned: reward.finalReward,
          score:       score ?? 0,
          timeTaken:   timeTaken,
          isWinner:    isWinner ?? false,
          metadata:    metadata ? JSON.stringify({
            ...metadata,
            economyApplied: {
              baseReward: reward.baseReward,
              streakMultiplier: reward.streakMultiplier,
              dailyCapApplied: tokenEconomy.getMaxDailyTokens(),
            }
          }) : JSON.stringify({ economyApplied: true }),
          completedAt: new Date(),
        },
      });
    }
    console.log(`[game/complete] Recorded game participation for user ${user.id} for game event ${gameEventId}`);
    console.log(`[game/complete] Participation details:`, participation);

    // ============================================================
    // 5. AWARD TOKENS (USING ECONOMY-CALCULATED AMOUNT)
    // ============================================================
    const wallet = await prismadb.tokenWallet.upsert({
      where:  { userId: user.id },
      create: { 
        userId: user.id, 
        balance: reward.finalReward, 
        totalEarned: reward.finalReward, 
        totalSpent: 0 
      },
      update: { 
        balance: { increment: reward.finalReward }, 
        totalEarned: { increment: reward.finalReward } 
      },
    });
    console.log(`[game/complete] Updated wallet for user ${user.id}. New balance: ${wallet.balance}, Total earned: ${wallet.totalEarned}`);


    // Transaction record with economics metadata
    await prismadb.tokenTransaction.create({
      data: {
        userId:      user.id,
        amount:      reward.finalReward,
        type:        "GAME_REWARD",
        description: `${gameType} | ${performance} | ${reward.streakMultiplier}x streak | Daily: ${todaysEarnings + reward.finalReward}/${tokenEconomy.getMaxDailyTokens()}`,
        gameEventId,
        metadata: JSON.stringify({  
          gameType,
          performance,
          baseReward: reward.baseReward,
          streakMultiplier: reward.streakMultiplier,
          streakUsed: currentStreak,
          todaysEarningsBefore: todaysEarnings,
          dailyCap: tokenEconomy.getMaxDailyTokens(),
          score,
          timeTaken,
          isWinner,
        }),
      },
    });
    console.log(`[game/complete] Created transaction for user ${user.id} for this completion.`);

    // ============================================================
    // 6. UPDATE STREAK (WITH ECONOMY BONUS)
    // ============================================================
    const yesterday = new Date(today); 
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = 1;
    if (streak?.lastPlayedAt) {
      const last = new Date(streak.lastPlayedAt); 
      last.setHours(0, 0, 0, 0);
      if (last.getTime() === today.getTime()) {
        newStreak = streak.currentStreak;
      } else if (last.getTime() === yesterday.getTime()) {
        newStreak = (streak.currentStreak ?? 0) + 1;
      }
    }
    
    await prismadb.userStreak.upsert({
      where:  { userId: user.id },
      create: { 
        userId: user.id, 
        currentStreak: 1, 
        longestStreak: 1, 
        lastPlayedAt: today 
      },
      update: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak?.longestStreak ?? 0, newStreak),
        lastPlayedAt:  today,
      },
    });
    console.log(`[game/complete] Updated streak for user ${user.id}. Current streak: ${newStreak}, Longest streak: ${Math.max(streak?.longestStreak ?? 0, newStreak)}`);

    // ============================================================
    // 7. STREAK MILESTONE BONUS (WITH ECONOMY CAP)
    // ============================================================
    let streakBonus = 0;
    if (newStreak >= 7 && newStreak % 7 === 0) {
      // Re-check daily cap for streak bonus
      const updatedTodaysEarnings = todaysEarnings + reward.finalReward;
      console.log(`[game/complete] Updated today's earnings for user ${user.id}: ${updatedTodaysEarnings}`);
      if (updatedTodaysEarnings < tokenEconomy.getMaxDailyTokens()) {
        const streakReward = tokenEconomy.calculateReward(
          "daily_challenge",
          "completed",
          newStreak,
          updatedTodaysEarnings
        );
        
        streakBonus = streakReward.finalReward;
        console.log(`[game/complete] Calculated streak bonus for user ${user.id} at ${newStreak} day streak:`, streakReward);
        
        if (streakBonus > 0) {
          await prismadb.tokenWallet.update({
            where: { userId: user.id },
            data: { 
              balance: { increment: streakBonus }, 
              totalEarned: { increment: streakBonus } 
            },
          });
          
          await prismadb.tokenTransaction.create({
            data: { 
              userId: user.id, 
              amount: streakBonus, 
              type: "STREAK_BONUS", 
              description: `${newStreak}-day streak bonus! (+${streakBonus} tokens, capped at ${tokenEconomy.getMaxDailyTokens()}/day)` 
            },
          });
        }
      }
    }
    console.log(`[game/complete] Streak bonus for user ${user.id}: ${streakBonus} tokens`);

    // ============================================================
    // 8. UPDATE USER COUNTERS
    // ============================================================
    await prismadb.user.update({
      where: { id: user.id },
      data:  { totalLikes: { increment: 1 } }, // reuse as games played counter
    });
    console.log(`[game/complete] Updated user counters for user ${user.id}`);

    // ============================================================
    // 9. RETURN RESPONSE WITH ECONOMICS DATA
    // ============================================================
    const totalDailyEarnings = todaysEarnings + reward.finalReward + streakBonus;
    console.log(`[game/complete] Total daily earnings for user ${user.id} after this completion: ${totalDailyEarnings}/${tokenEconomy.getMaxDailyTokens()}`);
    const dailyCapRemaining = Math.max(0, tokenEconomy.getMaxDailyTokens() - totalDailyEarnings);
    console.log(`[game/complete] Daily cap remaining for user ${user.id}: ${dailyCapRemaining} tokens`);
    
    return NextResponse.json({
      success:      true,
      newBalance:   wallet.balance + streakBonus,
      awarded: {
        gameReward: reward.finalReward,
        streakBonus: streakBonus,
        total: reward.finalReward + streakBonus,
      },
      economics: {
        baseReward: reward.baseReward,
        streakMultiplier: reward.streakMultiplier,
        todaysEarnings: totalDailyEarnings,
        dailyCap: tokenEconomy.getMaxDailyTokens(),
        dailyCapRemaining,
        daysToEarnOneDollar: tokenEconomy.getMaxDailyTokens() > 0 ? 
          Math.ceil(1 / (tokenEconomy.getMaxDailyTokens() * 0.00083)) : 30,
        usdValueToday: (totalDailyEarnings * 0.00083).toFixed(4),
      },
      streak: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak?.longestStreak ?? 0, newStreak),
      },
      participation: { 
        id: participation.id, 
        rewardEarned: reward.finalReward, 
        score 
      },
      message: dailyCapRemaining === 0 ? 
        "🎉 You've maxed out today's earnings! Great job! Come back tomorrow for more!" :
        `✨ You earned ${reward.finalReward} tokens! ${dailyCapRemaining} left today.`
    });
  } catch (error) {
    console.error("[game/complete]", error);
    return NextResponse.json({ 
      error: "Failed to record game completion",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}






// // =============================================================================
// // API: /api/game/complete — Record a completed game with full metrics
// // app/api/game/complete/route.ts
// // =============================================================================
// import { NextRequest, NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";

// export async function POST(req: NextRequest) {
//   try {
//     const { userId: clerkId } = getAuth(req);
//     if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const user = await prismadb.user.findUnique({
//       where: { clerkId },
//       select: { id: true },
//     });
//     if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

//     const {
//       gameEventId,
//       rewardEarned,
//       score,
//       timeTaken,   // ms
//       isWinner,
//       metadata,    // JSON string: { accuracy, combo, bestTime, etc. }
//     } = await req.json();

//     if (!gameEventId || rewardEarned === undefined) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     // Check if already completed (prevent double-submit)
//     const existing = await prismadb.gameParticipation.findFirst({
//       where: { userId: user.id, gameEventId },
//     });

//     let participation;
//     if (existing) {
//       // Update if somehow called twice
//       participation = await prismadb.gameParticipation.update({
//         where: { id: existing.id },
//         data: {
//           rewardEarned: Math.max(existing.rewardEarned, rewardEarned),
//           score:        Math.max(existing.score ?? 0, score ?? 0),
//           timeTaken:    timeTaken ?? existing.timeTaken,
//           isWinner:     isWinner ?? existing.isWinner,
//           metadata:     metadata ?? existing.metadata,
//         },
//       });
//     } else {
//       participation = await prismadb.gameParticipation.create({
//         data: {
//           userId:      user.id,
//           gameEventId,
//           rewardEarned,
//           score:       score ?? 0,
//           timeTaken:   timeTaken,
//           isWinner:    isWinner ?? false,
//           metadata:    metadata ? JSON.stringify(metadata) : null,
//           completedAt: new Date(),
//         },
//       });
//     }

//     // Award tokens
//     const wallet = await prismadb.tokenWallet.upsert({
//       where:  { userId: user.id },
//       create: { userId: user.id, balance: rewardEarned, totalEarned: rewardEarned, totalSpent: 0 },
//       update: { balance: { increment: rewardEarned }, totalEarned: { increment: rewardEarned } },
//     });

//     // Transaction record
//     await prismadb.tokenTransaction.create({
//       data: {
//         userId:      user.id,
//         amount:      rewardEarned,
//         type:        "GAME_REWARD",
//         description: `Game reward`,
//         gameEventId,
//       },
//     });

//     // Update streak
//     const today     = new Date(); today.setHours(0, 0, 0, 0);
//     const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
//     const streak    = await prismadb.userStreak.findUnique({ where: { userId: user.id } });
//     let newStreak   = 1;
//     if (streak?.lastPlayedAt) {
//       const last = new Date(streak.lastPlayedAt); last.setHours(0, 0, 0, 0);
//       if (last.getTime() === today.getTime())     newStreak = streak.currentStreak;
//       else if (last.getTime() === yesterday.getTime()) newStreak = (streak.currentStreak ?? 0) + 1;
//     }
//     await prismadb.userStreak.upsert({
//       where:  { userId: user.id },
//       create: { userId: user.id, currentStreak: 1, longestStreak: 1, lastPlayedAt: today },
//       update: {
//         currentStreak: newStreak,
//         longestStreak: Math.max(streak?.longestStreak ?? 0, newStreak),
//         lastPlayedAt:  today,
//       },
//     });

//     // Update user counters
//     await prismadb.user.update({
//       where: { id: user.id },
//       data:  { totalLikes: { increment: 1 } }, // reuse as games played counter
//     });

//     // Streak milestone bonus (7-day multiple)
//     let streakBonus = 0;
//     if (newStreak >= 7 && newStreak % 7 === 0) {
//       streakBonus = 50;
//       await prismadb.tokenWallet.update({
//         where: { userId: user.id },
//         data:  { balance: { increment: streakBonus }, totalEarned: { increment: streakBonus } },
//       });
//       await prismadb.tokenTransaction.create({
//         data: { userId: user.id, amount: streakBonus, type: "STREAK_BONUS", description: `${newStreak}-day streak bonus!` },
//       });
//     }

//     return NextResponse.json({
//       success:      true,
//       newBalance:   wallet.balance + streakBonus,
//       streakBonus,
//       currentStreak: newStreak,
//       participation: { id: participation.id, rewardEarned, score },
//     });
//   } catch (error) {
//     console.error("[game/complete]", error);
//     return NextResponse.json({ error: "Failed to record game completion" }, { status: 500 });
//   }
// }