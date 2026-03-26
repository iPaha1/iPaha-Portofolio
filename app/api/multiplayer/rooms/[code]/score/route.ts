 
// ─────────────────────────────────────────────────────────────────────────────
// FILE 5: app/api/multiplayer/rooms/[code]/score/route.ts
// POST → submit/update live score + detect game completion
// ─────────────────────────────────────────────────────────────────────────────

import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

 
const PRIZE_SPLITS = [0.6, 0.25, 0.15]; // 1st/2nd/3rd of prize pool
 
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
 
  const { score, isFinal = false, metadata } = await req.json();
 
  const room = await prismadb.multiplayerRoom.findUnique({
    where: { code },
    include: { players: { orderBy: { score: "desc" } } },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
 
  const player = room.players.find(p => p.userId === user.id);
  if (!player) return NextResponse.json({ error: "Not in room" }, { status: 400 });
 
  // Update score
  await prismadb.multiplayerPlayer.update({
    where: { id: player.id },
    data: { score, lastPingAt: new Date() },
  });
 
  // Broadcast score event
  await prismadb.multiplayerEvent2.create({
    data: {
      roomId: room.id, type: "SCORE_UPDATE",
      payload: JSON.stringify({ userId: user.id, displayName: player.displayName, score }),
    },
  });
 
  // If this player finished (isFinal), check if all finished
  if (isFinal) {
    await prismadb.multiplayerPlayer.update({ where: { id: player.id }, data: { isAlive: false } });
 
    // Refresh players
    const updatedPlayers = await prismadb.multiplayerPlayer.findMany({
      where: { roomId: room.id }, orderBy: { score: "desc" },
    });
 
    // Game over when all players submit final score OR time has expired
    const allDone = updatedPlayers.every(p => !p.isAlive);
    if (allDone || room.status === "PLAYING") {
      // Check if game duration exceeded
      const gameDuration = 32_000; // 30s + buffer
      const elapsed = room.startedAt ? Date.now() - room.startedAt.getTime() : 0;
 
      if (allDone || elapsed > gameDuration) {
        // Finalise results
        await prismadb.multiplayerRoom.update({ where: { id: room.id }, data: { status: "RESULTS", endedAt: new Date() } });
 
        // Award tokens
        const pool = room.prizePool;
        const baseReward = 5; // min reward for participation
 
        const results = await Promise.all(updatedPlayers.map(async (p, i) => {
          const rank = i + 1;
          const splitPct = PRIZE_SPLITS[i] ?? 0;
          const prizeShare = pool > 0 ? Math.round(pool * splitPct) : 0;
          const tokensEarned = prizeShare || (rank === 1 ? 20 : rank === 2 ? 12 : rank === 3 ? 8 : baseReward);
 
          await prismadb.tokenWallet.upsert({
            where: { userId: p.userId },
            create: { userId: p.userId, balance: tokensEarned, totalEarned: tokensEarned, totalSpent: 0 },
            update: { balance: { increment: tokensEarned }, totalEarned: { increment: tokensEarned } },
          });
          await prismadb.tokenTransaction.create({
            data: { userId: p.userId, amount: tokensEarned, type: "GAME_REWARD", description: `Multiplayer ${room.gameType} — Rank #${rank}` },
          });
          await prismadb.multiplayerResult.create({
            data: { roomId: room.id, userId: p.userId, displayName: p.displayName, finalScore: p.score, rank, tokensEarned },
          });
 
          return { userId: p.userId, displayName: p.displayName, score: p.score, rank, tokensEarned };
        }));
 
        await prismadb.multiplayerEvent2.create({
          data: { roomId: room.id, type: "GAME_OVER", payload: JSON.stringify({ results }) },
        });
 
        return NextResponse.json({ success: true, gameOver: true, results });
      }
    }
  }
 
  return NextResponse.json({ success: true, gameOver: false });
}