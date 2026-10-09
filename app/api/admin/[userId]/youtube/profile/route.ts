// =============================================================================
// API: /api/admin/[userId]/youtube/profile
// GET  — fetch creator profile (create if missing)
// PATCH — update profile settings
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getOrCreateProfile, updateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";


// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {

    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // Resolve userId from clerkId or direct userId
    const user = await prismadb.user.findFirst({
      where: {
        OR: [{ id: userId }, { clerkId }],
      },
      select: { id: true, clerkId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow admin or the user themselves
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isSelf = user.clerkId === clerkId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await getOrCreateProfile(user.id);

    // Parse JSON fields before returning
    const serialised = {
      ...profile,
      coreThemes: safeJsonParse<string[]>(profile.coreThemes, []),
      topicMemory: safeJsonParse(profile.topicMemory, []),
    };

    return NextResponse.json({ data: serialised });
  } catch (error) {
    console.error("[youtube/profile GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();

    const user = await prismadb.user.findFirst({
      where: {
        OR: [{ id: userId }, { clerkId }],
      },
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

    const {
      channelName, channelHandle, channelDescription, channelAvatarUrl, channelBannerUrl,
      videosPerWeek, defaultTone, targetAudience, creatorBio, uniqueVoiceNotes,
      channelMission, coreThemes, speakingPace, cameraStyle, backgroundStyle, isOnboarded,
    } = body;

    const updated = await updateProfile(profile.id, {
      channelName, channelHandle, channelDescription, channelAvatarUrl, channelBannerUrl,
      videosPerWeek, defaultTone, targetAudience, creatorBio, uniqueVoiceNotes,
      channelMission, coreThemes, speakingPace, cameraStyle, backgroundStyle, isOnboarded,
    });

    return NextResponse.json({ data: updated, message: "Profile updated" });
  } catch (error) {
    console.error("[youtube/profile PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}