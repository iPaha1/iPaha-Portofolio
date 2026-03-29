// =============================================================================
// app/api/token-rush/challenges/[challengeId]/poll/route.ts
// GET → poll for the opponent's latest probe result (Phantom Grid)
//       Client passes ?turn=N — returns the probe record if it exists and
//       hasn't been delivered yet.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId } = await params;
    const turn    = parseInt(req.nextUrl.searchParams.get("turn") ?? "0");

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (challenge.creatorId !== user.id && challenge.acceptorId !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Find an opponent probe for this turn that hasn't been delivered yet
    const probe = await prismadb.tokenRushProbe.findFirst({
      where: {
        challengeId: challengeId,
        proberId:    { not: user.id },  // opponent's probe
        turn:        { gt: turn },      // newer than what client has seen
        polledByOpp: false,
      },
      orderBy: { turn: "asc" },
    });

    if (!probe) {
      return NextResponse.json({ oppProbe: null });
    }

    // Mark as delivered
    await prismadb.tokenRushProbe.update({
      where: { id: probe.id },
      data:  { polledByOpp: true },
    });

    return NextResponse.json({
      oppProbe: { row: probe.row, col: probe.col, hit: probe.hit, turn: probe.turn },
    });
  } catch (error) {
    console.error("[GET /api/token-rush/challenges/[challengeId]/poll]", error);
    return NextResponse.json({ error: "Failed to poll" }, { status: 500 });
  }
}