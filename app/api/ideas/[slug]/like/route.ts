// =============================================================================
// isaacpaha.com — Idea Like API
// app/api/ideas/[slug]/like/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

// Uses a simple IP-based Set stored in the likeCount field.
// Since the Idea model has no separate PostLike table, we track likes
// via a lightweight in-memory IP set per deploy. For production persistence,
// add an IdeaLike model to your schema (same pattern as PostLike).
// For now: optimistic likeCount increment/decrement on the Idea row itself,
// with IP tracked in a cookie to prevent double-liking across requests.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const idea = await prismadb.idea.findFirst({
    where:  { slug, isPublished: true },
    select: { id: true, likeCount: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Read liked state from cookie (client-side only — no separate table needed)
  const liked = req.cookies.get(`idea_liked_${idea.id}`)?.value === "1";

  return NextResponse.json({ liked, likeCount: idea.likeCount });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const idea = await prismadb.idea.findFirst({
    where:  { slug, isPublished: true },
    select: { id: true, likeCount: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cookieName = `idea_liked_${idea.id}`;
  const alreadyLiked = req.cookies.get(cookieName)?.value === "1";

  const updated = await prismadb.idea.update({
    where: { id: idea.id },
    data:  {
      likeCount: {
        [alreadyLiked ? "decrement" : "increment"]: 1,
      },
    },
    select: { likeCount: true },
  });

  const liked     = !alreadyLiked;
  const likeCount = Math.max(0, updated.likeCount);

  const res = NextResponse.json({ ok: true, liked, likeCount });

  // Set/clear cookie to track liked state (1 year expiry)
  if (liked) {
    res.cookies.set(cookieName, "1", {
      maxAge:   60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      path:     "/",
    });
  } else {
    res.cookies.delete(cookieName);
  }

  return res;
}