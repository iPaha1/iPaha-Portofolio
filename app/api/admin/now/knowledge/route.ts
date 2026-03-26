// =============================================================================
// isaacpaha.com — Knowledge Items API
// app/api/admin/now/knowledge/route.ts
// GET  → all items (with optional ?type= filter)
// POST → create new item
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  getKnowledgeItems,
  createKnowledgeItem,
} from "@/lib/actions/now-actions";
import type { KnowledgeType } from "@/lib/generated/prisma/enums";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp     = new URL(req.url).searchParams;
  const items  = await getKnowledgeItems({
    type:          (sp.get("type") as KnowledgeType) || undefined,
    search:        sp.get("search")                  || undefined,
    isRecommended: sp.has("recommended") ? sp.get("recommended") === "true" : undefined,
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.title?.trim() || !body.type) {
    return NextResponse.json(
      { error: "title and type are required" },
      { status: 400 }
    );
  }

  const item = await createKnowledgeItem({
    title:         body.title.trim(),
    author:        body.author        || undefined,
    type:          body.type          as KnowledgeType,
    url:           body.url           || undefined,
    imageUrl:      body.imageUrl      || undefined,
    description:   body.description   || undefined,
    notes:         body.notes         || undefined,
    rating:        body.rating        != null ? Number(body.rating) : undefined,
    isRecommended: body.isRecommended ?? false,
    isFeatured:    body.isFeatured    ?? false,
    finishedAt:    body.finishedAt    ? new Date(body.finishedAt) : undefined,
    startedAt:     body.startedAt     ? new Date(body.startedAt)  : undefined,
    tags:          Array.isArray(body.tags) ? body.tags : undefined,
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}