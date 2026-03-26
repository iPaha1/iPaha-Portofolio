// =============================================================================
// isaacpaha.com — Single Shopping List API
// app/api/tools/shopping/lists/[id]/route.ts
// GET    → get list with all items
// PATCH  → update list metadata
// DELETE → delete list
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

type Params = { params: Promise<{ listId: string }> };

const listWithItems = (id: string) =>
  prismadb.shoppingList.findUnique({
    where:   { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      collaborators: {
        select: {
          role: true, joinedAt: true,
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

export async function GET(_req: NextRequest, { params }: Params) {
    const { listId } = await params;
    
  const list = await listWithItems(listId);
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
  return NextResponse.json({ list });
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const { listId } = await params;
    
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const list = await prismadb.shoppingList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (list.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name, emoji, description, storeName, storeMode, visibility,
    budgetEnabled, budgetAmount, currency, actualSpend, isArchived, isTemplate,
  } = body;

  const updated = await prismadb.shoppingList.update({
    where: { id: listId },
    data: {
      ...(name         !== undefined && { name: name.trim()             }),
      ...(emoji        !== undefined && { emoji                         }),
      ...(description  !== undefined && { description: description?.trim() ?? null }),
      ...(storeName    !== undefined && { storeName: storeName?.trim()  ?? null }),
      ...(storeMode    !== undefined && { storeMode                     }),
      ...(visibility   !== undefined && { visibility                    }),
      ...(budgetEnabled !== undefined && { budgetEnabled                }),
      ...(budgetAmount !== undefined && { budgetAmount: budgetAmount ? String(budgetAmount) : null }),
      ...(currency     !== undefined && { currency                      }),
      ...(actualSpend  !== undefined && { actualSpend: actualSpend ? String(actualSpend) : null }),
      ...(isArchived   !== undefined && { isArchived                    }),
      ...(isTemplate   !== undefined && { isTemplate                    }),
      lastActivityAt: new Date(),
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ ok: true, list: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { listId } = await params;
    
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const list = await prismadb.shoppingList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list || list.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prismadb.shoppingList.delete({ where: { id: listId } });
  return NextResponse.json({ ok: true });
}