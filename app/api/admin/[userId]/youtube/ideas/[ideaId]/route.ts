// =============================================================================
// API: /api/admin/[userId]/youtube/ideas/[ideaId]
// PATCH  — update an idea (toggle saved, add notes, mark used, etc.)
// DELETE — permanently delete an idea
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; ideaId: string }> }
) {
  try {
    const { ideaId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = await req.json();

    // Serialise themes array back to JSON string if provided
    const data = {
      ...body,
      ...(Array.isArray(body.themes) && { themes: JSON.stringify(body.themes) }),
    };

    const updated = await prismadb.youtubeContentIdea.update({
      where: { id: ideaId },
      data,
    });

    return NextResponse.json({ data: updated });

  } catch (error) {
    console.error("[youtube/ideas/[ideaId] PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; ideaId: string }> }
) {
  try {
    const { ideaId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    await prismadb.youtubeContentIdea.delete({ where: { id: ideaId } });

    return NextResponse.json({ message: "Idea deleted" });

  } catch (error) {
    console.error("[youtube/ideas/[ideaId] DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}