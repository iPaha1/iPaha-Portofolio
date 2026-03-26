// =============================================================================
// API: Streak Management
// app/api/game/streak/route.ts   GET (fetch current streak)
// app/api/game/streak/update/route.ts  POST (update streak after game)
// =============================================================================

// app/api/game/streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let streak = await prismadb.userStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await prismadb.userStreak.create({
        data: { 
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    return NextResponse.json(streak);
  } catch (error) {
    console.error("[game/streak] Error:", error);
    return NextResponse.json({ error: "Failed to fetch streak" }, { status: 500 });
  }
}