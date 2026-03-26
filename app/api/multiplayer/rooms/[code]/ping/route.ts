
// ─────────────────────────────────────────────────────────────────────────────
// FILE 7: app/api/multiplayer/rooms/[code]/ping/route.ts
// POST → heartbeat to keep player in room
// ─────────────────────────────────────────────────────────────────────────────

import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

 
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    console.log(`[POST /api/multiplayer/rooms/[code]/ping] received ping for code=${(await params).code}`);
  const { code } = await params;
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return NextResponse.json({ ok: true });
 
  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: true });
 
  const room = await prismadb.multiplayerRoom.findUnique({ where: { code }, select: { id: true } });
  if (!room) return NextResponse.json({ ok: true });
 
  await prismadb.multiplayerPlayer.updateMany({
    where: { roomId: room.id, userId: user.id },
    data: { lastPingAt: new Date() },
  });
 
  return NextResponse.json({ ok: true });
}
