// =============================================================================
// isaacpaha.com — Shopping List Share API
// app/api/tools/shopping/share/route.ts
//
// GET  ?shareId=XXX         → fetch list + items for the public shared page
// POST ?shareId=XXX         → add item as a guest (no auth required)
// GET  ?shareId=XXX&poll=1  → lightweight poll — returns only { lastActivityAt }
//                             so the shared page knows whether to re-fetch
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp      = new URL(req.url).searchParams;
  const shareId = sp.get("shareId");
  const isPoll  = sp.get("poll") === "1";

  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const list = await prismadb.shoppingList.findUnique({
    where: { shareId },
    select: isPoll
      ? { id: true, lastActivityAt: true, boughtCount: true, itemCount: true, visibility: true, userId: true }
      : {
          id: true, name: true, emoji: true, description: true,
          shareId: true, visibility: true, storeName: true,
          budgetEnabled: true, budgetAmount: true, currency: true, actualSpend: true,
          itemCount: true, boughtCount: true, completedAt: true,
          lastActivityAt: true, createdAt: true, updatedAt: true,
          userId: true,
          items: {
            where:   { status: { not: "SKIPPED" } },
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
  });

  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
  if (list.visibility === "PRIVATE") {
    // Only owner can see private lists — check auth
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "This list is private" }, { status: 403 });
    const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user || user.id !== list.userId) {
      return NextResponse.json({ error: "This list is private" }, { status: 403 });
    }
  }

  return NextResponse.json({ list });
}

export async function POST(req: NextRequest) {
  const sp      = new URL(req.url).searchParams;
  const shareId = sp.get("shareId");

  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const list = await prismadb.shoppingList.findUnique({
    where:  { shareId },
    select: { id: true, visibility: true },
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
  if (list.visibility === "PRIVATE") return NextResponse.json({ error: "This list is private" }, { status: 403 });

  const body = await req.json();
  const { name, quantity, unit, category = "OTHER", brand, notes, guestName, estimatedPrice } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Item name required" }, { status: 400 });

  const maxOrder = await prismadb.listItem.findFirst({
    where:   { listId: list.id },
    orderBy: { sortOrder: "desc" },
    select:  { sortOrder: true },
  });

  const item = await prismadb.listItem.create({
    data: {
      listId:         list.id,
      addedBy:        guestName ?? "Guest",
      name:           name.trim(),
      quantity:       quantity ? String(quantity) : null,
      unit:           unit?.trim()  ?? null,
      category:       category as any,
      brand:          brand?.trim() ?? null,
      notes:          notes?.trim() ?? null,
      estimatedPrice: estimatedPrice ? String(estimatedPrice) : null,
      sortOrder:      (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  await prismadb.shoppingList.update({
    where: { id: list.id },
    data:  { itemCount: { increment: 1 }, lastActivityAt: new Date() },
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}

// ─── PATCH: tick item on/off from the shared page ─────────────────────────────

export async function PATCH(req: NextRequest) {
  const sp      = new URL(req.url).searchParams;
  const shareId = sp.get("shareId");
  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const list = await prismadb.shoppingList.findUnique({
    where:  { shareId },
    select: { id: true, visibility: true },
  });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (list.visibility === "PRIVATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { itemId, status, boughtBy, actualPrice } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const item = await prismadb.listItem.findFirst({
    where: { id: itemId, listId: list.id },
    select: { id: true, status: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const nowBought   = status === "BOUGHT" && item.status !== "BOUGHT";
  const nowUnbought = status === "PENDING" && item.status === "BOUGHT";

  const updated = await prismadb.listItem.update({
    where: { id: itemId },
    data: {
      status,
      ...(nowBought   && { boughtAt: new Date(), boughtBy: boughtBy ?? "Someone" }),
      ...(nowUnbought && { boughtAt: null, boughtBy: null }),
      ...(actualPrice !== undefined && { actualPrice: actualPrice ? String(actualPrice) : null }),
    },
  });

  await prismadb.shoppingList.update({
    where: { id: list.id },
    data: {
      boughtCount:    nowBought ? { increment: 1 } : nowUnbought ? { decrement: 1 } : undefined,
      lastActivityAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}