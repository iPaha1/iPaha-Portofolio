// =============================================================================
// API: Award Tokens
// app/api/game/award/route.ts
// =============================================================================

// app/api/game/award/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get database user ID
    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { amount, reason, gameId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Get or create wallet using database ID
    let wallet = await prismadb.tokenWallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prismadb.tokenWallet.create({
        data: { 
          userId: user.id, 
          balance: 0, 
          totalEarned: 0, 
          totalSpent: 0 
        },
      });
    }

    // Update wallet
    const updated = await prismadb.tokenWallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
        lastUpdated: new Date(),
      },
    });

    // Create transaction
    await prismadb.tokenTransaction.create({
      data: {
        userId: user.id,
        amount,
        type: "GAME_REWARD",
        description: reason,
        gameEventId: gameId,
      },
    });

    // Update participation if game exists
    if (gameId) {
      await prismadb.gameParticipation.create({
        data: {
          userId: user.id,
          gameEventId: gameId,
          rewardEarned: amount,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      newBalance: updated.balance,
    });
  } catch (error) {
    console.error("[game/award] Error:", error);
    return NextResponse.json({ error: "Failed to award tokens" }, { status: 500 });
  }
}