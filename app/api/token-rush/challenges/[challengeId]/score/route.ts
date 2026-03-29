// =============================================================================
// app/api/token-rush/challenges/[challengeId]/score/route.ts
// POST → live score upsert (for spectators / opponent progress display)
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
    const { score } = await req.json() as { score: number };

    await prismadb.tokenRushScore.upsert({
      where:  { challengeId_userId: { challengeId: challengeId, userId: user.id } },
      create: { challengeId: challengeId, userId: user.id, score },
      update: { score },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/token-rush/challenges/[challengeId]/score]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}