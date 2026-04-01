// app/api/blog/sidebar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getBlogPosts } from "@/lib/actions/blog-actions";

export async function GET() {
  try {
    const [trendingRes, editorsPicksRes] = await Promise.all([
      getBlogPosts({
        page: 1,
        pageSize: 6,
        sortBy: "trendingScore",
        sortOrder: "desc",
        status: "PUBLISHED"
      }),
      getBlogPosts({
        page: 1,
        pageSize: 6,
        sortBy: "publishedAt", // or custom logic for editor picks
        sortOrder: "desc",
        status: "PUBLISHED",
        // You can filter isEditorPick inside getBlogPosts if you extend it
      })
    ]);

    // For editorsPicks you might want to filter by isEditorPick: true
    const editorsPicks = await getBlogPosts({
      page: 1,
      pageSize: 6,
      sortBy: "publishedAt",
      sortOrder: "desc",
      status: "PUBLISHED",
      // Add custom filter if your getBlogPosts supports isEditorPick
    });

    return NextResponse.json({
      trending: trendingRes.posts ?? [],
      editorsPicks: editorsPicks.posts ?? [], // or use the filtered one
    });
  } catch (error) {
    console.error("Blog sidebar error:", error);
    return NextResponse.json({ trending: [], editorsPicks: [] });
  }
}