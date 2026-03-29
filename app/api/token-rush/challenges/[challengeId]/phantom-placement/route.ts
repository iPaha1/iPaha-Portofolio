// =============================================================================
// app/api/token-rush/challenges/[challengeId]/phantom-placement/route.ts
// POST → store phantom positions server-side (never exposed to opponent)
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
    const { positions } = await req.json() as { positions: [number, number][] };

    if (!Array.isArray(positions) || positions.length !== 8) {
      return NextResponse.json({ error: "Exactly 8 positions required" }, { status: 400 });
    }

    // Validate: all in rows 0–3 (top half)
    for (const [r, c] of positions) {
      if (r < 0 || r > 3 || c < 0 || c > 7) {
        return NextResponse.json({ error: `Invalid position [${r},${c}]` }, { status: 400 });
      }
    }

    // Validate no duplicates
    const keys = positions.map(([r, c]) => `${r},${c}`);
    if (new Set(keys).size !== 8) {
      return NextResponse.json({ error: "Duplicate positions not allowed" }, { status: 400 });
    }

    const challenge = await prismadb.tokenRushChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    if (challenge.creatorId !== user.id && challenge.acceptorId !== user.id) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    await prismadb.tokenRushPhantomPlacement.upsert({
      where:  { challengeId_userId: { challengeId: challengeId, userId: user.id } },
      create: { challengeId: challengeId, userId: user.id, positions: JSON.stringify(positions) },
      update: { positions: JSON.stringify(positions), updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[challengeId]/phantom-placement]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}