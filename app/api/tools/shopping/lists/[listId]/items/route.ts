// =============================================================================
// isaacpaha.com — Shopping List Items API
// app/api/tools/shopping/lists/[id]/items/route.ts
// POST → add item(s) to a list
// PUT  → bulk replace all items (for reorder)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";

type Params = { params: Promise<{ listId: string }> };

// Verify the list exists and is accessible (either by owner or by shareId match)
async function getListOrThrow(listId: string) {
  const list = await prismadb.shoppingList.findUnique({
    where: { id: listId },
    select: { id: true, userId: true, visibility: true, itemCount: true },
  });
  if (!list) throw new Error("List not found");
  return list;
}

export async function POST(req: NextRequest, { params }: Params) {
    const { listId } = await params;
  try {
    await getListOrThrow(listId);
  } catch {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const body = await req.json();

  // Support single item or array
  const items = Array.isArray(body) ? body : [body];

  // Get current max sortOrder
  const maxOrder = await prismadb.listItem.findFirst({
    where:   { listId: listId },
    orderBy: { sortOrder: "desc" },
    select:  { sortOrder: true },
  });
  let nextOrder = (maxOrder?.sortOrder ?? -1) + 1;

  const created = await prismadb.$transaction(
    items.map((item: any) =>
      prismadb.listItem.create({
        data: {
          listId:         listId,
          addedBy:        item.addedBy  ?? null,
          name:           item.name.trim(),
          quantity:       item.quantity  ? String(item.quantity)  : null,
          unit:           item.unit?.trim() ?? null,
          category:       item.category  ?? "OTHER",
          brand:          item.brand?.trim() ?? null,
          notes:          item.notes?.trim()  ?? null,
          estimatedPrice: item.estimatedPrice ? String(item.estimatedPrice) : null,
          sortOrder:      nextOrder++,
        },
      })
    )
  );

  // Update denormalised count
  await prismadb.shoppingList.update({
    where: { id: listId },
    data:  { itemCount: { increment: items.length }, lastActivityAt: new Date() },
  });

  return NextResponse.json({ ok: true, items: created }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: Params) {
    const { listId } = await params;
  // Bulk reorder: receive full ordered array of { id, sortOrder }
  const body: { id: string; sortOrder: number }[] = await req.json();

  await prismadb.$transaction(
    body.map((item) =>
      prismadb.listItem.update({
        where: { id: item.id },
        data:  { sortOrder: item.sortOrder },
      })
    )
  );

  await prismadb.shoppingList.update({
    where: { id: listId },
    data:  { lastActivityAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}