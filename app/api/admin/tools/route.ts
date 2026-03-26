// =============================================================================
// isaacpaha.com — Tools List API
// app/api/admin/tools/route.ts
// GET    → paginated list
// POST   → create tool
// DELETE → bulk delete { ids[] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import {
  getTools, createTool, bulkDeleteTools, generateUniqueToolSlug,
} from "@/lib/actions/tools-actions";
import { ToolStatus } from "@/lib/generated/prisma/enums";



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
  const result = await getTools({
    page:          Number(sp.get("page")     ?? 1),
    pageSize:      Number(sp.get("pageSize") ?? 20),
    category:      sp.get("category")    || undefined,
    status:        (sp.get("status") as ToolStatus) || undefined,
    search:        sp.get("search")      || undefined,
    isFeatured:    sp.has("featured")    ? sp.get("featured")    === "true" : undefined,
    isInteractive: sp.has("interactive") ? sp.get("interactive") === "true" : undefined,
    isPremium:     sp.has("premium")     ? sp.get("premium")     === "true" : undefined,
    sortBy:        (sp.get("sortBy") as "createdAt" | "updatedAt" | "viewCount" | "usageCount" | "title" | "rating") ?? "createdAt",
    sortOrder:     (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim() || !body.tagline?.trim()) {
    return NextResponse.json({ error: "Title and tagline are required" }, { status: 400 });
  }

  const slug = body.slug?.trim() || await generateUniqueToolSlug(body.title);
  const tool = await createTool({
    title:         body.title.trim(),
    slug,
    tagLine:       body.tagline.trim(),
    description:   body.description?.trim() ?? "",
    category:      body.category      ?? "AI",
    status:        body.status         ?? "COMING_SOON",
    emoji:         body.emoji          ?? "🔧",
    tags:          body.tags           ?? [],
    coverImage:    body.coverImage,
    isFeatured:    body.isFeatured     ?? false,
    isPremium:     body.isPremium      ?? false,
    isInteractive: body.isInteractive  ?? false,
    componentKey:  body.componentKey,
  });
  return NextResponse.json({ ok: true, tool }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await bulkDeleteTools(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}