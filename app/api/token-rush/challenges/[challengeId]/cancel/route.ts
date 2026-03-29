// =============================================================================
// app/api/token-rush/challenges/[challengeId]/cancel/route.ts
// POST → creator cancels their open challenge before anyone accepts.
//        Refunds the full wager back to the creator's wallet atomically.
//        Returns 409 if the challenge has already been accepted.
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

    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId } = await params;

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }
    if (challenge.creatorId !== user.id) {
      return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });
    }
    if (challenge.status !== "OPEN") {
      // Already accepted / playing / completed — cannot cancel
      return NextResponse.json(
        { error: "Challenge has already been accepted and cannot be cancelled" },
        { status: 409 },
      );
    }

    // Atomic: cancel challenge + refund wager + log transaction
    await prismadb.$transaction([
      prismadb.tokenRushChallenge.update({
        where: { id: challengeId },
        data:  { status: "CANCELLED" },
      }),
      prismadb.tokenWallet.update({
        where: { userId: user.id },
        data: {
          balance:     { increment: challenge.wagerAmount },
          totalSpent:  { decrement: challenge.wagerAmount },
        },
      }),
      prismadb.tokenTransaction.create({
        data: {
          userId:      user.id,
          amount:      challenge.wagerAmount,
          type:        "ADMIN_ADJUST",
          description: `Token Rush challenge cancelled — wager refunded (${challenge.gameId})`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, refunded: challenge.wagerAmount });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[challengeId]/cancel]", error);
    return NextResponse.json({ error: "Failed to cancel challenge" }, { status: 500 });
  }
}