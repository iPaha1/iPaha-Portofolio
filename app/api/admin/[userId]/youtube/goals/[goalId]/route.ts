// =============================================================================
// app/api/admin/[userId]/youtube/goals/[goalId]/route.ts
// PATCH — update goal current value / completion
// DELETE — delete a goal
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { updateGoalProgress } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; goalId: string }> }
) {
  try {
    const { userId, goalId } = await params;

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = await req.json();

    // If currentValue provided — use updateGoalProgress (handles completion logic)
    if (body.currentValue !== undefined) {
      const updated = await updateGoalProgress(goalId, body.currentValue);
      return NextResponse.json({ data: updated });
    }

    // Otherwise generic update
    const updated = await prismadb.youtubeChannelGoal.update({
      where: { id: goalId },
      data: body,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[youtube/goals/[id] PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; goalId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { goalId } = await params;
    await prismadb.youtubeChannelGoal.delete({ where: { id: goalId } });
    return NextResponse.json({ message: "Goal deleted" });
  } catch (error) {
    console.error("[youtube/goals/[id] DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}