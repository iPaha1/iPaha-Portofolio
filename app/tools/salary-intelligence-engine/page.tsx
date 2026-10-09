// =============================================================================
// isaacpaha.com — Salary Intelligence Engine — Dedicated Tool Page
// app/tools/salary-intelligence-engine/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { SalaryIntelligencePage } from "./_salary-intelligence-engine/salary-intelligence-engine-page";


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
    icon:        t.icon        ?? "💰",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#14b8a6",
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
  title:       "Salary Intelligence Engine — Find Out If You're Being Underpaid | Isaac Paha",
  description: "Are you being underpaid? The Salary Intelligence Engine gives you your real market value, a salary negotiation script, a 10-year earnings map, and a word-for-word script to ask for a raise — in 60 seconds.",
  openGraph: {
    title:       "Salary Intelligence Engine | Isaac Paha Tools",
    description: "Stop leaving money on the table. Find out your real market value and get a word-for-word script to negotiate your raise.",
    url:         "https://isaacpaha.com/tools/salary-intelligence-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/salary-intelligence-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Are you being underpaid? Find out in 60 seconds.",
    description: "Real market salary data + negotiation script + 10-year earnings map. Free.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/salary-intelligence-engine" },
  keywords: [
    "am i underpaid", "salary check tool", "salary negotiation script", "what is my salary worth",
    "market salary calculator", "how to ask for a raise", "salary benchmark tool",
    "career earnings calculator", "job offer analyser", "salary intelligence",
    "pay gap calculator", "negotiate salary uk", "raise script generator",
  ],
};

export default async function SalaryIntelligencePageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("salary-intelligence-engine"),
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

  return <SalaryIntelligencePage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}