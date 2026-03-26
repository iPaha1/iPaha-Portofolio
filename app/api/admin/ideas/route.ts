// =============================================================================
// isaacpaha.com — Ideas List API
// app/api/admin/ideas/route.ts
// GET    → paginated list
// POST   → create idea
// DELETE → bulk delete { ids[] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import {
  getIdeas, createIdea, bulkDeleteIdeas, generateUniqueSlug,
} from "@/lib/actions/ideas-actions";
import { IdeaCategory, IdeaStatus } from "@/lib/generated/prisma/enums";
import { prismadb } from "@/lib/db";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const result = await getIdeas({
    page:        Number(sp.get("page")     ?? 1),
    pageSize:    Number(sp.get("pageSize") ?? 20),
    category:    (sp.get("category") as IdeaCategory) || undefined,
    status:      (sp.get("status")   as IdeaStatus)   || undefined,
    search:      sp.get("search")                      || undefined,
    isPublished: sp.has("published") ? sp.get("published") === "true" : undefined,
    sortBy:      (["title", "viewCount", "likeCount", "createdAt", "updatedAt"].includes(sp.get("sortBy") ?? "")
                  ? sp.get("sortBy")
                  : "createdAt") as "title" | "viewCount" | "likeCount" | "createdAt" | "updatedAt",
    sortOrder:   (sp.get("sortOrder") === "asc" ? "asc" : "desc") as "asc" | "desc",
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim() || !body.summary?.trim()) {
    return NextResponse.json({ error: "Title and summary are required" }, { status: 400 });
  }

  const slug = body.slug?.trim() || await generateUniqueSlug(body.title);
  const idea = await createIdea({
    title:           body.title.trim(),
    slug,
    summary:         body.summary.trim(),
    content:         body.content?.trim() ?? "",
    category:        body.category        ?? "TECH",
    status:          body.status          ?? "CONCEPT",
    tags:            body.tags            ?? [],
    coverImage:      body.coverImage,
    isPublished:     body.isPublished     ?? false,
    isFeatured:      body.isFeatured      ?? false,
    metaTitle:       body.metaTitle,
    metaDescription: body.metaDescription,
  });
  return NextResponse.json({ ok: true, idea }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await bulkDeleteIdeas(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}