// =============================================================================
// app/api/token-rush/challenges/route.ts
// GET  → list open/playing challenges + online users
// POST → create a new challenge (deducts wager from wallet atomically)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

const PLATFORM_FEE_PCT    = 0.05;
const CHALLENGE_TTL_MINS  = 10;

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // Auto-expire stale open challenges
    const expireBefore = new Date(Date.now() - CHALLENGE_TTL_MINS * 60 * 1000);
    await prismadb.tokenRushChallenge.updateMany({
      where: { status: "OPEN", createdAt: { lt: expireBefore } },
      data:  { status: "EXPIRED" },
    });

    // Fetch challenges
    const challenges = await prismadb.tokenRushChallenge.findMany({
      where:   { status: { in: ["OPEN", "PLAYING"] } },
      orderBy: { createdAt: "desc" },
      take:    40,
      include: { creator: { select: { id: true, displayName: true } } },
    });

    // All users or recently-seen users for the sidebar
    // Using lastSeenAt — add this field to your User model if not present
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
    const onlineUsers = await prismadb.user.findMany({
      where:   { lastSeenAt: { gte: twoMinsAgo } },
      select: {
        id:           true,
        displayName:  true,
        avatarUrl:    true,
        lastSeenAt:   true,
        tokenWallet:  { select: { balance: true } },
        // Count wins vs total for win rate
        _count: { select: { gameParticipation: true } },
      },
      orderBy: { lastSeenAt: "desc" },
      take:    30,
    });

    return NextResponse.json({
      challenges: challenges.map(c => {
        const pool = c.wagerAmount * 2;
        const fee  = Math.ceil(pool * PLATFORM_FEE_PCT);
        return {
          id:           c.id,
          creatorId:    c.creatorId,
          creatorName:  c.creator.displayName,
          gameId:       c.gameId,
          wagerAmount:  c.wagerAmount,
          prizePool:    pool,
          platformFee:  fee,
          netPrize:     pool - fee,
          status:       c.status.toLowerCase(),
          createdAt:    c.createdAt,
          acceptorId:   c.acceptorId,
          acceptorName: c.acceptorName,
        };
      }),
      onlineUsers: onlineUsers.map(u => ({
        id:           u.id,
        displayName:  u.displayName,
        tokenBalance: u.tokenWallet?.balance ?? 0,
        gamesPlayed:  u._count.gameParticipation,
        winRate:      50, // TODO: query wins / gamesPlayed
      })),
    });
  } catch (error) {
    console.error("[GET /api/token-rush/challenges]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where:   { clerkId },
      include: { tokenWallet: true },
    });
    if (!user)             return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.tokenWallet) return NextResponse.json({ error: "No wallet" },      { status: 400 });

    const body = await req.json().catch(() => ({})) as {
      gameId?: string;
      wagerAmount?: number;
    };
    const { gameId, wagerAmount } = body;

    if (!gameId || !wagerAmount || wagerAmount <= 0) {
      return NextResponse.json({ error: "gameId and wagerAmount required" }, { status: 400 });
    }
    if (user.tokenWallet.balance < wagerAmount) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 400 });
    }

    const pool = wagerAmount * 2;
    const fee  = Math.ceil(pool * PLATFORM_FEE_PCT);

    // Atomic: create challenge + deduct wager + log transaction
    const [challenge] = await prismadb.$transaction([
      prismadb.tokenRushChallenge.create({
        data: {
          creatorId:   user.id,
          gameId,
          wagerAmount,
          status:      "OPEN",
          expiresAt:   new Date(Date.now() + CHALLENGE_TTL_MINS * 60 * 1000),
        },
      }),
      prismadb.tokenWallet.update({
        where: { userId: user.id },
        data:  { balance: { decrement: wagerAmount }, totalSpent: { increment: wagerAmount } },
      }),
      prismadb.tokenTransaction.create({
        data: {
          userId:      user.id,
          amount:      -wagerAmount,
          type:        "SPEND",
          description: `Token Rush challenge wager — ${gameId}`,
        },
      }),
      // Update lastSeenAt
      prismadb.user.update({
        where: { id: user.id },
        data:  { lastSeenAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      challenge: {
        id:          challenge.id,
        creatorId:   user.id,
        creatorName: user.displayName,
        gameId,
        wagerAmount,
        prizePool:   pool,
        platformFee: fee,
        netPrize:    pool - fee,
        status:      "open",
        createdAt:   challenge.createdAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges]", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}