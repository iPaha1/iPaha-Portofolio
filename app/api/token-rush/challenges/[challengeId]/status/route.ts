// =============================================================================
// app/api/token-rush/challenges/[challengeId]/status/route.ts
//
// GET → lightweight status check for a single challenge.
//       Used by the challenge CREATOR who polls every 2 seconds while waiting
//       in the "waiting" room. Returns only what the client needs to know:
//       the current status, and — once accepted — the acceptor's id and name.
//
// This is intentionally minimal and fast. It does NOT return game state,
// scores, or any anti-cheat data.
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
      where:  { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { challengeId } = await params;

    const challenge = await prismadb.tokenRushChallenge.findUnique({
      where:  { id: challengeId },
      select: {
        id:           true,
        creatorId:    true,
        acceptorId:   true,
        acceptorName: true,
        status:       true,
        gameId:       true,
        wagerAmount:  true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only the creator should be calling this endpoint
    if (challenge.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      status:       challenge.status.toLowerCase(),  // "open" | "playing" | "completed" | "expired" | "cancelled"
      acceptorId:   challenge.acceptorId   ?? null,
      acceptorName: challenge.acceptorName ?? null,
    });
  } catch (error) {
    console.error("[GET /api/token-rush/challenges/[challengeId]/status]", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}