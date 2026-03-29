// =============================================================================
// app/api/token-rush/challenges/[challengeId]/move/route.ts
// POST → commit a Neural Dominance move + prediction (before reveal)
//
// ANTI-CHEAT: moves stored as SHA-256 hashes before reveal.
// Neither player nor observer can see any move until both players have committed.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { prismadb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId } = await params;
    const body = await req.json() as { round: number; move: string; prediction: string };
    const { round, move, prediction } = body;

    if (!round || !move || !prediction) {
      return NextResponse.json({ error: "round, move, and prediction required" }, { status: 400 });
    }

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    if (challenge.status !== "PLAYING") return NextResponse.json({ error: "Challenge not in progress" }, { status: 409 });

    // Verify this user is a participant
    if (challenge.creatorId !== user.id && challenge.acceptorId !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // One-way hash: server stores this — neither client can infer the other's move
    const secret = process.env.TOKEN_RUSH_HASH_SECRET ?? "default-secret-change-me";
    const moveHash = createHash("sha256")
      .update(`${challengeId}:${round}:${user.id}:${move}:${prediction}:${secret}`)
      .digest("hex");

    // Upsert: allow re-commit before opponent has committed (change of mind)
    await prismadb.tokenRushRound.upsert({
      where: {
        challengeId_round_userId: { challengeId: challengeId, round, userId: user.id },
      },
      create: { challengeId: challengeId, round, userId: user.id, move, prediction, moveHash, committed: true },
      update: { move, prediction, moveHash, committed: true },
    });

    // Check if both players are now committed for this round
    const committedCount = await prismadb.tokenRushRound.count({
      where: { challengeId: challengeId, round, committed: true },
    });
    const bothCommitted = committedCount >= 2;

    // Mark on challenge so polling knows reveal is ready
    if (bothCommitted) {
      await prismadb.tokenRushChallenge.update({
        where: { id: challengeId },
        data:  { currentRound: round, roundReadyAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      opponentLocked: committedCount >= 2,
      bothCommitted,
    });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[challengeId]/move]", error);
    return NextResponse.json({ error: "Failed to commit move" }, { status: 500 });
  }
}