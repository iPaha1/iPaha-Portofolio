// =============================================================================
// app/api/admin/[userId]/youtube/analytics/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getAnalyticsSnapshots, getOrCreateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const { userId } = await params;
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const { searchParams } = new URL(req.url);
    const [snapshots, topVideos] = await Promise.all([
      getAnalyticsSnapshots(profile.id, parseInt(searchParams.get("limit") || "12")),
      prismadb.youtubeVideo.findMany({
        where: { profileId: profile.id, status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 10,
        select: { id: true, title: true, seoTitle: true, viewCount: true, likeCount: true, commentCount: true, ctr: true, avgWatchPercent: true, publishedAt: true },
      }),
    ]);
    return NextResponse.json({ data: { snapshots, topVideos } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}