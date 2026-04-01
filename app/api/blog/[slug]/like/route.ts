// =============================================================================
// isaacpaha.com — Post Like API
// app/api/blog/[slug]/like/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

// POST — toggle a like on a post (IP-based for anonymous users)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prismadb.blogPost.findFirst({
    where:  { slug, isPublished: true, status: "PUBLISHED", deletedAt: null },
    select: { id: true, likeCount: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check if this IP has already liked
  const existing = await prismadb.postLike.findFirst({
    where: { postId: post.id, ipAddress: ip },
  });

  let liked:     boolean;
  let likeCount: number;

  if (existing) {
    // Unlike — remove the record and decrement
    await prismadb.$transaction([
      prismadb.postLike.delete({ where: { id: existing.id } }),
      prismadb.blogPost.update({
        where: { id: post.id },
        data:  { likeCount: { decrement: 1 } },
      }),
    ]);
    liked     = false;
    likeCount = Math.max(0, post.likeCount - 1);
  } else {
    // Like — create record and increment
    await prismadb.$transaction([
      prismadb.postLike.create({
        data: { postId: post.id, ipAddress: ip },
      }),
      prismadb.blogPost.update({
        where: { id: post.id },
        data:  { likeCount: { increment: 1 } },
      }),
    ]);
    liked     = true;
    likeCount = post.likeCount + 1;
  }

  return NextResponse.json({ ok: true, liked, likeCount });
}

// GET — check if current IP has liked this post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prismadb.blogPost.findFirst({
    where:  { slug, isPublished: true, status: "PUBLISHED", deletedAt: null },
    select: { id: true, likeCount: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ip      = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const existing = await prismadb.postLike.findFirst({
    where: { postId: post.id, ipAddress: ip },
  });

  return NextResponse.json({ liked: !!existing, likeCount: post.likeCount });
}