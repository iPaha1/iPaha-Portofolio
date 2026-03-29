// =============================================================================
// app/api/token-rush/challenges/[challengeId]/complete/route.ts
// POST → finalise a match, determine winner, award net prize.
//
// SECURITY: In production, derive winner server-side from stored TokenRushRound
// rows rather than trusting client-reported scores. The route is still protected
// by auth + participant verification.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

const PLATFORM_FEE_PCT = 0.05;

// ── Server-side Neural Dominance score derivation ─────────────────────────────
// Uncomment and use this instead of trusting client scores once fully wired up.
//
// const PTS_CORRECT = 15;
// const PTS_EVADED  = 10;
//
// async function deriveNeuralScores(challengeId: string, creatorId: string, acceptorId: string) {
//   const rounds = await prismadb.tokenRushRound.findMany({ where: { challengeId } });
//   let creatorPts = 0, acceptorPts = 0;
//   const roundNums = [...new Set(rounds.map(r => r.round))];
//   for (const rn of roundNums) {
//     const cr = rounds.find(r => r.round === rn && r.userId === creatorId);
//     const ar = rounds.find(r => r.round === rn && r.userId === acceptorId);
//     if (!cr || !ar) continue;
//     creatorPts  += (cr.prediction === ar.move ? PTS_CORRECT : 0) + (ar.prediction !== cr.move ? PTS_EVADED : 0);
//     acceptorPts += (ar.prediction === cr.move ? PTS_CORRECT : 0) + (cr.prediction !== ar.move ? PTS_EVADED : 0);
//   }
//   return { creatorPts, acceptorPts };
// }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId } = await params;
    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (challenge.status === "COMPLETED") return NextResponse.json({ error: "Already completed" }, { status: 409 });
    if (challenge.creatorId !== user.id && challenge.acceptorId !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    const body = await req.json() as { myScore: number; oppScore: number };
    const { myScore, oppScore } = body;

    // Map client scores back to creator/acceptor
    const amCreator    = challenge.creatorId === user.id;
    const creatorScore = amCreator ? myScore : oppScore;
    const acceptorScore = amCreator ? oppScore : myScore;

    // TODO: replace with server-derived scores:
    // const { creatorPts, acceptorPts } = await deriveNeuralScores(challengeId, challenge.creatorId, challenge.acceptorId!);

    const winnerId    = creatorScore >= acceptorScore ? challenge.creatorId : challenge.acceptorId!;
    const pool        = challenge.wagerAmount * 2;
    const fee         = Math.ceil(pool * PLATFORM_FEE_PCT);
    const net         = pool - fee;

    await prismadb.$transaction([
      // Finalise challenge record
      prismadb.tokenRushChallenge.update({
        where: { id: challengeId },
        data: {
          status:       "COMPLETED",
          winnerId,
          creatorScore,
          acceptorScore,
          completedAt:  new Date(),
        },
      }),
      // Credit winner
      prismadb.tokenWallet.update({
        where: { userId: winnerId },
        data:  { balance: { increment: net }, totalEarned: { increment: net } },
      }),
      // Transaction log
      prismadb.tokenTransaction.create({
        data: {
          userId:      winnerId,
          amount:      net,
          type:        "GAME_REWARD",
          description: `Token Rush win — ${challenge.gameId} (pool ${pool}, fee ${fee})`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, winnerId, net, fee });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[challengeId]/complete]", error);
    return NextResponse.json({ error: "Failed to complete" }, { status: 500 });
  }
}