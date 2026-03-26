
// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: app/api/multiplayer/rooms/[code]/route.ts
// GET → full room state (polled every 800ms)
// ─────────────────────────────────────────────────────────────────────────────

// app/api/multiplayer/rooms/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    console.log(`[GET /api/multiplayer/rooms/[code]] fetching room for code=${(await params).code}`);
    const { code } = await params;

    const room = await prismadb.multiplayerRoom.findUnique({
      where:   { code },
      include: {
        players: { orderBy: { score: "desc" } },
        results: { orderBy: { rank:  "asc"  } },
      },
    });
    console.log(`[GET /api/multiplayer/rooms/[code]] found room=${room ? "YES" : "NO"}`);

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Players who have pinged in the last 20 seconds are considered active.
    // Use a generous window so slow connections aren't dropped prematurely.
    const staleThreshold = new Date(Date.now() - 20_000);
    const activePlayers  = room.players.filter(
      (p) => new Date(p.lastPingAt) > staleThreshold,
    );
    console.log(`[GET /api/multiplayer/rooms/[code]] active players count=${activePlayers.length}`);

    // Track whether we updated the status so we can return the correct value
    let currentStatus = room.status;

    // Detailed debugging
console.log(`[DEBUG] Room ${code} - Status: ${room.status}`);
console.log(`[DEBUG] Total players: ${room.players.length}`);
console.log(`[DEBUG] Active players: ${activePlayers.length}`);
console.log(`[DEBUG] Stale threshold: ${staleThreshold.toISOString()}`);
console.log(`[DEBUG] Player details:`);
room.players.forEach(p => {
  const lastPing = new Date(p.lastPingAt);
  const isActive = lastPing > staleThreshold;
  console.log(`  - ${p.displayName}: ready=${p.isReady}, lastPing=${lastPing.toISOString()}, active=${isActive}, age=${Date.now() - lastPing.getTime()}ms`);
});

// Check if all active players are ready
const allActiveReady = activePlayers.length >= 2 && activePlayers.every(p => p.isReady);
console.log(`[DEBUG] All active players ready: ${allActiveReady} (activeCount=${activePlayers.length}, readyCount=${activePlayers.filter(p=>p.isReady).length})`);


    // Auto-advance: all active players ready + at least 2 present → COUNTDOWN
    if (
      room.status === "WAITING" &&
      activePlayers.length >= 2 &&
      activePlayers.every((p) => p.isReady) // ← only auto-start when ALL active players are ready, not just a majority
    ) {
        console.log(`[DEBUG] ✅ AUTO-START TRIGGERED!`);
      await prismadb.multiplayerRoom.update({
        where: { id: room.id },
        data:  { status: "COUNTDOWN", startedAt: new Date() },
      });
      await prismadb.multiplayerEvent2.create({
        data: { roomId: room.id, type: "COUNTDOWN_START", payload: JSON.stringify({ autoStarted: true }) },
      });
      // ← return the NEW status, not the stale pre-update value
      currentStatus = "COUNTDOWN";
    } else {
  console.log(`[DEBUG] ❌ Auto-start NOT triggered. Conditions:`);
  console.log(`  - room.status === "WAITING": ${room.status === "WAITING"}`);
  console.log(`  - activePlayers.length >= 2: ${activePlayers.length >= 2} (actual: ${activePlayers.length})`);
  console.log(`  - allActiveReady: ${allActiveReady}`);
  if (!allActiveReady && activePlayers.length >= 2) {
    console.log(`  - Not ready players:`, activePlayers.filter(p => !p.isReady).map(p => p.displayName));
  }
}
    console.log(`[GET /api/multiplayer/rooms/[code]] returning status=${currentStatus}`);

    return NextResponse.json({
      room: {
        id:         room.id,
        code:       room.code,
        gameType:   room.gameType,
        status:     currentStatus,          // ← always fresh
        hostId:     room.hostId,
        maxPlayers: room.maxPlayers,
        entryFee:   room.entryFee,
        prizePool:  room.prizePool,
        config:     room.config    ? JSON.parse(room.config)    : null,
        roundData:  room.roundData ? JSON.parse(room.roundData) : null,
        startedAt:  room.startedAt,
        endedAt:    room.endedAt,
      },
      players: activePlayers.map((p) => ({
        userId:      p.userId,
        displayName: p.displayName,
        avatarUrl:   p.avatarUrl,
        score:       p.score,
        isReady:     p.isReady,
        isAlive:     p.isAlive,
      })),
      results: room.results,
    });
  } catch (error) {
    console.error("[GET /api/multiplayer/rooms/[code]]", error);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}