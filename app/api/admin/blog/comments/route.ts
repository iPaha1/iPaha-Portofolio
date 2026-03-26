// =============================================================================
// isaacpaha.com — Blog Comments API
// app/api/admin/blog/comments/route.ts
// GET → paginated list + stats
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { getComments }               from "@/lib/actions/blog-actions";
import type { CommentStatus }        from "@/lib/generated/prisma/enums";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const [result, pending, approved, spam, rejected] = await Promise.all([
    getComments({
      status:   (sp.get("status") as CommentStatus) || undefined,
      postId:   sp.get("postId") || undefined,
      page:     Number(sp.get("page")     ?? 1),
      pageSize: Number(sp.get("pageSize") ?? 30),
    }),
    prismadb.blogComment.count({ where: { status: "PENDING",  deletedAt: null } }),
    prismadb.blogComment.count({ where: { status: "APPROVED", deletedAt: null } }),
    prismadb.blogComment.count({ where: { status: "SPAM",     deletedAt: null } }),
    prismadb.blogComment.count({ where: { status: "REJECTED", deletedAt: null } }),
  ]);
  return NextResponse.json({ ...result, stats: { pending, approved, spam, rejected } });
}