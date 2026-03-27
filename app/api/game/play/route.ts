// =============================================================================
// API: /api/game/play — Launch a specific game by type (Game Page)
// app/api/game/play/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

const GAME_CONFIG: Record<string, { base: number; duration: number; title: string; description: string; category: string }> = {
  CLICK_HUNT:   { base: 8,  duration: 15, title: "🎯 Click Hunt",    description: "Click every target before it disappears!",          category: "reflex"  },
  TOKEN_RAIN:   { base: 6,  duration: 12, title: "💰 Token Rain",    description: "Catch the falling tokens — gold ones are rarest!",  category: "reflex"  },
  MYSTERY_BOX:  { base: 5,  duration: 8,  title: "🎁 Mystery Box",   description: "Pick a box and reveal your token multiplier!",      category: "luck"    },
  REACTION:     { base: 7,  duration: 30, title: "⚡ Reaction Test", description: "Click the moment it turns green. Fastest wins!",    category: "reflex"  },
  MEMORY_MATCH: { base: 9,  duration: 45, title: "🧠 Memory Match",  description: "Flip cards and find matching pairs!",               category: "memory"  },
  BUBBLE_BURST: { base: 7,  duration: 18, title: "🫧 Bubble Burst",  description: "Pop colour chains before bubbles escape!",          category: "reflex"  },
  SPEED_TYPER:  { base: 8,  duration: 30, title: "⌨️ Speed Typer",   description: "Type the glowing word before it expires!",          category: "skill"   },
  DODGE_RUSH:   { base: 9,  duration: 20, title: "🚀 Dodge Rush",    description: "Dodge falling obstacles and collect coins!",        category: "reflex"  },
  NUMBER_PULSE: { base: 8,  duration: 45, title: "🔢 Number Pulse",  description: "Memorise the sequence then tap it back!",           category: "memory"  },
  COLOUR_TAP:   { base: 7,  duration: 30, title: "🎨 Colour Tap",    description: "Tap the ink colour — not what the word says!",      category: "brain"   },
  MOLE_MASH:    { base: 8,  duration: 20, title: "🔨 Mole Mash",     description: "Whack the moles — dodge the bombs!",               category: "reflex"  },
    GRAVITY_FLIP: { base: 9,  duration: 25, title: "🌀 Gravity Flip",   description: "Tap to flip gravity and guide the ball through gaps!", category: "skill"   },
    MATH_BLITZ:   { base: 8,  duration: 35, title: "🧮 Math Blitz",     description: "Solve equations fast before the timer runs out!",    category: "brain"   },
    SHADOW_TRACE: { base: 9,  duration: 60, title: "✏️ Shadow Trace",   description: "Memorise the path, then draw it from memory!",       category: "memory"  },
    TILE_FLIP:    { base: 9,  duration: 60, title: "💡 Tile Flip",      description: "Flip tiles to make the board all one colour!",       category: "memory"  },
    PIXEL_PAINT:  { base: 10, duration: 90, title: "🎨 Pixel Paint",     description: "Memorise the pixel art, then recreate it from memory!", category: "memory"  },
    SIGNAL_CHAIN: { base: 10, duration: 60, title: "⚡ Signal Chain",    description: "Rotate circuit tiles to complete the electric path!",   category: "memory"  },
    RHYTHM_PULSE: { base: 9,  duration: 30, title: "🎵 Rhythm Pulse",    description: "Tap the beat as pulses hit the ring — feel the tempo!", category: "memory"  },
    STAR_CONNECT: { base: 8,  duration: 45, title: "⭐ Star Connect",    description: "Draw lines to connect the stars without crossing paths!", category: "skill"   },
    PRECISION_STOP: { base: 10, duration: 30, title: "🎯 Precision Stop", description: "Stop the moving bar in the target zone for max points!", category: "skill"   },
    CHAIN_REACTION: { base: 9,  duration: 40, title: "💥 Chain Reaction", description: "Trigger explosions to set off a chain reaction and clear the board!", category: "skill"   },
    MIRROR_PAINTER: { base: 10, duration: 60, title: "🖼️ Mirror Painter", description: "Paint one half of the canvas while the other half mirrors your moves!", category: "skill"   },
    WORD_HUNT:      { base: 8,  duration: 45, title: "🔤 Word Hunt",      description: "Find as many words as you can in the letter grid before time runs out!", category: "brain"  },
    NEON_TRAIL:     { base: 9,  duration: 30, title: "🌈 Neon Trail",       description: "Guide the neon snake to eat orbs and grow longer — but don't crash!", category: "skill"   },
    FREQUENCY_MATCH: { base: 10, duration: 30, title: "📡 Frequency Match", description: "Tune the dials to match the target frequency before time runs out!", category: "skill"   },
    ICE_SLIDE:       { base: 9,  duration: 40, title: "❄️ Ice Slide",      description: "Slide the ice blocks to clear a path and reach the goal!", category: "brain"   },
    SONAR_SWEEP:     { base: 8,  duration: 30, title: "📡 Sonar Sweep",     description: "Use sonar pings to locate hidden objects in the grid!", category: "brain"   },
    AUCTION_BLITZ:   { base: 10, duration: 60, title: "💸 Auction Blitz",   description: "Bid on mystery items with your tokens — some are rare!", category: "luck" },
    LASER_GRID:      { base: 10, duration: 60, title: "🔫 Laser Grid",      description: "Navigate the laser grid without breaking the beams!",          category: "skill"   },
    SEQUENCE_MEMORY: { base: 8,  duration: 45, title: "🔢 Sequence Memory",  description: "Watch a sequence light up, then tap it back perfectly!",       category: "memory", },
    VAULT_CRACKER:   { base: 10, duration: 60, title: "🔒 Vault Cracker",    description: "Crack the 3-digit code before time runs out!",            category: "memory"   },
    NEON_TYPERACE:   { base: 9,  duration: 30, title: "🌈 Neon Typerace",    description: "Type the scrolling words to speed up your neon car.",         category: "skill"   }  ,
    ORBIT_SLINGSHOT: { base: 10, duration: 60, title: "🪐 Orbit Slingshot",   description: "Slingshot the spaceship around planets to reach the target.", category: "skill"   } ,
    COLOR_FLOOD:     { base: 10, duration: 60, title: "🎨 Color Flood",       description: "Flood the board with your colour before the timer runs out!", category: "skill"   },
    PULSE_CATCHER:   { base: 9,  duration: 30, title: "⚡ Pulse Catcher",     description: "Catch the pulses as they hit the ring — feel the rhythm!", category: "skill"   },
    SHADOW_MATCH:    { base: 8,  duration: 45, title: "👤 Shadow Match",      description: "Match the shadows to the objects — test your memory!", category: "memory"  },
    WARP_SPEED:      { base: 10, duration: 60, title: "🌀 Warp Speed",        description: "Navigate through warp zones at high speed — test your reflexes!", category: "skill"   },
    MIND_THE_GAP:    { base: 9,  duration: 30, title: "🤔 Mind The Gap",      description: "Jump through gaps in the neon platform — test your timing!", category: "skill"   }
    // NEON_TYPERACE:   { base: 9,  duration: 30, title: "霓虹打字赛车",    description: "快速打字以加速你的霓虹赛车！",         category: "skill",  difficulty: 3, duration: 30, baseReward: 9,  accent: "#8b5cf6", tip: "更快的打字 = 更快的赛车。注意红色的单词！" },
    // ORBIT_SLINGSHOT: { base: 10, duration: 60, title: "轨道弹弓",   emoji: "🪐", description: "用弹弓发射宇宙飞船绕过行星到达目标。", category: "skill",  difficulty: 3, duration: 60, baseReward: 10, accent: "#6366f1", tip: "规划一条绕过行星引力井的路线。" }

};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { gameType } = await req.json();
    if (!gameType || !GAME_CONFIG[gameType]) {
      return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
    }

    const cfg     = GAME_CONFIG[gameType];
    const isFlash = Math.random() < 0.2;

    const gameEvent = await prismadb.gameEvent.create({
      data: {
        type:         gameType,
        rewardTokens: cfg.base,
        bonusTokens:  isFlash ? cfg.base * 2 : undefined,
        title:        cfg.title,
        description:  cfg.description,
        duration:     cfg.duration,
        isFlash,
        isActive:     true,
        triggerType:  "USER_ACTION",
      },
    });

    await prismadb.gameTriggerLog.create({
      data: {
        triggerType: "USER_ACTION",
        gameEventId: gameEvent.id,
        userId:      user.id,
        success:     true,
        reason:      `Game page direct launch: ${gameType}`,
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
    console.error("[game/play]", error);
    return NextResponse.json({ error: "Failed to launch game" }, { status: 500 });
  }
}