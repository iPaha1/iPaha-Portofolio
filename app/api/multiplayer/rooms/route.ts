// =============================================================================
// MULTIPLAYER API ROUTES
// =============================================================================
// app/api/multiplayer/rooms/route.ts          GET (list) + POST (create)
// app/api/multiplayer/rooms/[code]/route.ts   GET (room state)
// app/api/multiplayer/rooms/[code]/join/route.ts    POST
// app/api/multiplayer/rooms/[code]/ready/route.ts   POST
// app/api/multiplayer/rooms/[code]/score/route.ts   POST (submit score)
// app/api/multiplayer/rooms/[code]/events/route.ts  GET (poll)
// app/api/multiplayer/rooms/[code]/ping/route.ts    POST (heartbeat)
// =============================================================================
 
// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: app/api/multiplayer/rooms/route.ts
// GET  → list open rooms
// POST → create a new room
// ─────────────────────────────────────────────────────────────────────────────


// app/api/multiplayer/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// GET /api/multiplayer/rooms — list open rooms
export async function GET(req: NextRequest) {
  try {
    const rooms = await prismadb.multiplayerRoom.findMany({
      where: { status: "WAITING" },
      include: {
        players: {
          select: { userId: true, displayName: true, isReady: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      rooms: rooms.map((r) => ({
        id:          r.id,
        code:        r.code,
        gameType:    r.gameType,
        playerCount: r.players.length,
        maxPlayers:  r.maxPlayers,
        entryFee:    r.entryFee,
        prizePool:   r.prizePool,
        players:     r.players,
        createdAt:   r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/multiplayer/rooms]", error);
    return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 });
  }
}

// POST /api/multiplayer/rooms — create a new room
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const {
      gameType   = "BLITZ_CLICK_WAR",
      maxPlayers = 6,
      entryFee   = 0,
    } = body;

    // Generate a unique 4-char room code
    let code    = generateCode();
    let attempt = 0;
    while (attempt < 10) {
      const existing = await prismadb.multiplayerRoom.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode();
      attempt++;
    }

    // Deduct entry fee if set
    if (entryFee > 0) {
      const wallet = await prismadb.tokenWallet.findUnique({ where: { userId: user.id } });
      if (!wallet || wallet.balance < entryFee) {
        return NextResponse.json({ error: "Insufficient tokens" }, { status: 400 });
      }
      await prismadb.tokenWallet.update({
        where: { userId: user.id },
        data:  { balance: { decrement: entryFee }, totalSpent: { increment: entryFee } },
      });
    }

    const room = await prismadb.multiplayerRoom.create({
      data: {
        code,
        gameType,
        maxPlayers,
        entryFee,
        prizePool: entryFee,
        hostId:    user.id,
        status:    "WAITING",
      },
    });

    // Auto-join host as first player
    await prismadb.multiplayerPlayer.create({
      data: {
        roomId:      room.id,
        userId:      user.id,
        displayName: user.displayName,
        avatarUrl:   user.avatarUrl,
        isReady:     false,
      },
    });

    await prismadb.multiplayerEvent2.create({
      data: {
        roomId:  room.id,
        type:    "PLAYER_JOIN",
        payload: JSON.stringify({ userId: user.id, displayName: user.displayName }),
      },
    });

    return NextResponse.json({
      room: { id: room.id, code: room.code, gameType: room.gameType },
      dbUserId: user.id,   // ← client stores this to identify itself in roomPlayers
    });
  } catch (error) {
    console.error("[POST /api/multiplayer/rooms]", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}