// =============================================================================
// MIGRATION: Initialize Gamification for Existing Users
// scripts/init-gamification.ts
//
// Run with: npx tsx scripts/init-gamification.ts
// =============================================================================

import { prismadb } from "@/lib/db";
import { UserRole } from "@/lib/generated/prisma/enums";

interface UserData {
  id: string;
  clerkId: string;
  email: string;
  displayName: string;
}

async function initGamificationForExistingUsers() {
  console.log("🚀 Starting gamification initialization for existing users...");
  
  try {
    // Get all existing users
    const users = await prismadb.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        displayName: true,
      },
      where: {
        isActive: true,
      },
    });
    
    console.log(`📊 Found ${users.length} existing users`);
    
    let createdWallets = 0;
    let createdSettings = 0;
    let createdStreaks = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Check if wallet already exists
        const existingWallet = await prismadb.tokenWallet.findUnique({
          where: { userId: user.id },
        });
        
        if (!existingWallet) {
          // Create wallet with 100 free tokens
          await prismadb.tokenWallet.create({
            data: {
              userId: user.id,
              balance: 100,
              totalEarned: 100,
              totalSpent: 0,
            },
          });
          createdWallets++;
          
          // Create welcome bonus transaction
          await prismadb.tokenTransaction.create({
            data: {
              userId: user.id,
              amount: 100,
              type: "ACHIEVEMENT",
              description: "Welcome to the Gamification System! 🎉 Here are 100 free tokens to get you started.",
              metadata: JSON.stringify({
                type: "welcome_bonus",
                timestamp: new Date().toISOString(),
              }),
            },
          });
          
          console.log(`✅ Created wallet for ${user.displayName} (${user.email}) with 100 tokens`);
        } else {
          console.log(`ℹ️ Wallet already exists for ${user.displayName}`);
        }
        
        // Check if game settings exist
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
          createdSettings++;
          console.log(`✅ Created game settings for ${user.displayName}`);
        }
        
        // Check if streak exists
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
          createdStreaks++;
          console.log(`✅ Created streak tracking for ${user.displayName}`);
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError);
        errors++;
      }
    }
    
    console.log("\n🎉 Gamification initialization complete!");
    console.log(`📊 Summary:`);
    console.log(`   - Wallets created: ${createdWallets}/${users.length}`);
    console.log(`   - Game settings created: ${createdSettings}/${users.length}`);
    console.log(`   - Streak tracking created: ${createdStreaks}/${users.length}`);
    console.log(`   - Errors: ${errors}`);
    
    // Also create a referral code for each user
    console.log("\n📧 Creating referral codes for all users...");
    let referralCodesCreated = 0;
    
    for (const user of users) {
      try {
        const existingCode = await prismadb.referralCode.findUnique({
          where: { userId: user.id },
        });
        
        if (!existingCode) {
          // Generate unique referral code
          const code = generateReferralCode(user.displayName, user.id);
          await prismadb.referralCode.create({
            data: {
              userId: user.id,
              code,
              uses: 0,
              isActive: true,
            },
          });
          referralCodesCreated++;
        }
      } catch (codeError) {
        console.error(`❌ Error creating referral code for ${user.email}:`, codeError);
      }
    }
    
    console.log(`✅ Referral codes created: ${referralCodesCreated}/${users.length}`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prismadb.$disconnect();
  }
}

function generateReferralCode(displayName: string, userId: string): string {
  // Generate a clean referral code from display name or user ID
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const suffix = userId.slice(-4);
  
  return `${base || "user"}${random}${suffix}`.toUpperCase();
}

// Run the migration
initGamificationForExistingUsers()
  .catch(console.error)
  .finally(() => process.exit(0));