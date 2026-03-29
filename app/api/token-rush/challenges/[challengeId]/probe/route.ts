// =============================================================================
// app/api/token-rush/challenges/[challengeId]/probe/route.ts
// POST → probe a cell in Phantom Grid
//        Server checks opponent's layout (never sent to client) and returns hit/miss.
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

    const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId } = await params;
    const { row, col } = await req.json() as { row: number; col: number };

    if (row < 0 || row > 7 || col < 0 || col > 7) {
      return NextResponse.json({ error: "Invalid cell coordinates" }, { status: 400 });
    }

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    if (challenge.status !== "PLAYING") return NextResponse.json({ error: "Not in progress" }, { status: 409 });
    if (challenge.creatorId !== user.id && challenge.acceptorId !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Opponent is the other participant
    const oppId = challenge.creatorId === user.id ? challenge.acceptorId : challenge.creatorId;
    if (!oppId) return NextResponse.json({ error: "Opponent has not joined yet" }, { status: 400 });

    // Fetch opponent's phantom layout (server-side only — never sent to client)
    const oppLayout = await prismadb.tokenRushPhantomPlacement.findUnique({
      where: { challengeId_userId: { challengeId: challengeId, userId: oppId } },
    });
    if (!oppLayout) {
      return NextResponse.json({ error: "Opponent has not placed phantoms yet" }, { status: 400 });
    }

    const positions = JSON.parse(oppLayout.positions) as [number, number][];
    const hit = positions.some(([r, c]) => r === row && c === col);

    // If hit, remove the phantom from server record
    if (hit) {
      const remaining = positions.filter(([r, c]) => !(r === row && c === col));
      await prismadb.tokenRushPhantomPlacement.update({
        where: { challengeId_userId: { challengeId: challengeId, userId: oppId } },
        data:  { positions: JSON.stringify(remaining), updatedAt: new Date() },
      });
    }

    // Log probe (opponent polls this to render the result on their board)
    const turn = challenge.probeCount + 1;
    await prismadb.tokenRushProbe.create({
      data: { challengeId: challengeId, proberId: user.id, row, col, hit, turn },
    });

    // Increment probe counter
    await prismadb.tokenRushChallenge.update({
      where: { id: challengeId },
      data:  { probeCount: { increment: 1 } },
    });

    return NextResponse.json({ hit, turn });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[challengeId]/probe]", error);
    return NextResponse.json({ error: "Failed to process probe" }, { status: 500 });
  }
}