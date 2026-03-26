// app/api/multiplayer/rooms/[code]/start/route.ts
// Host-only: force-start the game regardless of ready states.
// Sets status → COUNTDOWN, broadcasts the event.
// The client poll picks up COUNTDOWN and transitions to "playing".

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { code } = await params;

    const room = await prismadb.multiplayerRoom.findUnique({
      where:   { code },
      include: { players: true },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Only the host can start
    if (room.hostId !== user.id) {
      return NextResponse.json({ error: "Only the host can start the game" }, { status: 403 });
    }

    // Need at least 2 players
    if (room.players.length < 2) {
      return NextResponse.json({ error: "Need at least 2 players to start" }, { status: 400 });
    }

    // Already started
    if (room.status !== "WAITING") {
      return NextResponse.json({ error: "Room is not in WAITING state" }, { status: 400 });
    }

    // Advance to COUNTDOWN
    await prismadb.multiplayerRoom.update({
      where: { id: room.id },
      data:  { status: "COUNTDOWN", startedAt: new Date() },
    });

    await prismadb.multiplayerEvent2.create({
      data: {
        roomId:  room.id,
        type:    "COUNTDOWN_START",
        payload: JSON.stringify({ startedBy: user.id }),
      },
    });

    // For COLOUR_DUEL: host immediately broadcasts round 0
    if (room.gameType === "COLOUR_DUEL") {
      const COLOURS = [
        { name: "RED",    hex: "#ef4444" },
        { name: "BLUE",   hex: "#3b82f6" },
        { name: "GREEN",  hex: "#10b981" },
        { name: "YELLOW", hex: "#eab308" },
        { name: "PURPLE", hex: "#8b5cf6" },
        { name: "ORANGE", hex: "#f97316" },
        { name: "PINK",   hex: "#ec4899" },
        { name: "CYAN",   hex: "#06b6d4" },
      ];
      const ink  = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      const word = COLOURS.filter(c => c !== ink)[Math.floor(Math.random() * (COLOURS.length - 1))];
      const distractors = COLOURS.filter(c => c !== ink).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...distractors, ink].sort(() => Math.random() - 0.5);

      const roundData = {
        roundNumber: 0,
        word,
        inkColor:    ink,
        options,
        timeLimit:   3200,
        startedAt:   Date.now() + 4000, // 4s countdown buffer
      };

      // Store after a short delay so clients see the countdown first
      setTimeout(async () => {
        await prismadb.multiplayerRoom.update({
          where: { id: room.id },
          data:  { roundData: JSON.stringify(roundData), status: "PLAYING" },
        }).catch(() => {});
        await prismadb.multiplayerEvent2.create({
          data: {
            roomId:  room.id,
            type:    "ROUND_START",
            payload: JSON.stringify({ roundNumber: 0 }),
          },
        }).catch(() => {});
      }, 4000);
    }

    return NextResponse.json({ success: true, status: "COUNTDOWN" });
  } catch (error) {
    console.error("[POST /api/multiplayer/rooms/[code]/start]", error);
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }
}





// // app/api/multiplayer/rooms/[code]/start/route.ts
// // Host-only: force-start the game immediately regardless of ready states.
// import { NextRequest, NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";

// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ code: string }> },
// ) {
//   try {
//     const { userId: clerkId } = getAuth(req);
//     if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const user = await prismadb.user.findUnique({
//       where:  { clerkId },
//       select: { id: true },
//     });
//     if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

//     const { code } = await params;

//     const room = await prismadb.multiplayerRoom.findUnique({
//       where:   { code },
//       include: { players: true },
//     });
//     if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

//     // Only the host can start
//     if (room.hostId !== user.id) {
//       return NextResponse.json({ error: "Only the host can start the game" }, { status: 403 });
//     }

//     if (room.players.length < 2) {
//       return NextResponse.json({ error: "Need at least 2 players to start" }, { status: 400 });
//     }

//     if (room.status !== "WAITING") {
//       return NextResponse.json({ error: "Game already started" }, { status: 400 });
//     }

//     await prismadb.multiplayerRoom.update({
//       where: { id: room.id },
//       data:  { status: "COUNTDOWN", startedAt: new Date() },
//     });

//     await prismadb.multiplayerEvent2.create({
//       data: {
//         roomId:  room.id,
//         type:    "COUNTDOWN_START",
//         payload: JSON.stringify({ startedBy: user.id }),
//       },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("[POST /api/multiplayer/rooms/[code]/start]", error);
//     return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
//   }
// }