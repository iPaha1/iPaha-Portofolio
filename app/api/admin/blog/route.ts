// =============================================================================
// isaacpaha.com — Blog List API
// app/api/admin/blog/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import type { BlogStatus } from "@/lib/generated/prisma/enums";
import { getBlogPosts, createBlogPost, bulkSoftDelete, generateUniqueBlogSlug } from  "@/lib/actions/blog-actions";

async function requireAdmin(): Promise<{ ok: boolean; clerkId?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false };
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true, id: true } });
  return user?.role === "ADMIN" ? { ok: true, clerkId: userId } : { ok: false };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const result = await getBlogPosts({
    page:       Number(sp.get("page")     ?? 1),
    pageSize:   Number(sp.get("pageSize") ?? 20),
    status:     (sp.get("status")     as BlogStatus) || undefined,
    categoryId: sp.get("categoryId")                 || undefined,
    search:     sp.get("search")                     || undefined,
    sortBy:     (sp.get("sortBy")    as "createdAt" | "updatedAt" | "title" | "publishedAt" | "viewCount" | "likeCount" | "trendingScore") ?? "updatedAt",
    sortOrder:  (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const slug = body.slug?.trim() || await generateUniqueBlogSlug(body.title);
  // Get user info for author fields
  const user = await prismadb.user.findUnique({ where: { clerkId: auth.clerkId }, select: { id: true, displayName: true, avatarUrl: true } });
  const post = await createBlogPost({
    ...body, slug,
    authorId:    user?.id    ?? "system",
    authorName:  user?.displayName ?? "Isaac Paha",
    authorImage: user?.avatarUrl ?? null,
  });
  return NextResponse.json({ ok: true, post }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  await bulkSoftDelete(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}