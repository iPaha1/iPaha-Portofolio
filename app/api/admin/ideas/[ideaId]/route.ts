// =============================================================================
// isaacpaha.com — Single Idea API
// app/api/admin/ideas/[id]/route.ts
// GET    → single idea (full content)
// PATCH  → update fields  |  _action: togglePublish | toggleFeatured | duplicate
// DELETE → delete single
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import {
  getIdeaById, updateIdea, deleteIdea,
  togglePublish, toggleFeatured, duplicateIdea,
} from "@/lib/actions/ideas-actions";
import { prismadb } from "@/lib/db";


async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {

    const { ideaId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const idea = await getIdeaById(ideaId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {

    const { ideaId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body._action === "togglePublish")  return NextResponse.json(await togglePublish(ideaId));
  if (body._action === "toggleFeatured") return NextResponse.json(await toggleFeatured(ideaId));
  if (body._action === "duplicate")      return NextResponse.json(await duplicateIdea(ideaId));

  const updated = await updateIdea(ideaId, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {

    const { ideaId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteIdea(ideaId);
  return NextResponse.json({ ok: true });
}