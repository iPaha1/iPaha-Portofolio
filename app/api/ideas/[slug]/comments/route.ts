// =============================================================================
// isaacpaha.com — Idea Comments API
// app/api/ideas/[slug]/comments/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

// GET — fetch approved top-level comments with their approved replies
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const idea = await prismadb.idea.findFirst({
    where:  { slug, isPublished: true },
    select: { id: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prismadb.ideaComment.findMany({
    where: {
      ideaId:    idea.id,
      parentId:  null,
      status:    "APPROVED",
      deletedAt: null,
    },
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

// POST — submit a new comment (PENDING, awaiting moderation)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const idea = await prismadb.idea.findFirst({
    where:  { slug, isPublished: true },
    select: { id: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { authorName, authorEmail, authorUrl, content, parentId } = body;

  if (!authorName?.trim())  return NextResponse.json({ error: "Name is required" },    { status: 400 });
  if (!authorEmail?.trim()) return NextResponse.json({ error: "Email is required" },   { status: 400 });
  if (!content?.trim())     return NextResponse.json({ error: "Content is required" }, { status: 400 });
  if (content.trim().length > 1000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  // If replying, verify parent belongs to this idea
  if (parentId) {
    const parent = await prismadb.ideaComment.findFirst({
      where:  { id: parentId, ideaId: idea.id, deletedAt: null },
      select: { id: true },
    });
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  // Create comment + increment counter atomically
  const [comment] = await prismadb.$transaction([
    prismadb.ideaComment.create({
      data: {
        ideaId:      idea.id,
        authorName:  authorName.trim(),
        authorEmail: authorEmail.trim().toLowerCase(),
        authorUrl:   authorUrl?.trim() || null,
        content:     content.trim(),
        parentId:    parentId || null,
        status:      "PENDING",
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
    }),
    prismadb.idea.update({
      where: { id: idea.id },
      data:  { commentCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}