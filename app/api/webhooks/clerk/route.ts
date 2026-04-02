// =============================================================================
// isaacpaha.com — Clerk Webhook Handler (UPDATED with Gamification)
// app/api/webhooks/clerk/route.ts
// =============================================================================

import { prismadb } from "@/lib/db";
import { UserRole } from "@/lib/generated/prisma/enums";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses: { email_address: string; verification: { status: string } }[];
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
    public_metadata: { role?: string };
  };
};

// Helper function to generate referral code
function generateReferralCode(displayName: string, userId: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const suffix = userId.slice(-4);
  
  return `${base || "user"}${random}${suffix}`.toUpperCase();
}

// Helper function to initialize gamification for new user
async function initializeGamificationForUser(userId: string, displayName: string, email: string) {
  console.log(`🎮 Initializing gamification for new user: ${displayName} (${email})`);
  
  try {
    // 1. Create token wallet with 10 free tokens
    const wallet = await prismadb.tokenWallet.create({
      data: {
        userId,
        balance: 10,
        totalEarned: 10,
        totalSpent: 0,
      },
    });
    console.log(`✅ Created token wallet with 10 tokens`);

    // 2. Create welcome bonus transaction
    await prismadb.tokenTransaction.create({
      data: {
        userId,
        amount: 10,
        type: "ACHIEVEMENT",
        description: "🎉 Welcome to the platform! Here are 10 free tokens to get you started.",
        metadata: JSON.stringify({
          type: "welcome_bonus",
          timestamp: new Date().toISOString(),
        }),
      },
    });
    console.log(`✅ Created welcome bonus transaction`);

    // 3. Create game settings (enabled by default)
    await prismadb.gameSettings.create({
      data: {
        userId,
        gameEnabled: true,
        soundEnabled: true,
        notificationsEnabled: true,
        minGameDelay: 2, // 2 minutes minimum between games
      },
    });
    console.log(`✅ Created game settings`);

    // 4. Create streak tracking
    await prismadb.userStreak.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
    console.log(`✅ Created streak tracking`);

    // 5. Create referral code
    const referralCode = generateReferralCode(displayName, userId);
    await prismadb.referralCode.create({
      data: {
        userId,
        code: referralCode,
        uses: 0,
        isActive: true,
      },
    });
    console.log(`✅ Created referral code: ${referralCode}`);

    // 6. Create initial achievements (optional - unlock easy ones)
    const easyAchievements = await prismadb.achievement.findMany({
      where: {
        requirement: {
          contains: '"type":"FIRST_LOGIN"',
        },
      },
    });

    for (const achievement of easyAchievements) {
      await prismadb.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {},
        create: {
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
        },
      });
    }

    console.log(`✅ Gamification fully initialized for ${displayName}`);
    
    return {
      success: true,
      wallet,
      referralCode,
    };
  } catch (error) {
    console.error(`❌ Failed to initialize gamification for user ${userId}:`, error);
    throw error;
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  // Verify signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { type, data } = event;

  // ─── user.created ──────────────────────────────────────────────────────────
  if (type === "user.created") {
    const email = data.email_addresses[0]?.email_address;
    if (!email) return NextResponse.json({ ok: true });

    const clerkRole = data.public_metadata?.role as string | undefined;
    const role: UserRole =
      clerkRole === "ADMIN" ? "ADMIN"
      : clerkRole === "SUBSCRIBER" ? "SUBSCRIBER"
      : "READER";

    const firstName = data.first_name ?? "";
    const lastName = data.last_name ?? "";
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      data.username ||
      email.split("@")[0];

    // Create or update user
    const user = await prismadb.user.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        email,
        emailVerified: data.email_addresses[0]?.verification?.status === "verified",
        displayName,
        firstName: firstName || null,
        lastName: lastName || null,
        avatarUrl: data.image_url || null,
        username: data.username || null,
        role,
        lastLoginAt: new Date(),
      },
      update: {
        email,
        displayName,
        avatarUrl: data.image_url || null,
        username: data.username || null,
        role,
      },
    });

    // Initialize gamification for new user
    try {
      await initializeGamificationForUser(user.id, displayName, email);
      console.log(`✅ Gamification initialized for new user: ${displayName}`);
    } catch (gamificationError) {
      console.error(`⚠️ Failed to initialize gamification for new user:`, gamificationError);
      // Don't fail the webhook - user was created, gamification can be initialized later
    }
  }

  // ─── user.updated ──────────────────────────────────────────────────────────
  if (type === "user.updated") {
    const email = data.email_addresses[0]?.email_address;
    const clerkRole = data.public_metadata?.role as string | undefined;
    const role: UserRole =
      clerkRole === "ADMIN" ? "ADMIN"
      : clerkRole === "SUBSCRIBER" ? "SUBSCRIBER"
      : "READER";

    const firstName = data.first_name ?? "";
    const lastName = data.last_name ?? "";
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      data.username ||
      (email ? email.split("@")[0] : "User");

    await prismadb.user.updateMany({
      where: { clerkId: data.id },
      data: {
        ...(email && { email }),
        emailVerified: data.email_addresses[0]?.verification?.status === "verified",
        displayName,
        firstName: firstName || null,
        lastName: lastName || null,
        avatarUrl: data.image_url || null,
        username: data.username || null,
        role,
        updatedAt: new Date(),
      },
    });
  }

  // ─── user.deleted ──────────────────────────────────────────────────────────
  if (type === "user.deleted") {
    // Soft delete user
    await prismadb.user.updateMany({
      where: { clerkId: data.id },
      data: {
        isActive: false,
        email: `deleted_${data.id}@deleted.invalid`,
        displayName: "Deleted User",
        firstName: null,
        lastName: null,
        avatarUrl: null,
        username: null,
      },
    });
    
    // Optionally deactivate game settings
    const user = await prismadb.user.findFirst({
      where: { clerkId: data.id },
      select: { id: true },
    });
    
    if (user) {
      await prismadb.gameSettings.updateMany({
        where: { userId: user.id },
        data: { gameEnabled: false },
      });
    }
  }

  console.log(`✅ Clerk webhook processed: ${type} for user ${data.id}`);
  return NextResponse.json({ ok: true });
}







// // =============================================================================
// // isaacpaha.com — Clerk Webhook Handler
// // app/api/webhooks/clerk/route.ts
// //
// // Clerk calls this endpoint when users are created, updated, or deleted.
// // This is the MOST RELIABLE way to keep the DB in sync — webhooks fire even
// // if the user never visits the site after signing up via email invite etc.
// //
// // Setup:
// //   1. In Clerk Dashboard → Webhooks → Add endpoint
// //   2. URL: https://www.isaacpaha.com/api/webhooks/clerk
// //   3. Events: user.created, user.updated, user.deleted
// //   4. Copy the Signing Secret → CLERK_WEBHOOK_SECRET in .env
// // =============================================================================

// import { prismadb } from "@/lib/db";
// import { UserRole } from "@/lib/generated/prisma/enums";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";
// import { Webhook } from "svix";


// // Svix verifies the webhook signature — install: npm i svix
// type ClerkUserEvent = {
//   type: "user.created" | "user.updated" | "user.deleted";
//   data: {
//     id: string;
//     email_addresses: { email_address: string; verification: { status: string } }[];
//     username: string | null;
//     first_name: string | null;
//     last_name: string | null;
//     image_url: string;
//     public_metadata: { role?: string };
//   };
// };

// export async function POST(req: Request) {
//   const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
//   if (!WEBHOOK_SECRET) {
//     return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
//   }

//   // Verify signature
//   const headerPayload = await headers();
//   const svixId        = headerPayload.get("svix-id");
//   const svixTimestamp = headerPayload.get("svix-timestamp");
//   const svixSignature = headerPayload.get("svix-signature");

//   if (!svixId || !svixTimestamp || !svixSignature) {
//     return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
//   }

//   const body = await req.text();
//   const wh   = new Webhook(WEBHOOK_SECRET);

//   let event: ClerkUserEvent;
//   try {
//     event = wh.verify(body, {
//       "svix-id":        svixId,
//       "svix-timestamp": svixTimestamp,
//       "svix-signature": svixSignature,
//     }) as ClerkUserEvent;
//   } catch {
//     return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
//   }

//   const { type, data } = event;

//   // ─── user.created ──────────────────────────────────────────────────────────
//   if (type === "user.created") {
//     const email = data.email_addresses[0]?.email_address;
//     if (!email) return NextResponse.json({ ok: true });

//     const clerkRole  = data.public_metadata?.role as string | undefined;
//     const role: UserRole =
//       clerkRole === "ADMIN"      ? "ADMIN"
//       : clerkRole === "SUBSCRIBER" ? "SUBSCRIBER"
//       : "READER";

//     const firstName   = data.first_name ?? "";
//     const lastName    = data.last_name  ?? "";
//     const displayName =
//       [firstName, lastName].filter(Boolean).join(" ") ||
//       data.username ||
//       email.split("@")[0];

//     await prismadb.user.upsert({
//       where:  { clerkId: data.id },
//       create: {
//         clerkId:      data.id,
//         email,
//         emailVerified: data.email_addresses[0]?.verification?.status === "verified",
//         displayName,
//         firstName:   firstName || null,
//         lastName:    lastName  || null,
//         avatarUrl:   data.image_url || null,
//         username:    data.username  || null,
//         role,
//         lastLoginAt: new Date(),
//       },
//       update: {
//         email,
//         displayName,
//         avatarUrl: data.image_url || null,
//         username:  data.username  || null,
//         role,
//       },
//     });
//   }
//   console.log(`Clerk webhook received: ${type} for user ${data.id}`);

//   // ─── user.updated ──────────────────────────────────────────────────────────
//   if (type === "user.updated") {
//     const email      = data.email_addresses[0]?.email_address;
//     const clerkRole  = data.public_metadata?.role as string | undefined;
//     const role: UserRole =
//       clerkRole === "ADMIN"      ? "ADMIN"
//       : clerkRole === "SUBSCRIBER" ? "SUBSCRIBER"
//       : "READER";

//     const firstName   = data.first_name ?? "";
//     const lastName    = data.last_name  ?? "";
//     const displayName =
//       [firstName, lastName].filter(Boolean).join(" ") ||
//       data.username ||
//       (email ? email.split("@")[0] : "User");

//     await prismadb.user.updateMany({
//       where: { clerkId: data.id },
//       data: {
//         ...(email && { email }),
//         emailVerified: data.email_addresses[0]?.verification?.status === "verified",
//         displayName,
//         firstName:  firstName || null,
//         lastName:   lastName  || null,
//         avatarUrl:  data.image_url || null,
//         username:   data.username  || null,
//         role,
//         updatedAt:  new Date(),
//       },
//     });
//   }
//   console.log(`Clerk webhook received: ${type} for user ${data.id}`);
//   // ─── user.deleted ──────────────────────────────────────────────────────────
//   if (type === "user.deleted") {
//     // Soft delete — keep the record but mark inactive
//     // This preserves comments, likes, etc. with proper attribution
//     await prismadb.user.updateMany({
//       where: { clerkId: data.id },
//       data: {
//         isActive:    false,
//         email:       `deleted_${data.id}@deleted.invalid`,
//         displayName: "Deleted User",
//         firstName:   null,
//         lastName:    null,
//         avatarUrl:   null,
//         username:    null,
//       },
//     });
//   }

//   return NextResponse.json({ ok: true });
// }