// =============================================================================
// API: Game Trigger — Always returns a game for manual plays
// app/api/game/trigger/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

const GAME_TYPES = [
  "CLICK_HUNT",
  "TOKEN_RAIN",
  "MYSTERY_BOX",
  "REACTION",
  "MEMORY_MATCH",
  "BUBBLE_BURST",
  "SPEED_TYPER",
  "DODGE_RUSH",
  "NUMBER_PULSE",
  "COLOUR_TAP",
  "MOLE_MASH",
  "GRAVITY_FLIP",
  "MATH_BLITZ",
  "SHADOW_TRACE",
  "TILE_FLIP",
  "PIXEL_PAINT",
  "SIGNAL_CHAIN",
  "RHYTHM_PULSE",
  "STAR_CONNECT",
  "PRECISION_STOP",
  "CHAIN_REACTION",
  "MIRROR_PAINTER",
  "WORD_HUNT",
  "NEON_TRAIL",
  "FREQUENCY_MATCH",
  "ICE_SLIDE",
  "SONAR_SWEEP",
  "AUCTION_BLITZ",
] as const;

type GameType = typeof GAME_TYPES[number];

const GAME_CONFIG: Record<GameType, { base: number; duration: number; title: string; description: string }> = {
  CLICK_HUNT:  { base: 8,  duration: 15, title: "🎯 Click Hunt",    description: "Click every target before it disappears!" },
  TOKEN_RAIN:  { base: 6,  duration: 12, title: "💰 Token Rain",    description: "Catch the falling tokens — gold is rarest!" },
  MYSTERY_BOX: { base: 5,  duration: 5,  title: "🎁 Mystery Box",   description: "Pick a box and reveal your token multiplier!" },
  REACTION:    { base: 7,  duration: 30, title: "⚡ Reaction Test",  description: "Click the moment it turns green. Fastest wins!" },
  MEMORY_MATCH: { base: 9,  duration: 45, title: "🧠 Memory Match",   description: "Flip cards and find matching pairs!" },
  BUBBLE_BURST: { base: 7,  duration: 20, title: "🫧 Bubble Burst",   description: "Pop bubbles of the same colour for chain combos!" },
  SPEED_TYPER:  { base: 8,  duration: 35, title: "⌨️ Speed Typer",    description: "Type the glowing words as fast as you can!" },
  DODGE_RUSH:    { base: 9,  duration: 20, title: "🚀 Dodge Rush",      description: "Dodge falling obstacles and collect coins!"         },
  NUMBER_PULSE:  { base: 8,  duration: 45, title: "🔢 Number Pulse",    description: "Memorise the sequence then tap it back!"            },
  COLOUR_TAP:    { base: 7,  duration: 30, title: "🎨 Colour Tap",      description: "Tap the ink colour — not what the word says!"       },
  MOLE_MASH:     { base: 8,  duration: 20, title: "🔨 Mole Mash",       description: "Whack the moles — dodge the bombs!"                 },
  GRAVITY_FLIP: { base: 9,  duration: 25, title: "🌀 Gravity Flip",   description: "Tap to flip gravity and guide the ball through gaps!"},
  MATH_BLITZ:   { base: 8,  duration: 35, title: "🧮 Math Blitz",     description: "Solve equations fast before the timer runs out!"    },
  SHADOW_TRACE: { base: 9,  duration: 60, title: "✏️ Shadow Trace",   description: "Memorise the path, then draw it from memory!"       },
  TILE_FLIP:    { base: 9,  duration: 60, title: "💡 Tile Flip",      description: "Flip tiles to make the board all one colour!"       },
  PIXEL_PAINT:  { base: 10, duration: 90, title: "🎨 Pixel Paint",     description: "Memorise the pixel art, then recreate it from memory!" },
  SIGNAL_CHAIN: { base: 10, duration: 60, title: "⚡ Signal Chain",    description: "Rotate circuit tiles to complete the electric path!"   },
  RHYTHM_PULSE: { base: 9,  duration: 30, title: "🎵 Rhythm Pulse",    description: "Tap the beat as pulses hit the ring — feel the tempo!" },
  STAR_CONNECT: { base: 8,  duration: 45, title: "⭐ Star Connect",    description: "Draw lines to connect the stars without crossing paths!" },
  PRECISION_STOP: { base: 10, duration: 30, title: "🎯 Precision Stop", description: "Stop the moving bar in the target zone for max points!" },
  CHAIN_REACTION: { base: 9,  duration: 40, title: "💥 Chain Reaction", description: "Trigger explosions to set off a chain reaction and clear the board!" },
  MIRROR_PAINTER: { base: 10, duration: 60, title: "🖼️ Mirror Painter", description: "Paint one half of the canvas while the other half mirrors your moves!" },
  WORD_HUNT:      { base: 8,  duration: 45, title: "🔤 Word Hunt",      description: "Find as many words as you can in the letter grid before time runs out!" },
  NEON_TRAIL:     { base: 9,  duration: 30, title: "🌈 Neon Trail",       description: "Guide the neon snake to eat orbs and grow longer — but don't crash!" },
  FREQUENCY_MATCH: { base: 10, duration: 30, title: "📡 Frequency Match", description: "Tune the dials to match the target frequency before time runs out!" },
  ICE_SLIDE:       { base: 9,  duration: 40, title: "❄️ Ice Slide",      description: "Slide the ice blocks to clear a path and reach the goal!" },
  SONAR_SWEEP:     { base: 8,  duration: 30, title: "📡 Sonar Sweep",     description: "Use sonar pings to locate hidden objects in the grid!" },
  AUCTION_BLITZ:   { base: 10, duration: 60, title: "💸 Auction Blitz",   description: "Bid on mystery items with your tokens — some are rare!" }
};

// Picks a random game type, optionally excluding the last played
function pickRandomGame(exclude?: GameType): GameType {
  const pool = exclude
    ? GAME_TYPES.filter(t => t !== exclude)
    : [...GAME_TYPES];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find db user
    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true, displayName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Read request body — manual=true means the user clicked the button directly
    let manual = false;
    try {
      const body = await req.json();
      manual = !!body?.manual;
    } catch {
      // no body is fine — defaults to manual=false (auto-drop)
    }

    // Check game settings
    const settings = await prismadb.gameSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.gameEnabled) {
      return NextResponse.json({ game: null, reason: "game_disabled" });
    }

    // For auto-drops: enforce cooldown. For manual plays: always show a game.
    if (!manual) {
      const lastParticipation = await prismadb.gameParticipation.findFirst({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
      });

      if (lastParticipation) {
        const minutesSince = (Date.now() - lastParticipation.completedAt.getTime()) / 60000;
        const minDelay = settings.minGameDelay ?? 2;
        if (minutesSince < minDelay) {
          return NextResponse.json({ game: null, reason: "cooldown" });
        }
      }
    }

    // Find what game the user played most recently to avoid repeats
    const lastGame = await prismadb.gameParticipation.findFirst({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      include: { gameEvent: { select: { type: true } } },
    });
    const lastType = lastGame?.gameEvent?.type as GameType | undefined;

    // Pick a game — avoid the same one twice in a row
    const gameType = pickRandomGame(lastType);
    const cfg      = GAME_CONFIG[gameType];

    // Flash event: 15% chance on auto, 25% on manual (reward for clicking)
    const isFlash     = Math.random() < (manual ? 0.25 : 0.15);
    const bonusTokens = isFlash ? cfg.base * 2 : undefined;

    // Create game event in DB
    const gameEvent = await prismadb.gameEvent.create({
      data: {
        type:        gameType,
        rewardTokens: cfg.base,
        bonusTokens,
        title:       cfg.title,
        description: cfg.description,
        duration:    cfg.duration,
        isFlash,
        isActive:    true,
        triggerType: manual ? "USER_ACTION" : "RANDOM",
      },
    });

    // Log the trigger
    await prismadb.gameTriggerLog.create({
      data: {
        triggerType: manual ? "USER_ACTION" : "RANDOM",
        gameEventId: gameEvent.id,
        userId:      user.id,
        success:     true,
        reason:      manual ? "Manual play button clicked" : "Auto random drop",
      },
    });

    return NextResponse.json({
      game: {
        id:           gameEvent.id,
        type:         gameEvent.type,
        rewardTokens: gameEvent.rewardTokens,
        bonusTokens:  gameEvent.bonusTokens,
        title:        gameEvent.title,
        description:  gameEvent.description,
        duration:     gameEvent.duration,
        isFlash:      gameEvent.isFlash,
      },
    });
  } catch (error) {
    console.error("[game/trigger]", error);
    return NextResponse.json({ error: "Failed to trigger game" }, { status: 500 });
  }
}






// // =============================================================================
// // API: Game Trigger
// // app/api/game/trigger/route.ts
// // =============================================================================

// // app/api/game/trigger/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";

// const GAME_TYPES = ["CLICK_HUNT", "TOKEN_RAIN", "MYSTERY_BOX", "REACTION"] as const;
// const GAME_REWARDS = {
//   CLICK_HUNT: { base: 5, maxMultiplier: 2 },
//   TOKEN_RAIN: { base: 3, maxMultiplier: 3 },
//   MYSTERY_BOX: { base: 2, maxMultiplier: 5 },
//   REACTION: { base: 4, maxMultiplier: 2.5 },
// };

// export async function POST(req: NextRequest) {
//   console.log("[game/trigger] Triggering game event...");
//   try {
//     const { userId: clerkId } = getAuth(req);
//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     console.log("[game/trigger] Clerk ID:", clerkId);

//     // Find the user using clerkId to get the database ID
//     const user = await prismadb.user.findUnique({
//       where: { clerkId },
//       select: { id: true, displayName: true },
//     });
    
//     console.log("[game/trigger] Found user:", user);

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     // Use the database ID (user.id) to query game_settings
//     const settings = await prismadb.gameSettings.findUnique({
//       where: { userId: user.id },  // ← Use database ID, not clerkId
//     });
//     console.log("[game/trigger] User settings:", settings);

//     if (!settings?.gameEnabled) {
//       console.log("[game/trigger] Game disabled for user:", clerkId);
//       return NextResponse.json({ game: null, reason: "game_disabled" });
//     }

//     // Check if user played recently (cooldown)
//     const lastParticipation = await prismadb.gameParticipation.findFirst({
//       where: { userId: user.id },  // ← Use database ID
//       orderBy: { completedAt: "desc" },
//     });

//     if (lastParticipation) {
//       const minutesSince = (Date.now() - lastParticipation.completedAt.getTime()) / 60000;
//       if (settings.minGameDelay && minutesSince < settings.minGameDelay) {
//         console.log("[game/trigger] User is on cooldown:", clerkId);
//         return NextResponse.json({ game: null, reason: "cooldown" });
//       }
//     }

//     // Select random game type
//     const gameType = GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
//     const reward = GAME_REWARDS[gameType];
    
//     // Determine if it's a flash event (20% chance)
//     const isFlash = Math.random() < 0.2;
//     const bonusTokens = isFlash ? reward.base * 2 : undefined;
    
//     const gameTitles = {
//       CLICK_HUNT: "🎯 Click Hunt",
//       TOKEN_RAIN: "💰 Token Rain",
//       MYSTERY_BOX: "🎁 Mystery Box",
//       REACTION: "⚡ Reaction Test",
//     };
    
//     const gameDescriptions = {
//       CLICK_HUNT: "Click as many targets as you can before time runs out!",
//       TOKEN_RAIN: "Catch falling tokens! Each one adds to your score.",
//       MYSTERY_BOX: "Open the box for a surprise multiplier!",
//       REACTION: "Click the moment it turns green. Speed = bigger reward!",
//     };

//     // Create game event
//     const gameEvent = await prismadb.gameEvent.create({
//       data: {
//         type: gameType,
//         rewardTokens: reward.base,
//         bonusTokens,
//         title: gameTitles[gameType],
//         description: gameDescriptions[gameType],
//         duration: gameType === "CLICK_HUNT" ? 15 : gameType === "TOKEN_RAIN" ? 10 : 5,
//         isFlash,
//         isActive: true,
//         triggerType: "RANDOM",
//       },
//     });

//     // Log trigger with the database user ID
//     await prismadb.gameTriggerLog.create({
//       data: {
//         triggerType: "RANDOM",
//         gameEventId: gameEvent.id,
//         userId: user.id,  // ← Use database ID
//         success: true,
//       },
//     });

//     return NextResponse.json({
//       game: {
//         id: gameEvent.id,
//         type: gameEvent.type,
//         rewardTokens: gameEvent.rewardTokens,
//         bonusTokens: gameEvent.bonusTokens,
//         title: gameEvent.title,
//         description: gameEvent.description,
//         duration: gameEvent.duration,
//         isFlash: gameEvent.isFlash,
//       },
//     });
//   } catch (error) {
//     console.error("[game/trigger]", error);
//     return NextResponse.json({ error: "Failed to trigger game" }, { status: 500 });
//   }
// }