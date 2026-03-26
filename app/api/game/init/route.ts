// =============================================================================
// API: Initialize Gamification for Current User
// app/api/game/init/route.ts
//
// Called when a user logs in to ensure they have gamification set up
// This handles the case where existing users haven't been migrated yet
// =============================================================================

// app/api/game/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user in our database
    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        displayName: true,
        email: true,
      },
    });

    if (!user) {
      console.error(`User not found for clerkId: ${clerkId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if wallet exists
    let wallet = await prismadb.tokenWallet.findUnique({
      where: { userId: user.id },
    });

    let initialized = false;
    let walletCreated = false;
    let settingsCreated = false;
    let streakCreated = false;
    let referralCreated = false;

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prismadb.tokenWallet.create({
        data: {
          userId: user.id,
          balance: 10,
          totalEarned: 10,
          totalSpent: 0,
        },
      });
      walletCreated = true;
      
      // Create welcome transaction
      await prismadb.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: 10,
          type: "ACHIEVEMENT",
          description: "🎉 Welcome to the Gamification System! Here are 100 free tokens to get you started.",
          metadata: JSON.stringify({
            type: "welcome_bonus",
            initializedAt: new Date().toISOString(),
          }),
        },
      });
      
      initialized = true;
    }

    // Create game settings if they don't exist
    const existingSettings = await prismadb.gameSettings.findUnique({
      where: { userId: user.id },
    });
    
    if (!existingSettings) {
      await prismadb.gameSettings.create({
        data: {
          userId: user.id,
          gameEnabled: true,
          soundEnabled: true,
          notificationsEnabled: true,
          minGameDelay: 2,
        },
      });
      settingsCreated = true;
      initialized = true;
    }

    // Create streak tracking if it doesn't exist
    const existingStreak = await prismadb.userStreak.findUnique({
      where: { userId: user.id },
    });
    
    if (!existingStreak) {
      await prismadb.userStreak.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
      streakCreated = true;
      initialized = true;
    }

    // Create referral code if it doesn't exist
    const existingReferral = await prismadb.referralCode.findUnique({
      where: { userId: user.id },
    });
    
    if (!existingReferral) {
      const code = generateReferralCode(user.displayName || user.email || "user", user.id);
      await prismadb.referralCode.create({
        data: {
          userId: user.id,
          code,
          uses: 0,
          isActive: true,
        },
      });
      referralCreated = true;
      initialized = true;
    }

    return NextResponse.json({
      success: true,
      initialized,
      wallet: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
      },
      created: {
        wallet: walletCreated,
        settings: settingsCreated,
        streak: streakCreated,
        referral: referralCreated,
      },
      message: initialized 
        ? "🎉 Welcome to the Gamification System! Here are 100 free tokens to get you started." 
        : "Gamification system already active for your account.",
    });
  } catch (error) {
    console.error("[game/init] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize gamification" },
      { status: 500 }
    );
  }
}

function generateReferralCode(displayName: string, userId: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const suffix = userId.slice(-4);
  
  return `${base || "user"}${random}${suffix}`.toUpperCase();
}