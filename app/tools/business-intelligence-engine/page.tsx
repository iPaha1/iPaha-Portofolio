// =============================================================================
// isaacpaha.com — Business Intelligence Engine — Server Page
// app/tools/business-intelligence-engine/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { BusinessIntelligencePage } from "./_business-intelligence-engine/business-intelligence-engine-page";


export const dynamic = "force-dynamic";

const CATEGORY_ACCENT: Record<string, string> = {
  AI: "#f59e0b", CAREER: "#ec4899", FINANCE: "#14b8a6", STARTUP: "#10b981",
  EDUCATION: "#8b5cf6", PRODUCTIVITY: "#14b8a6", WRITING: "#3b82f6", OTHER: "#6b7280",
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
    id: t.id, slug: t.slug, name: t.name, tagline: t.tagLine, description: t.description,
    category: t.category, status: t.status, icon: t.icon ?? "🚀",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#10b981",
    tags: parseTags(t.tags), features: parseFeatures(t.features),
    usageCount: t.usageCount ?? 0, tokenCost: t.tokenCost ?? undefined,
    ratingAvg: t.ratingAvg ?? 0, ratingCount: t.ratingCount ?? 0,
    isFeatured: t.isFeatured, isNew: t.isNew, isPremium: t.isPremium,
    coverImage: t.coverImage ?? undefined, buildTime: t.buildTime ?? undefined,
  };
}

export const metadata: Metadata = {
  title:       "Business Intelligence Engine — From Raw Idea to Investor-Ready in One Session | Isaac Paha",
  description: "Validate your business idea, build a complete business plan, get market analysis, competitive intelligence, revenue modelling, go-to-market strategy, and a full pitch deck brief — all in one tool.",
  openGraph: {
    title:       "Business Intelligence Engine | Isaac Paha Tools",
    description: "From raw idea to investor-ready. Business validation + full plan + pitch deck brief in one session.",
    url:         "https://isaacpaha.com/tools/business-intelligence-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/business-intelligence-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Is your business idea actually good? Find out — then build the plan.",
    description: "Validation score, market analysis, competitive intel, financial model, go-to-market, pitch deck brief. All in one.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/business-intelligence-engine" },
  keywords: [
    "business idea validator", "ai business plan generator", "startup idea validator",
    "business plan tool", "market analysis tool", "competitive analysis startup",
    "pitch deck generator", "go to market strategy tool", "startup financial model",
    "business intelligence tool", "validate startup idea", "business plan ai",
  ],
};

export default async function BusinessIntelligencePageRoute() {
  const { userId } = await auth();
  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("business-intelligence-engine"),
    getPublicTools(),
  ]);
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();
  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter(t => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3).map(normalise);
  let isSignedIn = false;
  if (userId) {
    const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    isSignedIn = !!user;
  }
  return <BusinessIntelligencePage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}