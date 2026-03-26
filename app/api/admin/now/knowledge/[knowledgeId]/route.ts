// =============================================================================
// isaacpaha.com — Single Knowledge Item API
// app/api/admin/now/knowledge/[knowledgeId]/route.ts
// PATCH  → update item fields
// DELETE → delete item
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  updateKnowledgeItem,
  deleteKnowledgeItem,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ knowledgeId: string }> } 
) {

    const { knowledgeId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updated = await updateKnowledgeItem(knowledgeId, {
    title:         body.title?.trim(),
    author:        body.author,
    type:          body.type        as KnowledgeType | undefined,
    url:           body.url,
    imageUrl:      body.imageUrl,
    description:   body.description,
    notes:         body.notes,
    rating:        body.rating      !== undefined ? (body.rating != null ? Number(body.rating) : null) : undefined,
    isRecommended: body.isRecommended,
    isFeatured:    body.isFeatured,
    finishedAt:    body.finishedAt  !== undefined ? (body.finishedAt ? new Date(body.finishedAt) : null) : undefined,
    startedAt:     body.startedAt   !== undefined ? (body.startedAt  ? new Date(body.startedAt)  : null) : undefined,
    tags:          Array.isArray(body.tags) ? body.tags : undefined,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ knowledgeId: string }> } 
) {

    const { knowledgeId } = await params; 

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteKnowledgeItem(knowledgeId);
  return NextResponse.json({ ok: true });
}