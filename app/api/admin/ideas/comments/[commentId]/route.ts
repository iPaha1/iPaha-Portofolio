// =============================================================================
// isaacpaha.com — Admin Idea Comment Single API
// app/api/admin/ideas/comments/[commentId]/route.ts
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

// PATCH — update comment status (APPROVED / REJECTED / SPAM / PENDING)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;
  const body = await req.json();
  const { status } = body as { status: IdeaCommentStatus };

  const VALID: IdeaCommentStatus[] = ["PENDING", "APPROVED", "SPAM", "REJECTED"];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prismadb.ideaComment.update({
    where: { id: commentId },
    data:  {
      status,
      moderatedAt: new Date(),
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}

// DELETE — soft delete a comment
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;

  await prismadb.ideaComment.update({
    where: { id: commentId },
    data:  { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}