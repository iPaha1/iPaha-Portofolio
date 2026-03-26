// =============================================================================
// isaacpaha.com — Single List Item API
// app/api/tools/shopping/lists/[id]/items/[itemId]/route.ts
// PATCH  → update item (tick off, edit name, price, etc.)
// DELETE → remove item
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";

type Params = { params: Promise<{ listId: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    const { listId, itemId } = await params;

  const body = await req.json();
  const {
    name, quantity, unit, category, brand, notes,
    estimatedPrice, actualPrice, status, boughtBy,
    sortOrder,
  } = body;

  // Validate item belongs to list
  const item = await prismadb.listItem.findFirst({
    where: { id: itemId, listId: listId },
    select: { id: true, status: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const wasBought = item.status === "BOUGHT";
  const nowBought = status === "BOUGHT";
  const nowUnbought = status === "PENDING" && wasBought;

  const updated = await prismadb.listItem.update({
    where: { id: itemId },
    data: {
      ...(name           !== undefined && { name: name.trim()                    }),
      ...(quantity       !== undefined && { quantity: quantity ? String(quantity) : null }),
      ...(unit           !== undefined && { unit: unit?.trim() ?? null            }),
      ...(category       !== undefined && { category                              }),
      ...(brand          !== undefined && { brand: brand?.trim() ?? null          }),
      ...(notes          !== undefined && { notes: notes?.trim() ?? null          }),
      ...(estimatedPrice !== undefined && { estimatedPrice: estimatedPrice ? String(estimatedPrice) : null }),
      ...(actualPrice    !== undefined && { actualPrice: actualPrice ? String(actualPrice) : null }),
      ...(status         !== undefined && { status                                }),
      ...(boughtBy       !== undefined && { boughtBy: boughtBy ?? null            }),
      ...(sortOrder      !== undefined && { sortOrder                             }),
      ...(nowBought  && { boughtAt: new Date() }),
      ...(nowUnbought && { boughtAt: null, boughtBy: null }),
    },
  });

  // Update boughtCount on the list
  if (nowBought || nowUnbought) {
    await prismadb.shoppingList.update({
      where: { id: listId},
      data: {
        boughtCount:   nowBought ? { increment: 1 } : { decrement: 1 },
        lastActivityAt: new Date(),
        // Auto-complete if all items bought
        completedAt:   nowBought ? undefined : null,
      },
    });
  } else {
    await prismadb.shoppingList.update({
      where: { id: listId },
      data:  { lastActivityAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { listId, itemId } = await params;

  const item = await prismadb.listItem.findFirst({
    where: { id: itemId, listId: listId },
    select: { id: true, status: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  await prismadb.listItem.delete({ where: { id: itemId } });

  await prismadb.shoppingList.update({
    where: { id: listId },
    data:  {
      itemCount:  { decrement: 1 },
      boughtCount: item.status === "BOUGHT" ? { decrement: 1 } : undefined,
      lastActivityAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}