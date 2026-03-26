// =============================================================================
// API: Game Settings
// app/api/game/settings/route.ts
// =============================================================================

// app/api/game/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user by clerkId to get database ID
    const user = await prismadb.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use database ID to find settings
    let settings = await prismadb.gameSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      // Create settings if they don't exist
      settings = await prismadb.gameSettings.create({
        data: {
          userId: user.id,
          gameEnabled: true,
          soundEnabled: true,
          notificationsEnabled: true,
          minGameDelay: 2,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[game/settings GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const updates = await req.json();

    const settings = await prismadb.gameSettings.update({
      where: { userId: user.id },
      data: updates,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[game/settings PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
