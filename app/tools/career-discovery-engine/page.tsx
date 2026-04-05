// =============================================================================
// isaacpaha.com — Career Discovery Engine — Dedicated Tool Page
// app/tools/career-discovery-engine/page.tsx
// Route: /tools/career-discovery-engine
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { CareerDiscoveryPage } from "./_career-discovery-engine/career-discovery-engine-page";


export const dynamic = "force-dynamic";

// ─── Field normaliser ────────────────────────────────────────────────────────

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
    icon:        t.icon        ?? "💎",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#ec4899",
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

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "Hidden Career Finder — Discover High-Paying Careers No One Is Competing For | Isaac Paha",
  description: "Stop following crowded career paths. The Career Discovery Engine finds high-paying, low-competition careers tailored to your skills — with step-by-step entry roadmaps, salary insights, and certification paths.",
  openGraph: {
    title:       "Hidden Career Finder | Isaac Paha Tools",
    description: "Careers paying £50k–£120k+ that no one is applying for. Discover yours in 60 seconds.",
    url:         "https://isaacpaha.com/tools/career-discovery-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/career-discovery-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Hidden Career Finder — Your Unfair Advantage",
    description: "Stop chasing saturated jobs. Find high-paying careers no one is competing for.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/career-discovery-engine" },
  keywords: [
    "hidden careers", "high paying careers", "low competition careers",
    "career discovery", "niche careers", "SAP consultant", "GRC analyst",
    "RevOps careers", "ISO auditing", "career switcher", "graduate careers",
    "unfair advantage careers", "overlooked jobs", "career strategy",
  ],
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CareerDiscoveryPageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("career-discovery-engine"),
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

  return <CareerDiscoveryPage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}