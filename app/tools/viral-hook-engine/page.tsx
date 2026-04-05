// =============================================================================
// isaacpaha.com — Viral Hook Engine — Dedicated Tool Page
// app/tools/viral-hook-engine/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import { DbTool, NormalisedTool } from "@/app/tools/_tools/tools-lab-client";
import { ViralHookPage } from "./_viral-hook-engine/viral-hook-engine-page";


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
    icon:        t.icon        ?? "🔥",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#f97316",
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
  title:       "Viral Hook Engine — Turn Any Idea Into Content That Spreads | Isaac Paha",
  description: "Stop guessing why some videos get millions of views. The Viral Hook Engine analyses your content idea and gives you 10 scored hook rewrites, thumbnail concepts, a retention script, and an algorithm package — in seconds.",
  openGraph: {
    title:       "Viral Hook Engine | Isaac Paha Tools",
    description: "Why does their video get 2M views and yours gets 200? Find out — and fix it.",
    url:         "https://isaacpaha.com/tools/viral-hook-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/viral-hook-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Viral Hook Engine — For Creators Who Want to Actually Grow",
    description: "10 viral hook rewrites, thumbnail concepts, retention scripts, and algorithm metadata. For YouTube, TikTok, LinkedIn & more.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/viral-hook-engine" },
  keywords: [
    "viral content creator tool", "youtube hook generator", "tiktok hook ideas",
    "viral video title generator", "content creator AI tool", "youtube algorithm",
    "thumbnail ideas", "video hook writer", "content strategy tool",
    "how to go viral", "creator growth tool", "viral hook formula",
  ],
};

export default async function ViralHookPageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("viral-hook-engine"),
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

  return <ViralHookPage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}