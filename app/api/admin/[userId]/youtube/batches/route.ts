// app/api/admin/[userId]/youtube/batches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getBatchesForProfile, getOrCreateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: (await params).userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const { searchParams } = new URL(req.url);
    const batches = await getBatchesForProfile(profile.id, parseInt(searchParams.get("limit") || "10"));
    return NextResponse.json({ data: batches });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}