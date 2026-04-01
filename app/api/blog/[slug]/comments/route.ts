// =============================================================================
// isaacpaha.com — Comments API
// app/api/blog/[slug]/comments/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

// GET — fetch approved top-level comments with their approved replies
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prismadb.blogPost.findFirst({
    where:  { slug, isPublished: true, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prismadb.blogComment.findMany({
    where: {
      postId:   post.id,
      parentId: null,           // top-level only
      status:   "APPROVED",
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id:          true,
      authorName:  true,
      authorUrl:   true,
      avatarUrl:   true,
      content:     true,
      likeCount:   true,
      createdAt:   true,
      isEdited:    true,
      replies: {
        where:   { status: "APPROVED", deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id:         true,
          authorName: true,
          authorUrl:  true,
          avatarUrl:  true,
          content:    true,
          likeCount:  true,
          createdAt:  true,
          isEdited:   true,
        },
      },
    },
  });

  return NextResponse.json({ comments });
}

// POST — submit a new comment (goes to PENDING, no auth required for public comments)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prismadb.blogPost.findFirst({
    where:  { slug, isPublished: true, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { authorName, authorEmail, authorUrl, content, parentId } = body;

  if (!authorName?.trim())  return NextResponse.json({ error: "Name is required" },    { status: 400 });
  if (!authorEmail?.trim()) return NextResponse.json({ error: "Email is required" },   { status: 400 });
  if (!content?.trim())     return NextResponse.json({ error: "Content is required" }, { status: 400 });
  if (content.trim().length > 2000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  // If parentId provided, verify it belongs to this post
  if (parentId) {
    const parent = await prismadb.blogComment.findFirst({
      where: { id: parentId, postId: post.id, deletedAt: null },
      select: { id: true },
    });
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const comment = await prismadb.blogComment.create({
    data: {
      postId:      post.id,
      authorName:  authorName.trim(),
      authorEmail: authorEmail.trim().toLowerCase(),
      authorUrl:   authorUrl?.trim() || null,
      content:     content.trim(),
      parentId:    parentId || null,
      status:      "PENDING",              // requires moderation
      ipAddress:   ip,
      userAgent:   req.headers.get("user-agent") ?? undefined,
    },
    select: {
      id:         true,
      authorName: true,
      content:    true,
      status:     true,
      createdAt:  true,
    },
  });

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}