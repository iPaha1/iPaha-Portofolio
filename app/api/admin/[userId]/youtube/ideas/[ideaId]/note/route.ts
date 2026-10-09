// app/api/admin/[userId]/youtube/ideas/[ideaId]/note/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getOrCreateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; ideaId: string }> }
) {
  try {
    const { userId, ideaId } = await params;

    // ── Auth ───────────────────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Get profile and verify ownership ───────────────────────────────────
    const profile = await getOrCreateProfile(user.id);

    // Verify the idea belongs to this profile
    const idea = await prismadb.youtubeContentIdea.findFirst({
      where: {
        id: ideaId,
        profileId: profile.id,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // ── Update note ────────────────────────────────────────────────────────
    const body = await req.json();
    const { userNotes } = body;

    const updatedIdea = await prismadb.youtubeContentIdea.update({
      where: { id: ideaId },
      data: { userNotes: userNotes || null },
    });

    return NextResponse.json({
      data: {
        id: updatedIdea.id,
        userNotes: updatedIdea.userNotes,
      },
      message: "Note saved successfully",
    });

  } catch (error) {
    console.error("[youtube/ideas/note PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; ideaId: string }> }
) {
  try {
    const { userId, ideaId } = await params;

    // ── Auth ───────────────────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Get profile and fetch note ─────────────────────────────────────────
    const profile = await getOrCreateProfile(user.id);

    const idea = await prismadb.youtubeContentIdea.findFirst({
      where: {
        id: ideaId,
        profileId: profile.id,
      },
      select: {
        id: true,
        userNotes: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: idea.id,
        userNotes: idea.userNotes,
      },
    });

  } catch (error) {
    console.error("[youtube/ideas/note GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}