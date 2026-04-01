// =============================================================================
// isaacpaha.com — Smart Shopping List API
// app/api/tools/shopping/lists/route.ts
// GET  → user's lists (paginated)
// POST → create a new list
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

function uid6(): string {
  // Generates a short human-friendly share ID
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    // Anonymous users can't list — they access via shareId only
    if (!clerkId) {
      return NextResponse.json({ lists: [], pagination: { total: 0, limit: 0, offset: 0 } });
    }

    const user = await prismadb.user.findUnique({ 
      where: { clerkId }, 
      select: { id: true } 
    });
    
    if (!user) {
      return NextResponse.json({ lists: [], pagination: { total: 0, limit: 0, offset: 0 } });
    }

    const sp = new URL(req.url).searchParams;
    const archived = sp.get("archived") === "true";
    const isTemplate = sp.get("isTemplate");
    const limit = parseInt(sp.get("limit") || "50");
    const offset = parseInt(sp.get("offset") || "0");
    
    // Build where clause
    const where: any = { 
      userId: user.id, 
      isArchived: archived 
    };
    
    if (isTemplate !== null) {
      where.isTemplate = isTemplate === "true";
    }

    const [lists, total] = await Promise.all([
      prismadb.shoppingList.findMany({
        where,
        orderBy: { lastActivityAt: "desc" },
        skip: offset,
        take: Math.min(limit, 100),
        include: {
          items: { 
            orderBy: { sortOrder: "asc" }, 
            select: { 
              id: true, 
              name: true, 
              status: true, 
              category: true, 
              estimatedPrice: true, 
              quantity: true, 
              unit: true, 
              notes: true, 
              brand: true, 
              boughtAt: true, 
              boughtBy: true, 
              sortOrder: true 
            } 
          },
          collaborators: { 
            select: { 
              role: true, 
              joinedAt: true, 
              user: { 
                select: { id: true, displayName: true, avatarUrl: true } 
              } 
            } 
          },
          _count: { select: { items: true } },
        },
      }),
      prismadb.shoppingList.count({ where })
    ]);

    return NextResponse.json({ 
      lists,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + lists.length < total
      }
    });
  } catch (err: any) {
    console.error("[shopping/lists] GET error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch lists" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    const body = await req.json();
    const { 
      name, 
      emoji = "🛒", 
      description, 
      storeName, 
      budgetAmount, 
      currency = "GBP", 
      isTemplate = false 
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "List name required" }, { status: 400 });
    }

    let userId: string | null = null;
    if (clerkId) {
      const user = await prismadb.user.findUnique({ 
        where: { clerkId }, 
        select: { id: true } 
      });
      userId = user?.id ?? null;
    }

    // Generate a friendly share ID — retry on collision
    let shareId = uid6();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prismadb.shoppingList.findUnique({ 
        where: { shareId }, 
        select: { id: true } 
      });
      if (!existing) break;
      shareId = uid6();
      attempts++;
    }

    const list = await prismadb.shoppingList.create({
      data: {
        userId,
        name: name.trim(),
        emoji,
        description: description?.trim() ?? null,
        storeName: storeName?.trim() ?? null,
        shareId,
        visibility: "SHARED", // default to shared so the link works immediately
        budgetEnabled: !!budgetAmount,
        budgetAmount: budgetAmount ? String(budgetAmount) : null,
        currency,
        isTemplate,
        itemCount: 0,
        boughtCount: 0,
      },
      include: {
        items: true,
      },
    });

    console.log(`[shopping/lists] Created list ${list.id} for user ${userId || "anonymous"}`);
    
    return NextResponse.json({ ok: true, list }, { status: 201 });
  } catch (err: any) {
    console.error("[shopping/lists] POST error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create list" },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // isaacpaha.com — Smart Shopping List API
// // app/api/tools/shopping/lists/route.ts
// // GET  → user's lists (paginated)
// // POST → create a new list
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { auth }                      from "@clerk/nextjs/server";
// import { prismadb }                  from "@/lib/db";

// function uid6(): string {
//   // Generates a short human-friendly share ID
//   return Math.random().toString(36).slice(2, 8).toUpperCase();
// }

// export async function GET(req: NextRequest) {
//   const { userId: clerkId } = await auth();

//   // Anonymous users can't list — they access via shareId only
//   if (!clerkId) return NextResponse.json({ lists: [] });

//   const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
//   if (!user) return NextResponse.json({ lists: [] });

//   const sp         = new URL(req.url).searchParams;
//   const archived   = sp.get("archived") === "true";
//   // Return both regular lists AND user-saved templates in one response.
//   // The client splits them by isTemplate. Avoids a second round-trip.

//   const lists = await prismadb.shoppingList.findMany({
//     where:   { userId: user.id, isArchived: archived },
//     orderBy: { lastActivityAt: "desc" },
//     include: {
//       items:         { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, status: true, category: true, estimatedPrice: true, quantity: true, unit: true, notes: true, brand: true, boughtAt: true, boughtBy: true, sortOrder: true } },
//       collaborators: { select: { role: true, joinedAt: true, user: { select: { id: true, displayName: true, avatarUrl: true } } } },
//       _count:        { select: { items: true } },
//     },
//   });

//   return NextResponse.json({ lists });
// }

// export async function POST(req: NextRequest) {
//   const { userId: clerkId } = await auth();

//   const body = await req.json();
//   const { name, emoji = "🛒", description, storeName, budgetAmount, currency = "GBP", isTemplate = false } = body;

//   if (!name?.trim()) return NextResponse.json({ error: "List name required" }, { status: 400 });

//   let userId: string | null = null;
//   if (clerkId) {
//     const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
//     userId = user?.id ?? null;
//   }

//   // Generate a friendly share ID — retry on collision
//   let shareId = uid6();
//   let attempts = 0;
//   while (attempts < 5) {
//     const existing = await prismadb.shoppingList.findUnique({ where: { shareId }, select: { id: true } });
//     if (!existing) break;
//     shareId = uid6();
//     attempts++;
//   }

//   const list = await prismadb.shoppingList.create({
//     data: {
//       userId,
//       name:         name.trim(),
//       emoji,
//       description:  description?.trim() ?? null,
//       storeName:    storeName?.trim()    ?? null,
//       shareId,
//       visibility:   "SHARED",    // default to shared so the link works immediately
//       budgetEnabled: !!budgetAmount,
//       budgetAmount:  budgetAmount ? String(budgetAmount) : null,
//       currency,
//       isTemplate,
//     },
//     include: {
//       items: true,
//     },
//   });

//   return NextResponse.json({ ok: true, list }, { status: 201 });
// }


