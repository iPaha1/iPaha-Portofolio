
// ─────────────────────────────────────────────────────────────────────────────
// FILE 6: app/api/multiplayer/rooms/[code]/events/route.ts
// GET → poll new events since ?after=<eventId>
// ─────────────────────────────────────────────────────────────────────────────

import { prismadb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

 
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { searchParams } = new URL(req.url);
  const afterId = searchParams.get("after") ?? "";
 
  const room = await prismadb.multiplayerRoom.findUnique({ where: { code }, select: { id: true } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
 
  const events = await prismadb.multiplayerEvent2.findMany({
    where: {
      roomId: room.id,
      ...(afterId ? { id: { gt: afterId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  console.log(`[GET /api/multiplayer/rooms/${code}/events] afterId=${afterId} returned ${events.length} events`);
 
  return NextResponse.json({ events });
}
 