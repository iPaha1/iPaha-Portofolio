// =============================================================================
// isaacpaha.com — Post Reactions API
// app/api/blog/[slug]/reactions/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import type { ReactionType } from "@/lib/generated/prisma/enums";

const VALID_TYPES: ReactionType[] = ["FIRE", "BULB", "THINK", "CLAP", "LOVE"];

// GET — reaction counts for a post
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

  const rows = await prismadb.blogReaction.groupBy({
    by:    ["type"],
    where: { postId: post.id },
    _count: { type: true },
  });

  const counts = Object.fromEntries(
    VALID_TYPES.map((t) => [t, rows.find((r) => r.type === t)?._count.type ?? 0])
  );

  return NextResponse.json({ counts });
}

// POST — toggle a reaction (IP-based for anonymous users)
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
  const { type } = body as { type: ReactionType };

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check if reaction already exists for this IP
  const existing = await prismadb.blogReaction.findFirst({
    where: { postId: post.id, ipAddress: ip, type },
  });

  if (existing) {
    // Toggle off
    await prismadb.blogReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, active: false });
  } else {
    // Toggle on — upsert to handle race conditions
    await prismadb.blogReaction.create({
      data: { postId: post.id, ipAddress: ip, type },
    });
    return NextResponse.json({ ok: true, active: true });
  }
}