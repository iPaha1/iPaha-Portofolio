// =============================================================================
// isaacpaha.com — Birthday Planner — Checklist API
// app/api/tools/birthday-planner/checklist/route.ts
//
// GET  ?partyId=xxx → get all checklist items
// POST             → add new item
// PATCH ?id=xxx    → toggle isDone / update text
// DELETE ?id=xxx   → remove item
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function resolveParty(partyId: string, clerkId: string) {
  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return null;
  return prismadb.party.findFirst({ where: { id: partyId, userId: user.id } });
}

export async function GET(req: NextRequest) {
  const partyId = new URL(req.url).searchParams.get("partyId");
  if (!partyId) return NextResponse.json({ error: "partyId required" }, { status: 400 });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await resolveParty(partyId, userId);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await prismadb.checklistItem.findMany({
    where:   { partyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body    = await req.json();
  const party   = await resolveParty(body.partyId, userId);
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const count = await prismadb.checklistItem.count({ where: { partyId: party.id } });

  const item = await prismadb.checklistItem.create({
    data: {
      partyId:   party.id,
      text:      body.text?.trim() ?? "New item",
      category:  body.category ?? "general",
      sortOrder: count,
      isAI:      false,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const id   = new URL(req.url).searchParams.get("id");
  const body = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify ownership via party relation
  const item = await prismadb.checklistItem.findUnique({ where: { id }, include: { party: { select: { userId: true } } } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || item.party.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prismadb.checklistItem.update({
    where: { id },
    data:  { isDone: body.isDone ?? undefined, text: body.text?.trim() ?? undefined, category: body.category ?? undefined },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await prismadb.checklistItem.findUnique({ where: { id }, include: { party: { select: { userId: true } } } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || item.party.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prismadb.checklistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}