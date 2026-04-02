// =============================================================================
// isaacpaha.com — Public Blog List API
// app/api/blog/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getBlogPosts } from "@/lib/actions/blog-actions"; // adjust path if needed
import type { BlogStatus } from "@/lib/generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;

    const result = await getBlogPosts({
      page: Number(sp.get("page") ?? 1),
      pageSize: Number(sp.get("pageSize") ?? 20),
      status: (sp.get("status") as BlogStatus) || "PUBLISHED", // default to published for public
      categoryId: sp.get("categoryId") || undefined,
      search: sp.get("search") || undefined,
      sortBy: (sp.get("sortBy") as 
        "createdAt" | "updatedAt" | "title" | "publishedAt" | "viewCount" | 
        "likeCount" | "trendingScore") ?? "publishedAt",
      sortOrder: (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
    });

    // Optional: support a simple "sort=latest" alias (as used in your fetch)
    const sortParam = sp.get("sort");
    if (sortParam === "latest") {
      // You can override here or handle it inside getBlogPosts
      // For now, assuming getBlogPosts already supports sortBy=publishedAt + desc
    }
    console.log("Blog list API result:", result);
    // console.log("Query params:", {
    //   page: sp.get("page"),
    //   pageSize: sp.get("pageSize"),
    //   status: sp.get("status"),
    //   categoryId: sp.get("categoryId"),
    //   search: sp.get("search"),
    //   sortBy: sp.get("sortBy"),
    //   sortOrder: sp.get("sortOrder"),
    //   sort: sp.get("sort"),
    // });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Blog list API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}