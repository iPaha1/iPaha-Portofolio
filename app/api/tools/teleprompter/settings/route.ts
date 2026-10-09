// =============================================================================
// isaacpaha.com — Teleprompter — Settings API
// app/api/tools/teleprompter/settings/route.ts
//
// FREE TOOL — NO TOKEN DEDUCTION
//
// GET    → load user's saved settings + last script
// POST   → save settings (upsert)
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

const FONT_MAP: Record<string, string>  = { SANS: "SANS", SERIF: "SERIF", MONO: "MONO" };
const THEME_MAP: Record<string, string> = {
  BLACK_WHITE: "BLACK_WHITE", BLACK_AMBER: "BLACK_AMBER", BLACK_GREEN: "BLACK_GREEN",
  DARK_WHITE: "DARK_WHITE", NAVY_WHITE: "NAVY_WHITE", PAPER: "PAPER",
};

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ settings: null });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ settings: null });

  const settings = await prismadb.teleprompterSettings.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ settings });
}

// ─── POST (save/upsert settings) ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save settings" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    scrollSpeed    = 6,
    fontSize       = 46,
    fontFamily     = "SANS",
    lineHeight     = 1.75,
    textWidth      = 80,
    theme          = "BLACK_WHITE",
    textColorHex   = "#ffffff",
    bgColorHex     = "#000000",
    focusLinePos   = 28,
    showFocusLine  = true,
    showEdgeFade   = true,
    useCountdown   = true,
    loopScript     = false,
    tapToPause     = true,
    wpm            = 130,
    lastScript     = null,
    lastScriptName = null,
  } = body;

  const settings = await prismadb.teleprompterSettings.upsert({
    where:  { userId: user.id },
    update: {
      scrollSpeed:    Math.max(1, Math.min(20, Number(scrollSpeed))),
      fontSize:       Math.max(16, Math.min(100, Number(fontSize))),
      fontFamily:     (FONT_MAP[fontFamily] ?? "SANS") as any,
      lineHeight:     Math.max(1.0, Math.min(3.0, Number(lineHeight))),
      textWidth:      Math.max(40, Math.min(100, Number(textWidth))),
      theme:          (THEME_MAP[theme] ?? "BLACK_WHITE") as any,
      textColorHex:   String(textColorHex).slice(0, 10),
      bgColorHex:     String(bgColorHex).slice(0, 10),
      focusLinePos:   Math.max(5, Math.min(80, Number(focusLinePos))),
      showFocusLine:  Boolean(showFocusLine),
      showEdgeFade:   Boolean(showEdgeFade),
      useCountdown:   Boolean(useCountdown),
      loopScript:     Boolean(loopScript),
      tapToPause:     Boolean(tapToPause),
      wpm:            Math.max(60, Math.min(300, Number(wpm))),
      lastScript:     lastScript ? String(lastScript).slice(0, 50000) : null,
      lastScriptName: lastScriptName ? String(lastScriptName).slice(0, 300) : null,
    },
    create: {
      userId:         user.id,
      scrollSpeed:    Math.max(1, Math.min(20, Number(scrollSpeed))),
      fontSize:       Math.max(16, Math.min(100, Number(fontSize))),
      fontFamily:     (FONT_MAP[fontFamily] ?? "SANS") as any,
      lineHeight:     Math.max(1.0, Math.min(3.0, Number(lineHeight))),
      textWidth:      Math.max(40, Math.min(100, Number(textWidth))),
      theme:          (THEME_MAP[theme] ?? "BLACK_WHITE") as any,
      textColorHex:   String(textColorHex).slice(0, 10),
      bgColorHex:     String(bgColorHex).slice(0, 10),
      focusLinePos:   Math.max(5, Math.min(80, Number(focusLinePos))),
      showFocusLine:  Boolean(showFocusLine),
      showEdgeFade:   Boolean(showEdgeFade),
      useCountdown:   Boolean(useCountdown),
      loopScript:     Boolean(loopScript),
      tapToPause:     Boolean(tapToPause),
      wpm:            Math.max(60, Math.min(300, Number(wpm))),
      lastScript:     lastScript ? String(lastScript).slice(0, 50000) : null,
      lastScriptName: lastScriptName ? String(lastScriptName).slice(0, 300) : null,
    },
  });

  return NextResponse.json({ ok: true, settings });
}