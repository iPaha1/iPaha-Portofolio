// =============================================================================
// API: /api/game/leaderboard — Global leaderboard with period & game filters
// app/api/game/leaderboard/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { searchParams }     = new URL(req.url);
    const period               = searchParams.get("period") ?? "all";   // all | week | month
    const gameType             = searchParams.get("game")   ?? "ALL";   // ALL | specific type
    const limit                = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    // Date filter
    let dateFilter: Date | undefined;
    if (period === "week")  dateFilter = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    if (period === "month") dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get me (for rank highlight) - optional
    let myUserId: string | undefined;
    if (clerkId) {
      const me = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
      myUserId = me?.id;
    }

    // Build leaderboard from participations
    const where: Record<string, unknown> = {};
    if (dateFilter) where.completedAt = { gte: dateFilter };
    if (gameType !== "ALL") where.gameEvent = { is: { type: gameType } };

    const participations = await prismadb.gameParticipation.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
        gameEvent: { select: { type: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 5000, // aggregate in memory
    });

    // Aggregate per user
    const userMap = new Map<string, {
      userId: string; displayName: string; avatarUrl: string | null; username: string | null;
      totalTokens: number; gamesPlayed: number; bestScore: number; avgScore: number; totalScore: number;
    }>();

    for (const p of participations) {
      const uid = p.user.id;
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          userId: uid, displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl, username: p.user.username,
          totalTokens: 0, gamesPlayed: 0, bestScore: 0, avgScore: 0, totalScore: 0,
        });
      }
      const entry = userMap.get(uid)!;
      entry.totalTokens += p.rewardEarned;
      entry.gamesPlayed += 1;
      entry.totalScore  += (p.score ?? 0);
      entry.bestScore    = Math.max(entry.bestScore, p.score ?? 0);
    }

    // Sort by total tokens desc
    const ranked = Array.from(userMap.values())
      .map(u => ({ ...u, avgScore: u.gamesPlayed > 0 ? Math.round(u.totalScore / u.gamesPlayed) : 0 }))
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, limit)
      .map((u, i) => ({ ...u, rank: i + 1, isMe: u.userId === myUserId }));

    // My rank (even if outside top N)
    let myRank: number | null = null;
    if (myUserId) {
      const allSorted = Array.from(userMap.values())
        .sort((a, b) => b.totalTokens - a.totalTokens);
      const myIdx = allSorted.findIndex(u => u.userId === myUserId);
      if (myIdx !== -1) myRank = myIdx + 1;
    }

    return NextResponse.json({ entries: ranked, myRank, total: userMap.size });
  } catch (error) {
    console.error("[game/leaderboard]", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}





// // =============================================================================
// // API: Leaderboard
// // app/api/game/leaderboard/route.ts
// // =============================================================================

// // app/api/game/leaderboard/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prismadb } from "@/lib/db";
// import { getAuth } from "@clerk/nextjs/server";

// export async function GET(req: NextRequest) {
//   try {
//     const { userId: clerkId } = getAuth(req);
//     const searchParams = req.nextUrl.searchParams;
//     const type = searchParams.get("type") || "WEEKLY_TOKENS";
//     const period = searchParams.get("period") || "WEEKLY";
//     const limit = parseInt(searchParams.get("limit") || "50");

//     let entries: any[] = [];
//     let userRank: any = null;

//     // Calculate date range based on period
//     const now = new Date();
//     let startDate = new Date();
//     if (period === "WEEKLY") {
//       startDate.setDate(now.getDate() - 7);
//     } else if (period === "MONTHLY") {
//       startDate.setMonth(now.getMonth() - 1);
//     } else if (period === "DAILY") {
//       startDate.setDate(now.getDate() - 1);
//     } else {
//       startDate = new Date(0);
//     }

//     // Get leaderboard entries
//     if (type === "WEEKLY_TOKENS" || type === "MONTHLY_TOKENS" || type === "ALL_TIME_TOKENS") {
//       entries = await prismadb.$queryRaw`
//         SELECT 
//           u.id as userId,
//           u."displayName",
//           u."avatarUrl",
//           COALESCE(SUM(t.amount), 0) as score
//         FROM users u
//         LEFT JOIN token_transactions t ON u.id = t."userId" 
//           AND t.type = 'GAME_REWARD'
//           AND t.createdAt >= ${startDate}
//         WHERE u."isActive" = true
//         GROUP BY u.id, u."displayName", u."avatarUrl"
//         ORDER BY score DESC
//         LIMIT ${limit}
//       `;
      
//       if (clerkId) {
//         // Get database user ID
//         const user = await prismadb.user.findUnique({
//           where: { clerkId },
//           select: { id: true },
//         });

//         if (user) {
//           const userScore = await prismadb.$queryRaw`
//             SELECT COALESCE(SUM(t.amount), 0) as score
//             FROM token_transactions t
//             WHERE t."userId" = ${user.id} 
//               AND t.type = 'GAME_REWARD'
//               AND t.createdAt >= ${startDate}
//           `;
          
//           const userRankResult = await prismadb.$queryRaw`
//             SELECT COUNT(*) + 1 as rank
//             FROM (
//               SELECT u.id, COALESCE(SUM(t.amount), 0) as score
//               FROM users u
//               LEFT JOIN token_transactions t ON u.id = t."userId" 
//                 AND t.type = 'GAME_REWARD'
//                 AND t.createdAt >= ${startDate}
//               WHERE u."isActive" = true
//               GROUP BY u.id
//               HAVING COALESCE(SUM(t.amount), 0) > ${(userScore as any[])[0]?.score || 0}
//             ) as higher_scores
//           `;
          
//           const userData = await prismadb.user.findUnique({
//             where: { id: user.id },
//             select: { displayName: true, avatarUrl: true },
//           });
          
//           userRank = {
//             rank: (userRankResult as any[])[0]?.rank || entries.length + 1,
//             userId: user.id,
//             displayName: userData?.displayName || "Anonymous",
//             avatarUrl: userData?.avatarUrl,
//             score: (userScore as any[])[0]?.score || 0,
//             isCurrentUser: true,
//           };
//         }
//       }
//     }

//     // Format entries
//     const formattedEntries = entries.map((entry: any, index: number) => ({
//       rank: index + 1,
//       userId: entry.userId,
//       displayName: entry.displayName || "Anonymous",
//       avatarUrl: entry.avatarUrl,
//       score: parseInt(entry.score),
//       previousRank: null,
//       isCurrentUser: entry.userId === (userRank?.userId),
//     }));

//     return NextResponse.json({
//       entries: formattedEntries,
//       userRank,
//     });
//   } catch (error) {
//     console.error("[leaderboard] Error:", error);
//     return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
//   }
// }