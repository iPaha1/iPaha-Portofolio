// =============================================================================
// isaacpaha.com — Content Studio AI — Dedicated Tool Page
// app/tools/content-studio/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { ContentStudioPage } from "./_content-studio/content-studio-page";


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
    icon:        t.icon        ?? "🎬",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#8b5cf6",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount  ?? 0,
    tokenCost:   t.tokenCost   ?? undefined,
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
  title:       "Content Studio AI — Full Production-Ready Scripts for YouTube, TikTok & More | Isaac Paha",
  description: "Go from blank page to publish-ready in 60 seconds. Content Studio AI writes your complete script, hook, B-roll notes, thumbnail brief, description, chapters, and promotion tweets — for any platform.",
  openGraph: {
    title:       "Content Studio AI | Isaac Paha Tools",
    description: "Your entire video script. Written. Complete with hook, B-roll, thumbnail, description, and promotion package.",
    url:         "https://isaacpaha.com/tools/content-studio",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/content-studio.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Content Studio AI — From Idea to Publish-Ready in 60 Seconds",
    description: "Full scripts. Real hooks. Thumbnail briefs. Description. Chapters. Promotion tweets. Everything.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/content-studio" },
  keywords: [
    "youtube script writer", "tiktok script generator", "content creator ai tool",
    "video script writer ai", "full content production tool", "youtube description generator",
    "content creation workflow", "blog post writer ai", "podcast script writer",
    "newsletter writer ai", "content repurposing tool", "creator productivity tool",
  ],
};

export default async function ContentStudioPageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("content-studio"),
    getPublicTools(),
  ]);

  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  let isSignedIn = false;
  if (userId) {
    const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    isSignedIn = !!user;
  }

  return <ContentStudioPage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}