// =============================================================================
// isaacpaha.com — Admin Idea Comments API
// app/api/admin/ideas/comments/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import type { IdeaCommentStatus } from "@/lib/generated/prisma/enums";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

// GET — paginated list of idea comments with stats counts
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp       = new URL(req.url).searchParams;
  const page     = Math.max(1, Number(sp.get("page")     ?? 1));
  const pageSize = Math.min(100, Number(sp.get("pageSize") ?? 30));
  const status   = sp.get("status") as IdeaCommentStatus | null;
  const search   = sp.get("search")?.trim() || undefined;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { authorName:  { contains: search } },
            { authorEmail: { contains: search } },
            { content:     { contains: search } },
            { idea:        { title: { contains: search } } },
          ],
        }
      : {}),
  };

  const [comments, total, statsCounts] = await Promise.all([
    prismadb.ideaComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      select: {
        id:          true,
        ideaId:      true,
        authorName:  true,
        authorEmail: true,
        authorUrl:   true,
        content:     true,
        status:      true,
        isFlagged:   true,
        likeCount:   true,
        parentId:    true,
        createdAt:   true,
        idea: { select: { title: true, slug: true } },  // ← idea relation
      },
    }),

    prismadb.ideaComment.count({ where }),

    // Stat counts per status
    prismadb.ideaComment.groupBy({
      by:    ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),
  ]);

  const stats = {
    pending:  0,
    approved: 0,
    spam:     0,
    rejected: 0,
  };
  for (const row of statsCounts) {
    stats[row.status.toLowerCase() as keyof typeof stats] = row._count.status;
  }

  return NextResponse.json({
    comments,
    total,
    pages: Math.ceil(total / pageSize),
    page,
    stats,
  });
}