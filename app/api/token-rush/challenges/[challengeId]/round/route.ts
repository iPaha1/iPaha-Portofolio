// =============================================================================
// app/api/token-rush/challenges/[challengeId]/round/route.ts
// GET → poll: has opponent committed? are both committed?
//       Returns opponent move + prediction only once both players have locked in.
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

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId }     = await params;
    const roundParam = req.nextUrl.searchParams.get("round");
    const round      = parseInt(roundParam ?? "1");

    if (isNaN(round) || round < 1) {
      return NextResponse.json({ error: "Invalid round" }, { status: 400 });
    }

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

    // Confirm this user is a participant
    if (challenge.creatorId !== user.id && challenge.acceptorId !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    const rounds = await prismadb.tokenRushRound.findMany({
      where: { challengeId: challengeId, round, committed: true },
    });

    const myRound    = rounds.find((r: typeof rounds[number]) => r.userId === user.id);
    const oppRound   = rounds.find((r: typeof rounds[number]) => r.userId !== user.id);
    const opponentLocked  = !!oppRound;
    const bothCommitted   = rounds.length >= 2;

    if (!bothCommitted) {
      // Return partial state — don't reveal opponent move yet
      return NextResponse.json({ opponentLocked, bothCommitted: false });
    }

    // Both committed — safe to reveal opponent's move
    return NextResponse.json({
      opponentLocked: true,
      bothCommitted:  true,
      oppMove:        oppRound?.move       ?? null,
      oppPred:        oppRound?.prediction ?? null,
    });
  } catch (error) {
    console.error("[GET /api/token-rush/challenges/[challengeId]/round]", error);
    return NextResponse.json({ error: "Failed to poll round" }, { status: 500 });
  }
}