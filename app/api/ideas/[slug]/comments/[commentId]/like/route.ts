// =============================================================================
// isaacpaha.com — Idea Comment Like API
// app/api/ideas/[slug]/comments/[commentId]/like/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const { commentId } = await params;

  const comment = await prismadb.ideaComment.findFirst({
    where:  { id: commentId, status: "APPROVED", deletedAt: null },
    select: { id: true, likeCount: true },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const updated = await prismadb.ideaComment.update({
    where: { id: commentId },
    data:  { likeCount: { increment: 1 } },
    select: { likeCount: true },
  });

  return NextResponse.json({ ok: true, likeCount: updated.likeCount });
}