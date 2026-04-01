// app/api/blog/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";

export async function GET() {
  try {
    const [totalPosts, totalViews, editorPickCount, featuredPost] = await Promise.all([
      prismadb.blogPost.count({
        where: { status: "PUBLISHED", deletedAt: null }
      }),
      prismadb.blogPost.aggregate({
        where: { status: "PUBLISHED", deletedAt: null },
        _sum: { viewCount: true }
      }),
      prismadb.blogPost.count({
        where: { isEditorPick: true, status: "PUBLISHED", deletedAt: null }
      }),
      prismadb.blogPost.findFirst({
        where: { isFeatured: true, status: "PUBLISHED", deletedAt: null },
        orderBy: { featuredAt: "desc" },
        include: { category: true } // adjust includes as needed for DBPostFull
      })
    ]);

    return NextResponse.json({
      totalPosts,
      totalViews: totalViews._sum.viewCount ?? 0,
      editorPickCount,
      featuredPost: featuredPost ?? null,
    });
  } catch (error) {
    console.error("Blog stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}