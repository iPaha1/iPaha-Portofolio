// =============================================================================
// Isaac Paha - https://www.isaacpaha.com 
// Multiplayer Room Ready Toggle API Route
// POST /api/multiplayer/rooms/[code]/ready
// Toggles the ready state of the current player and checks for auto-start conditions
// =============================================================================


import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  console.log(`[POST /api/multiplayer/rooms/[code]/ready] received for code=${(await params).code}`);
  const { code } = await params;
  const { userId: clerkId } = getAuth(req);
  
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prismadb.user.findUnique({ 
    where: { clerkId }, 
    select: { id: true } 
  });
  console.log(`[POST /api/multiplayer/rooms/[code]/ready] auth userId=${clerkId}, db userId=${user ? user.id : "NOT FOUND"}`);
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the room and current player state
  const room = await prismadb.multiplayerRoom.findUnique({
    where: { code },
    include: {
      players: {
        where: { userId: user.id },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.players.length === 0) {
    return NextResponse.json({ error: "Player not in room" }, { status: 404 });
  }

  const currentPlayer = room.players[0];
  
  // CRITICAL: Update both isReady AND lastPingAt
  const updatedPlayer = await prismadb.multiplayerPlayer.update({
    where: { id: currentPlayer.id },
    data: { 
      isReady: !currentPlayer.isReady,  // Toggle ready state
      lastPingAt: new Date(),            // ← THIS IS THE KEY FIX
    },
  });

  console.log(`[POST /api/multiplayer/rooms/[code]/ready] Player ${updatedPlayer.displayName} ready status: ${updatedPlayer.isReady}, lastPingAt: ${updatedPlayer.lastPingAt}`);

  // Create an event for the ready state change
  await prismadb.multiplayerEvent2.create({
    data: {
      roomId: room.id,
      type: "PLAYER_READY",
      payload: JSON.stringify({
        userId: user.id,
        isReady: updatedPlayer.isReady,
        displayName: updatedPlayer.displayName,
      }),
    },
  });

  return NextResponse.json({ 
    success: true, 
    isReady: updatedPlayer.isReady,
    lastPingAt: updatedPlayer.lastPingAt,
  });
}