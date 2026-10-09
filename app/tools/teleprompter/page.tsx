// =============================================================================
// isaacpaha.com — Teleprompter — Server Page
// app/tools/teleprompter/page.tsx
//
// FREE TOOL — no token cost, but full tool shell with:
// - ToolViewTracker (usage analytics)
// - ToolReviews
// - Related tools sidebar
// - Standard breadcrumbs + hero
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { TeleprompterPage } from "./_teleprompter/teleprompter-page";


export const dynamic = "force-dynamic";

const CATEGORY_ACCENT: Record<string, string> = {
  AI:           "#f59e0b",
  CAREER:       "#ec4899",
  FINANCE:      "#14b8a6",
  STARTUP:      "#10b981",
  EDUCATION:    "#8b5cf6",
  PRODUCTIVITY: "#14b8a6",
  WRITING:      "#3b82f6",
  OTHER:        "#6b7280",
};

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((t): t is string => typeof t === "string") : []; }
  catch { return []; }
}
function parseFeatures(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(t: any): NormalisedTool {
  return {
    id:          t.id,
    slug:        t.slug,
    name:        t.name,
    tagline:     t.tagLine,
    description: t.description,
    category:    t.category,
    status:      t.status,
    icon:        t.icon        ?? "🎙️",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#14b8a6",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount  ?? 0,
    tokenCost:   t.tokenCost   ?? 0,
    ratingAvg:   t.ratingAvg   ?? 0,
    ratingCount: t.ratingCount ?? 0,
    isFeatured:  t.isFeatured,
    isNew:       t.isNew,
    isPremium:   t.isPremium,
    coverImage:  t.coverImage  ?? undefined,
    buildTime:   t.buildTime   ?? undefined,
  };
}

export const metadata: Metadata = {
  title:       "Free Teleprompter — Professional Scrolling Script for Content Creators | Isaac Paha",
  description: "A fully-featured, free teleprompter for YouTubers, podcasters, presenters, and speakers. Mirror mode, speed control, font settings, cue markers, fullscreen, and more. No account required.",
  openGraph: {
    title:       "Free Professional Teleprompter | Isaac Paha Tools",
    description: "The go-to teleprompter for content creators. Mirror mode, focus guide, cue markers, fullscreen, speed control. Free forever.",
    url:         "https://isaacpaha.com/tools/teleprompter",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/teleprompter.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Free Teleprompter for Content Creators — No Account Required",
    description: "Mirror mode, speed control, cue markers, fullscreen, custom fonts and colours. The professional teleprompter you've been looking for.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/teleprompter" },
  keywords: [
    "free teleprompter online", "teleprompter for youtube", "teleprompter for content creators",
    "online teleprompter mirror mode", "teleprompter app browser", "free teleprompter no download",
    "teleprompter for podcasters", "video script teleprompter", "scrolling script tool",
    "teleprompter fullscreen free", "autocue online free", "presenter teleprompter",
  ],
};

export default async function TeleprompterPageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("teleprompter"),
    getPublicTools(),
  ]);

  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  let isSignedIn = false;
  let savedSettings = null;

  if (userId) {
    const user = await prismadb.user.findUnique({
      where:   { clerkId: userId },
      select:  { id: true },
    });
    if (user) {
      isSignedIn = true;
      savedSettings = await prismadb.teleprompterSettings.findUnique({
        where: { userId: user.id },
      });
    }
  }

  return (
    <TeleprompterPage
      isSignedIn={isSignedIn}
      tool={tool}
      relatedTools={relatedTools}
      savedSettings={savedSettings}
    />
  );
}