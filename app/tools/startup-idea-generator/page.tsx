// =============================================================================
// isaacpaha.com — Startup Idea Generator — Server Page
// app/tools/startup-idea-generator/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { StartupGeneratorPage } from "./_startup-idea-generator/startup-generator-page";


export const dynamic = "force-dynamic";

const CATEGORY_ACCENT: Record<string, string> = {
  AI:"#f59e0b",CAREER:"#ec4899",FINANCE:"#14b8a6",STARTUP:"#10b981",
  EDUCATION:"#8b5cf6",PRODUCTIVITY:"#14b8a6",WRITING:"#3b82f6",OTHER:"#6b7280",
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
    category: t.category, status: t.status, icon: t.icon ?? "🦄",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#8b5cf6",
    tags: parseTags(t.tags), features: parseFeatures(t.features),
    usageCount: t.usageCount ?? 0, tokenCost: t.tokenCost ?? undefined,
    ratingAvg: t.ratingAvg ?? 0, ratingCount: t.ratingCount ?? 0,
    isFeatured: t.isFeatured, isNew: t.isNew, isPremium: t.isPremium,
    coverImage: t.coverImage ?? undefined, buildTime: t.buildTime ?? undefined,
  };
}

export const metadata: Metadata = {
  title:       "Startup Idea Generator — World-Changing, Unicorn-Potential Startup Ideas Based on YOUR Skills | Isaac Paha",
  description: "Not another generic startup generator. Describe your background, skills, and interests — get AI-generated unicorn startup ideas with market sizing, validation questions, moat strategy, and the exact first steps to take. Built for builders.",
  openGraph: {
    title:       "Startup Idea Generator | Isaac Paha Tools",
    description: "World-changing startup ideas matched to your founder DNA. Real market sizing, validation questions, and first steps.",
    url:         "https://isaacpaha.com/tools/startup-idea-generator",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/startup-idea-generator.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Your background + AI = your next billion-dollar startup idea.",
    description: "Describe your skills. Get unicorn startup ideas with market sizing, validation questions, and exact first steps. Free to try.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/startup-idea-generator" },
  keywords: [
    "startup idea generator", "startup ideas for developers", "unicorn startup ideas",
    "AI startup generator", "startup ideas based on skills", "founder idea generator",
    "world changing startup ideas", "next billion dollar startup", "startup idea validator",
    "startup for engineers", "build the next big thing", "startup brainstorm tool",
  ],
};

export default async function StartupGeneratorPageRoute() {
  const { userId } = await auth();
  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("startup-idea-generator"),
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
  return <StartupGeneratorPage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}