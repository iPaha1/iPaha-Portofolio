// =============================================================================
// app/api/admin/[userId]/youtube/goals/route.ts
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { createGoal, getGoals, getOrCreateProfile } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";

 
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const goals = await getGoals(profile.id);
    return NextResponse.json({ data: goals });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
 
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const user = await prismadb.user.findFirst({ where: { OR: [{ id: userId }, { clerkId }] }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const profile = await getOrCreateProfile(user.id);
    const body = await req.json();
    const goal = await createGoal({
      profileId: profile.id,
      title: body.title,
      targetMetric: body.targetMetric,
      targetValue: body.targetValue,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
      description: body.description,
    });
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
 