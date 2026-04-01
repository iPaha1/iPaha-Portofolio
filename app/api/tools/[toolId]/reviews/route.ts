// =============================================================================
// isaacpaha.com — Tool Reviews API
// app/api/tools/[toolId]/reviews/route.ts
//
// GET  /api/tools/[toolId]/reviews  — fetch paginated reviews for a tool
// POST /api/tools/[toolId]/reviews  — submit a review (auth required)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET — fetch reviews ──────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId }  = await params;
    const sp          = new URL(req.url).searchParams;
    const page        = Math.max(1, Number(sp.get("page")    ?? 1));
    const pageSize    = Math.min(50, Number(sp.get("pageSize") ?? 10));

    const [reviews, total] = await Promise.all([
      prismadb.toolReview.findMany({
        where:   { toolId },
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          user: {
            select: {
              id:          true,
              displayName: true,
              firstName:   true,
              lastName:    true,
              avatarUrl:   true,
            },
          },
        },
      }),
      prismadb.toolReview.count({ where: { toolId } }),
    ]);

    // Also return current aggregate so client can update the header stats
    const agg = await prismadb.toolReview.aggregate({
      where:   { toolId },
      _avg:    { rating: true },
      _count:  { _all: true },
    });

    return NextResponse.json({
      reviews,
      total,
      pages:      Math.ceil(total / pageSize),
      ratingAvg:  agg._avg.rating   ?? 0,
      ratingCount: agg._count._all,
    });
  } catch (err) {
    console.error("[tool-reviews GET]", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// ─── POST — submit a review ───────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;

    // Auth required
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
    }

    // Find our internal user
    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate tool exists
    const tool = await prismadb.tool.findUnique({
      where:  { id: toolId },
      select: { id: true },
    });
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // Parse + validate body
    const body    = await req.json();
    const rating  = Number(body.rating);
    const comment = (body.comment as string | undefined)?.trim() ?? null;

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

    // One review per user per tool — upsert
    const review = await prismadb.toolReview.upsert({
      where: {
        // Requires @@unique([toolId, userId]) on ToolReview model — see schema note below
        toolId_userId: { toolId, userId: user.id },
      },
      update: {
        rating,
        comment,
      },
      create: {
        toolId,
        userId: user.id,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id:          true,
            displayName: true,
            firstName:   true,
            lastName:    true,
            avatarUrl:   true,
          },
        },
      },
    });

    // Recompute + update aggregate on Tool
    const agg = await prismadb.toolReview.aggregate({
      where:  { toolId },
      _avg:   { rating: true },
      _count: { _all: true },
    });

    await prismadb.tool.update({
      where: { id: toolId },
      data:  {
        ratingAvg:   agg._avg.rating   ?? 0,
        ratingCount: agg._count._all,
      },
    });

    return NextResponse.json({ ok: true, review });
  } catch (err: unknown) {
    console.error("[tool-reviews POST]", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

// =============================================================================
// SCHEMA NOTE:
// Add this to your ToolReview model in schema.prisma if not already present:
//
//   @@unique([toolId, userId])
//
// Then run: npx prisma migrate dev --name add_tool_review_unique_constraint
// =============================================================================