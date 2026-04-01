// =============================================================================
// isaacpaha.com — Tool View Count API
// app/api/tools/[toolId]/view/route.ts
//
// POST /api/tools/[toolId]/view
// Increments viewCount by 1. No auth required — public endpoint.
// Called by <ToolViewTracker /> on every tool page load.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;

    if (!toolId) {
      return NextResponse.json({ error: "toolId required" }, { status: 400 });
    }

    await prismadb.tool.update({
      where: { id: toolId },
      data:  { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-critical — don't surface errors to the client
    console.error("[tool-view] Failed to increment view count:", err);
    return NextResponse.json({ ok: false }, { status: 200 }); // 200 intentional — non-blocking
  }
}