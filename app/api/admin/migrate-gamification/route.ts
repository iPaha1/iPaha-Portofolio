// =============================================================================
// API: Admin - Trigger Gamification Migration
// app/api/admin/migrate-gamification/route.ts
//
// Protected route that can be called once to migrate all existing users
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

// Admin-only endpoint
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    // Check if user is admin
    const adminUser = await prismadb.user.findFirst({
      where: {
        clerkId: userId,
        role: "ADMIN",
      },
    });
    
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchSize = 50, startFrom = 0 } = await req.json();

    // Get users without wallets
    const usersWithoutWallet = await prismadb.user.findMany({
      where: {
        isActive: true,
        tokenWallet: null,
      },
      take: batchSize,
      skip: startFrom,
      select: {
        id: true,
        displayName: true,
        email: true,
        clerkId: true,
      },
    });

    let migrated = 0;
    let errors = 0;

    for (const user of usersWithoutWallet) {
      try {
        // Create wallet
        await prismadb.tokenWallet.create({
          data: {
            userId: user.id,
            balance: 100,
            totalEarned: 100,
            totalSpent: 0,
          },
        });

        // Create welcome transaction
        await prismadb.tokenTransaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: "ACHIEVEMENT",
            description: "🎉 Welcome to the Gamification System! Here are 100 free tokens to get you started.",
            metadata: JSON.stringify({
              type: "welcome_bonus",
              migratedAt: new Date().toISOString(),
            }),
          },
        });

        // Create game settings if needed
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
        }

        // Create streak tracking
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
        }

        // Create referral code
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
        }

        migrated++;
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        errors++;
        console.error(`❌ Failed to migrate user ${user.email}:`, error);
      }
    }

    const remaining = await prismadb.user.count({
      where: {
        isActive: true,
        tokenWallet: null,
      },
    });

    return NextResponse.json({
      success: true,
      migrated,
      errors,
      remaining,
      hasMore: remaining > 0,
      message: `Migrated ${migrated} users. ${remaining} remaining.`,
    });
  } catch (error) {
    console.error("[admin/migrate-gamification] Error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
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