// =============================================================================
// isaacpaha.com — Public Single Blog Post API
// app/api/blog/[slug]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import type { DBPostFull } from "@/lib/types/blog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Fetch the post with all necessary relations
    const post = await prismadb.blogPost.findUnique({
      where: {
        slug,
        deletedAt: null,
        status: "PUBLISHED",           // Only published posts for public
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        comments: {
          where: { status: "APPROVED", deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            replies: {
              where: { status: "APPROVED", deletedAt: null },
              orderBy: { createdAt: "asc" },
              take: 5,
            },
          },
        },
        reactions: true,
        seoAudit: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget – don't block response)
    prismadb.blogPost.update({
      where: { id: post.id },
      data: {
        viewCount: { increment: 1 },
        uniqueViewCount: { increment: 1 },
        trendingScore: {
          set: calculateTrendingScore(post),
        },
      },
    }).catch(console.error); // prevent error from affecting response

    // Build reaction counts from reactions array (since Prisma doesn't support groupBy include easily)
    const reactionCounts = post.reactions.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transform to match DBPostFull type
    const transformedPost: DBPostFull = {
      ...post,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      updatedAt: post.updatedAt.toISOString(),
      tags: post.tags, // keep as JSON string (your parseTags helper will handle it)
      reactionCounts,
      // Prisma already includes the selected category & series
    };

    return NextResponse.json({
      post: transformedPost,
      success: true,
    });

  } catch (error) {
    console.error("Single blog post API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// Helper function for trending score
function calculateTrendingScore(post: any): number {
  const hoursSincePublished = post.publishedAt
    ? (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60)
    : 24; // default to 1 day if not published yet

  const score =
    (post.likeCount * 3 +
     post.commentCount * 5 +
     post.viewCount * 1) / Math.max(hoursSincePublished, 1);

  return Math.round(score * 100) / 100;
}