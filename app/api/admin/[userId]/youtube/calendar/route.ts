// =============================================================================
// app/api/admin/[userId]/youtube/calendar/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { createCalendarEntry, getCalendarEntries, getOrCreateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";


export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const { searchParams } = new URL(req.url);
    const from = new Date(searchParams.get("from") || new Date().toISOString());
    const to = new Date(searchParams.get("to") || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString());
    const entries = await getCalendarEntries(profile.id, from, to);
    return NextResponse.json({ data: entries });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const { userId } = await params;
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const body = await req.json();
    const entry = await createCalendarEntry({
      profileId: profile.id,
      videoId: body.videoId,
      title: body.title,
      scheduledDate: new Date(body.scheduledDate),
      status: body.status,
      color: body.color,
      notes: body.notes,
    });
    if (body.videoId) {
      await prismadb.youtubeVideo.update({
        where: { id: body.videoId },
        data: { scheduledFor: new Date(body.scheduledDate), status: "SCHEDULED" },
      });
    }
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}