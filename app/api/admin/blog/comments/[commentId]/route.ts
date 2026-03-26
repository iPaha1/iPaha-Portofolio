// =============================================================================
// isaacpaha.com — Single Comment API
// app/api/admin/blog/comments/[commentId]/route.ts
// PATCH → moderate · DELETE → soft delete
// =============================================================================
import { NextRequest, NextResponse }   from "next/server";
import { auth }                        from "@clerk/nextjs/server";
import { prismadb }                    from "@/lib/db";
import { moderateComment, deleteComment } from "@/lib/actions/blog-actions";
import type { CommentStatus }              from "@/lib/generated/prisma/enums";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {

    const { commentId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status } = await req.json();
  const updated = await moderateComment(commentId, status as CommentStatus);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {

    const { commentId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteComment(commentId);
  return NextResponse.json({ ok: true });
}