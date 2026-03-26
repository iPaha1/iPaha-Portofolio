// =============================================================================
// isaacpaha.com — Birthday Planner — Song Suggestions API
// app/api/tools/birthday-planner/songs/route.ts
//
// GET  ?partyId=xxx OR ?token=xxx → get all songs (approved + pending)
// POST                            → guest submits song suggestion (public via token)
// PATCH ?id=xxx&action=approve|upvote → organiser approves or guest upvotes
// DELETE ?id=xxx                  → organiser deletes song
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp      = new URL(req.url).searchParams;
  const partyId = sp.get("partyId");
  const token   = sp.get("token");

  let party: any = null;
  if (partyId) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    party = user ? await prismadb.party.findFirst({ where: { id: partyId, userId: user.id } }) : null;
  } else if (token) {
    party = await prismadb.party.findUnique({ where: { inviteToken: token } });
  }

  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const songs = await prismadb.songSuggestion.findMany({
    where:   { partyId: party.id },
    orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ songs });
}

export async function POST(req: NextRequest) {
  const body  = await req.json();
  const token = body.inviteToken;

  // Resolve party via token (public) or partyId (authenticated)
  let party: any = null;
  if (token) {
    party = await prismadb.party.findUnique({ where: { inviteToken: token } });
  } else if (body.partyId) {
    const { userId } = await auth();
    const user = userId ? await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } }) : null;
    party = user ? await prismadb.party.findFirst({ where: { id: body.partyId, userId: user.id } }) : null;
  }

  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
  if (!body.title?.trim()) return NextResponse.json({ error: "Song title required" }, { status: 400 });

  const song = await prismadb.songSuggestion.create({
    data: {
      partyId:     party.id,
      title:       body.title.trim(),
      artist:      body.artist?.trim() ?? null,
      suggestedBy: body.suggestedBy?.trim() ?? "A guest",
      isApproved:  !!body.isApproved,
    },
  });

  return NextResponse.json({ ok: true, song });
}

export async function PATCH(req: NextRequest) {
  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const action = sp.get("action") ?? "approve";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  if (action === "upvote") {
    // Public upvote via token
    const song = await prismadb.songSuggestion.findUnique({ where: { id }, include: { party: true } });
    if (!song) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (body.inviteToken && song.party.inviteToken !== body.inviteToken) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    const updated = await prismadb.songSuggestion.update({ where: { id }, data: { upvotes: { increment: 1 } } });
    return NextResponse.json({ ok: true, song: updated });
  }

  // approve/delete — organiser only
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const song = await prismadb.songSuggestion.findUnique({ where: { id }, include: { party: { select: { userId: true } } } });
  if (!song) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || song.party.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "approve") {
    const updated = await prismadb.songSuggestion.update({ where: { id }, data: { isApproved: !song.isApproved } });
    return NextResponse.json({ ok: true, song: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const id   = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const song = await prismadb.songSuggestion.findUnique({ where: { id }, include: { party: { select: { userId: true } } } });
  if (!song) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || song.party.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prismadb.songSuggestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}