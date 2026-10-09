// =============================================================================
// API: /api/admin/[userId]/youtube/videos/[videoId]
// GET    — get full video with all relations
// PATCH  — update video fields
// DELETE — soft-delete (archive) a video
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getOrCreateProfile, getVideoById, saveVideoRevision, updateVideo } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";


// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; videoId: string }> }
) {
  try {

    const { userId, videoId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isAdmin && user.clerkId !== clerkId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const video = await getVideoById(videoId);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Verify ownership
    const profile = await prismadb.youtubeCreatorProfile.findFirst({
      where: { userId: user.id },
    });
    if (!isAdmin && video.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse arrays
    const serialised = {
      ...video,
      pausePoints: safeJsonParse(video.pausePoints, []),
      emphasisPoints: safeJsonParse(video.emphasisPoints, []),
      tags: safeJsonParse(video.tags, []),
      thumbnailTextIdeas: safeJsonParse(video.thumbnailTextIdeas, []),
      coreConcepts: safeJsonParse(video.coreConcepts, []),
      topicFingerprint: safeJsonParse(video.topicFingerprint, []),
    };

    return NextResponse.json({ data: serialised });
  } catch (error) {
    console.error("[youtube/videos/[id] GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; videoId: string }> }
) {
  try {
    console.log("[youtube/videos/[id] PATCH] Received request");
    const { userId, videoId } = await params;

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

    const profile = await getOrCreateProfile(user.id);
    const body = await req.json();

    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, profileId, ...updateableFields } = body;

    // Prepare update data - stringify JSON fields and handle nulls
    const updateData: any = {};

    // Handle each field explicitly to avoid type issues
    if (updateableFields.title !== undefined) updateData.title = updateableFields.title;
    if (updateableFields.seoTitle !== undefined) updateData.seoTitle = updateableFields.seoTitle;
    if (updateableFields.hook !== undefined) updateData.hook = updateableFields.hook;
    if (updateableFields.intro !== undefined) updateData.intro = updateableFields.intro;
    if (updateableFields.body !== undefined) updateData.body = updateableFields.body;
    if (updateableFields.perspectiveShift !== undefined) updateData.perspectiveShift = updateableFields.perspectiveShift;
    if (updateableFields.closingLine !== undefined) updateData.closingLine = updateableFields.closingLine;
    if (updateableFields.fullScript !== undefined) updateData.fullScript = updateableFields.fullScript;
    if (updateableFields.toneNotes !== undefined) updateData.toneNotes = updateableFields.toneNotes;
    if (updateableFields.facialCues !== undefined) updateData.facialCues = updateableFields.facialCues;
    if (updateableFields.energyArc !== undefined) updateData.energyArc = updateableFields.energyArc;
    if (updateableFields.cameraPosition !== undefined) updateData.cameraPosition = updateableFields.cameraPosition;
    if (updateableFields.lightingSuggestion !== undefined) updateData.lightingSuggestion = updateableFields.lightingSuggestion;
    if (updateableFields.bodyLanguageTips !== undefined) updateData.bodyLanguageTips = updateableFields.bodyLanguageTips;
    if (updateableFields.setDressing !== undefined) updateData.setDressing = updateableFields.setDressing;
    if (updateableFields.description !== undefined) updateData.description = updateableFields.description;
    if (updateableFields.category !== undefined) updateData.category = updateableFields.category;
    if (updateableFields.twitterPost !== undefined) updateData.twitterPost = updateableFields.twitterPost;
    if (updateableFields.linkedinPost !== undefined) updateData.linkedinPost = updateableFields.linkedinPost;
    if (updateableFields.facebookPost !== undefined) updateData.facebookPost = updateableFields.facebookPost;
    if (updateableFields.tiktokCaption !== undefined) updateData.tiktokCaption = updateableFields.tiktokCaption;
    if (updateableFields.shortsCaption !== undefined) updateData.shortsCaption = updateableFields.shortsCaption;
    if (updateableFields.userNotes !== undefined) updateData.userNotes = updateableFields.userNotes;
    if (updateableFields.status !== undefined) updateData.status = updateableFields.status;
    if (updateableFields.isStarred !== undefined) updateData.isStarred = updateableFields.isStarred;
    if (updateableFields.scheduledFor !== undefined) updateData.scheduledFor = updateableFields.scheduledFor;
    
    // Handle JSON fields - convert arrays to JSON strings, null to null
    if (updateableFields.tags !== undefined) {
      updateData.tags = Array.isArray(updateableFields.tags) ? JSON.stringify(updateableFields.tags) : updateableFields.tags;
    }
    if (updateableFields.pausePoints !== undefined) {
      updateData.pausePoints = Array.isArray(updateableFields.pausePoints) ? JSON.stringify(updateableFields.pausePoints) : updateableFields.pausePoints;
    }
    if (updateableFields.emphasisPoints !== undefined) {
      updateData.emphasisPoints = Array.isArray(updateableFields.emphasisPoints) ? JSON.stringify(updateableFields.emphasisPoints) : updateableFields.emphasisPoints;
    }
    if (updateableFields.thumbnailTextIdeas !== undefined) {
      updateData.thumbnailTextIdeas = Array.isArray(updateableFields.thumbnailTextIdeas) ? JSON.stringify(updateableFields.thumbnailTextIdeas) : updateableFields.thumbnailTextIdeas;
    }
    if (updateableFields.coreConcepts !== undefined) {
      updateData.coreConcepts = Array.isArray(updateableFields.coreConcepts) ? JSON.stringify(updateableFields.coreConcepts) : updateableFields.coreConcepts;
    }
    
    // CRITICAL FIX: Handle topicFingerprint - Prisma expects String, not array
    if (updateableFields.topicFingerprint !== undefined) {
      // If it's an array, stringify it; if it's null/undefined, set to null
      if (Array.isArray(updateableFields.topicFingerprint)) {
        updateData.topicFingerprint = JSON.stringify(updateableFields.topicFingerprint);
      } else if (updateableFields.topicFingerprint === null) {
        updateData.topicFingerprint = null;
      } else if (typeof updateableFields.topicFingerprint === 'string') {
        updateData.topicFingerprint = updateableFields.topicFingerprint;
      }
    }

    // Don't send these fields if they're empty arrays - set to null instead
    if (updateData.topicFingerprint === '[]') {
      updateData.topicFingerprint = null;
    }

    console.log("[youtube/videos/[id] PATCH] Update data:", JSON.stringify(updateData, null, 2));

    const updatedVideo = await prismadb.youtubeVideo.update({
      where: { id: videoId, profileId: profile.id },
      data: updateData,
    });

    // Parse JSON fields for response
    const serialised = {
      ...updatedVideo,
      tags: safeJsonParse(updatedVideo.tags, []),
      pausePoints: safeJsonParse(updatedVideo.pausePoints, []),
      emphasisPoints: safeJsonParse(updatedVideo.emphasisPoints, []),
      thumbnailTextIdeas: safeJsonParse(updatedVideo.thumbnailTextIdeas, []),
      coreConcepts: safeJsonParse(updatedVideo.coreConcepts, []),
      topicFingerprint: safeJsonParse(updatedVideo.topicFingerprint, []),
    };

    return NextResponse.json({ data: serialised });
  } catch (error) {
    console.error("[youtube/videos/[id] PATCH] Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}



// ─── DELETE (archive) ────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; videoId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { userId, videoId } = await params;
    const user = await prismadb.user.findFirst({
      where: { OR: [{ id: userId }, { clerkId }] },
      select: { id: true, clerkId: true },
    });
    if (!user || user.clerkId !== clerkId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft-delete: set status to ARCHIVED
    const updated = await prismadb.youtubeVideo.update({
      where: { id: videoId },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ data: updated, message: "Video archived" });
  } catch (error) {
    console.error("[youtube/videos/[id] DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}