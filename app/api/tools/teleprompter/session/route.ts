// =============================================================================
// isaacpaha.com — Teleprompter — Session Tracking API
// app/api/tools/teleprompter/session/route.ts
//
// FREE TOOL — NO TOKEN DEDUCTION
// Records play sessions for analytics: duration, completion, word count, etc.
//
// POST { scriptWordCount, durationSeconds, completed, maxProgress,
//        speedUsed, pauseCount, restartCount }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";

const ToolSlug = "teleprompter";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const { userId } = await auth();
    const user = userId
      ? await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
      : null;

    const body = await req.json();
    const {
      scriptWordCount = 0,
      durationSeconds = 0,
      completed       = false,
      maxProgress     = 0,
      speedUsed       = 6,
      pauseCount      = 0,
      restartCount    = 0,
    } = body;

    // Only save meaningful sessions (at least 5 seconds)
    if (Number(durationSeconds) >= 5) {
      await prismadb.teleprompterSession.create({
        data: {
          userId:          user?.id ?? null,
          scriptWordCount: Math.max(0, Number(scriptWordCount)),
          durationSeconds: Math.max(0, Number(durationSeconds)),
          completed:       Boolean(completed),
          maxProgress:     Math.max(0, Math.min(100, Number(maxProgress))),
          speedUsed:       Math.max(1, Math.min(20, Number(speedUsed))),
          pauseCount:      Math.max(0, Number(pauseCount)),
          restartCount:    Math.max(0, Number(restartCount)),
          ipAddress:       getIpFromRequest(req),
          userAgent:       req.headers.get("user-agent")?.slice(0, 500) ?? null,
        },
      });
    }

    // Track tool usage (for admin dashboard, usage count, etc.) — no token cost
    await trackToolUsage({
      toolId:       TOOL_ID,
      toolName:     "Teleprompter",
      userId:       user?.id ?? null,
      ipAddress:    getIpFromRequest(req),
      processingMs: Date.now() - start,
      tokenCost:    0,          // FREE — no tokens deducted
      wasSuccess:   true,
    });

    // Increment usageCount on the tool record
    try {
      await prismadb.tool.update({
        where: { id: TOOL_ID },
        data:  { usageCount: { increment: 1 } },
      });
    } catch {}

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("[teleprompter/session] Error:", err);
    return NextResponse.json({ error: err.message ?? "Session tracking failed" }, { status: 500 });
  }
}

// GET → return session stats for the current user (for their profile/dashboard)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ stats: null });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ stats: null });

  const sessions = await prismadb.teleprompterSession.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    take:    50,
  });

  const totalSessions    = sessions.length;
  const totalMinutes     = Math.round(sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60);
  const completedCount   = sessions.filter(s => s.completed).length;
  const totalWords       = sessions.reduce((a, s) => a + s.scriptWordCount, 0);
  const avgSpeed         = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.speedUsed, 0) / sessions.length)
    : 6;

  return NextResponse.json({
    stats: { totalSessions, totalMinutes, completedCount, totalWords, avgSpeed },
    sessions: sessions.slice(0, 10),
  });
}