// =============================================================================
// API: Wallet & Streak
// app/api/game/wallet/route.ts
// =============================================================================

// app/api/game/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let wallet = await prismadb.tokenWallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prismadb.tokenWallet.create({
        data: { 
          userId: user.id, 
          balance: 100,
          totalEarned: 100,
          totalSpent: 0 
        },
      });
      
      await prismadb.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: 100,
          type: "ACHIEVEMENT",
          description: "🎉 Welcome to the platform! Here are 100 free tokens to get you started.",
        },
      });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error("[game/wallet] Error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
  }
}