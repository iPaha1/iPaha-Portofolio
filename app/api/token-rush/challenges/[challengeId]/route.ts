// =============================================================================
// app/api/token-rush/challenges/[challengeId]/accept/route.ts
// POST → accept an open challenge, deduct wager, transition to PLAYING
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { challengeId } = await params;

    const user = await prismadb.user.findUnique({
      where:   { clerkId },
      include: { tokenWallet: true },
    });
    if (!user || !user.tokenWallet) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }
    if (challenge.status !== "OPEN") {
      return NextResponse.json({ error: "Challenge is no longer open" }, { status: 409 });
    }
    if (challenge.creatorId === user.id) {
      return NextResponse.json({ error: "Cannot accept your own challenge" }, { status: 400 });
    }
    if (user.tokenWallet.balance < challenge.wagerAmount) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 400 });
    }

    // Atomic: update challenge + deduct acceptor wager + log
    await prismadb.$transaction([
      prismadb.tokenRushChallenge.update({
        where: { id: challengeId },
        data: {
          status:       "PLAYING",
          acceptorId:   user.id,
          acceptorName: user.displayName,
        },
      }),
      prismadb.tokenWallet.update({
        where: { userId: user.id },
        data:  { balance: { decrement: challenge.wagerAmount }, totalSpent: { increment: challenge.wagerAmount } },
      }),
      prismadb.tokenTransaction.create({
        data: {
          userId:      user.id,
          amount:      -challenge.wagerAmount,
          type:        "SPEND",
          description: `Token Rush wager accepted — ${challenge.gameId}`,
        },
      }),
      prismadb.user.update({
        where: { id: user.id },
        data:  { lastSeenAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[id]/accept]", error);
    return NextResponse.json({ error: "Failed to accept challenge" }, { status: 500 });
  }
}