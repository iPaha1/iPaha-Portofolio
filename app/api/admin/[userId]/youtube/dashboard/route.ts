// =============================================================================
// app/api/admin/[userId]/youtube/dashboard/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getDashboardStats, getOrCreateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const { userId } = await params;
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const stats = await getDashboardStats(profile.id);
    return NextResponse.json({ data: stats });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}