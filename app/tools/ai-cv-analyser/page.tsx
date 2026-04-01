// =============================================================================
// isaacpaha.com — AI CV Analyser Pro — Dedicated Tool Page
// app/tools/ai-cv-analyser/page.tsx
// =============================================================================

import type { Metadata }  from "next";
import { currentUser }    from "@clerk/nextjs/server";
import { notFound }       from "next/navigation";
import { CVAnalyserPage } from "./_ai-cv-analyser/ai-cv-analyser-page";
import { getToolBySlug }  from "@/lib/actions/tools-actions";
import { getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";

export const dynamic = "force-dynamic";

// ─── Field normaliser (mirrors tools-lab-client.tsx normalise()) ──────────────

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
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((t): t is string => typeof t === "string") : [];
  } catch { return []; }
}

function parseFeatures(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
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
    icon:        t.icon          ?? "🔧",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#f59e0b",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount    ?? 0,
    tokenCost:   t.tokenCost     ?? undefined,
    ratingAvg:   t.ratingAvg     ?? 0,
    ratingCount: t.ratingCount   ?? 0,
    isFeatured:  t.isFeatured,
    isNew:       t.isNew,
    isPremium:   t.isPremium,
    coverImage:  t.coverImage    ?? undefined,
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "AI CV Analyser Pro — ATS Check, Keyword Gap & Rewrite Tool",
  description: "Free AI-powered CV analyser. Get your ATS score, keyword gap analysis vs a job description, section-by-section feedback, bullet point rewrites, and interview questions — in 8 seconds.",
  openGraph: {
    title:       "AI CV Analyser Pro | Free Tool — Isaac Paha",
    description: "ATS score, keyword gap analysis, section feedback, bullet rewrites & interview prep. Free.",
    url:         "https://isaacpaha.com/tools/ai-cv-analyser",
    type:        "website",
  },
  twitter: {
    card:    "summary_large_image",
    title:   "AI CV Analyser Pro | Free Tool",
    creator: "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/ai-cv-analyser" },
  keywords: [
    "CV analyser", "resume analyzer", "ATS checker", "keyword gap analysis",
    "CV feedback", "ATS score", "CV rewriter", "AI resume checker",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AICVAnalyserPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("ai-cv-analyser"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  return (
    <CVAnalyserPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}






// // =============================================================================
// // isaacpaha.com — AI CV Analyser Pro — Dedicated Tool Page
// // app/tools/ai-cv-analyser/page.tsx
// // Route: /tools/ai-cv-analyser
// // =============================================================================

// import type { Metadata } from "next";
// import { currentUser }   from "@clerk/nextjs/server";
// import { CVAnalyserPage } from "./_ai-cv-analyser/ai-cv-analyser-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "AI CV Analyser Pro — ATS Check, Keyword Gap & Rewrite Tool",
//   description:
//     "Free AI-powered CV analyser. Get your ATS score, keyword gap analysis vs a job description, section-by-section feedback, bullet point rewrites, and interview questions — in 8 seconds.",
//   openGraph: {
//     title:       "AI CV Analyser Pro | Free Tool — Isaac Paha",
//     description: "ATS score, keyword gap analysis, section feedback, bullet rewrites & interview prep. Free.",
//     url:         "https://isaacpaha.com/tools/ai-cv-analyser",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/cv-analyser.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "AI CV Analyser Pro | Free Tool",
//     description: "ATS score, keyword gap analysis, bullet rewrites and interview prep in 8 seconds.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/ai-cv-analyser" },
//   keywords: [
//     "CV analyser", "resume analyzer", "ATS checker", "keyword gap analysis",
//     "CV feedback", "resume feedback", "ATS score", "CV rewriter",
//     "job application CV", "AI resume checker", "CV improvement tool",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default async function AICVAnalyserPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <CVAnalyserPage isSignedIn={!!clerkUser} />;
// }