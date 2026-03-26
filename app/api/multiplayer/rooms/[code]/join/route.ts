// app/api/multiplayer/rooms/[code]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

// POST /api/multiplayer/rooms/[code]/join
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { code } = await params;

    const room = await prismadb.multiplayerRoom.findUnique({
      where:   { code },
      include: { players: true },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.status !== "WAITING")
      return NextResponse.json({ error: "Game has already started" }, { status: 400 });
    if (room.players.length >= room.maxPlayers)
      return NextResponse.json({ error: "Room is full" }, { status: 400 });

    const alreadyJoined = room.players.find((p) => p.userId === user.id);

    if (!alreadyJoined) {
      // Deduct entry fee
      if (room.entryFee > 0) {
        const wallet = await prismadb.tokenWallet.findUnique({ where: { userId: user.id } });
        if (!wallet || wallet.balance < room.entryFee) {
          return NextResponse.json({ error: "Insufficient tokens" }, { status: 400 });
        }
        await prismadb.tokenWallet.update({
          where: { userId: user.id },
          data:  { balance: { decrement: room.entryFee }, totalSpent: { increment: room.entryFee } },
        });
        await prismadb.multiplayerRoom.update({
          where: { id: room.id },
          data:  { prizePool: { increment: room.entryFee } },
        });
      }

      await prismadb.multiplayerPlayer.create({
        data: {
          roomId:      room.id,
          userId:      user.id,
          displayName: user.displayName,
          avatarUrl:   user.avatarUrl,
        },
      });

      await prismadb.multiplayerEvent2.create({
        data: {
          roomId:  room.id,
          type:    "PLAYER_JOIN",
          payload: JSON.stringify({ userId: user.id, displayName: user.displayName }),
        },
      });
    }

    return NextResponse.json({ success: true, dbUserId: user.id });  // ← client stores DB ID
  } catch (error) {
    console.error("[POST /api/multiplayer/rooms/[code]/join]", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}