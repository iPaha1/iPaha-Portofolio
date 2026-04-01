// =============================================================================
// isaacpaha.com — Productivity Score — Dedicated Tool Page
// app/tools/productivity-score/page.tsx
// Route: /tools/productivity-score
// =============================================================================

import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/actions/tools-actions";
import { getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { ProductivityScorePage } from "./_productivity-score/productivity-score-page";

export const dynamic = 'force-dynamic';

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
    icon:        t.icon          ?? "📊",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#14b8a6",
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

export const metadata: Metadata = {
  title: "Productivity Score — Find What's Slowing You Down | Free Audit Tool",
  description:
    "Take a 20-question audit of your work habits, focus, and daily systems. Get a personalised productivity score, uncover hidden bottlenecks, and receive a clear, actionable plan to improve how you work — instantly.",
  openGraph: {
    title: "Productivity Score — Free Audit Tool | Isaac Paha",
    description: "Find what's slowing you down and fix it today. Get your personalised score, bottleneck detection, and 3-step action plan.",
    url: "https://isaacpaha.com/tools/productivity-score",
    type: "website",
    images: [{ url: "https://isaacpaha.com/og/productivity-score.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Productivity Score — Free Audit Tool",
    description: "20 questions. 90 seconds. Get your score + a plan to work better.",
    creator: "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/productivity-score" },
  keywords: [
    "productivity score", "productivity audit", "focus test", "work habits",
    "time management", "productivity tool", "how productive am I",
    "bottleneck detection", "productivity assessment", "workflow audit",
    "productivity quiz",
  ],
};

export default async function ProductivityScoreServerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("productivity-score"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  return (
    <ProductivityScorePage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}





// // =============================================================================
// // isaacpaha.com — Productivity Score — Dedicated Tool Page
// // app/tools/productivity-score/page.tsx
// // Route: /tools/productivity-score
// // =============================================================================

// import type { Metadata } from "next";
// import { currentUser } from "@clerk/nextjs/server";
// import { ProductivityScorePage } from "./_productivity-score/productivity-score-page";

// export const dynamic = 'force-dynamic';

// export const metadata: Metadata = {
//   title: "Productivity Score — Find What's Slowing You Down | Free Audit Tool",
//   description:
//     "Take a 20-question audit of your work habits, focus, and daily systems. Get a personalised productivity score, uncover hidden bottlenecks, and receive a clear, actionable plan to improve how you work — instantly.",
//   openGraph: {
//     title: "Productivity Score — Free Audit Tool | Isaac Paha",
//     description: "Find what's slowing you down and fix it today. Get your personalised score, bottleneck detection, and 3-step action plan.",
//     url: "https://isaacpaha.com/tools/productivity-score",
//     type: "website",
//     images: [{ url: "https://isaacpaha.com/og/productivity-score.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "Productivity Score — Free Audit Tool",
//     description: "20 questions. 90 seconds. Get your score + a plan to work better.",
//     creator: "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/productivity-score" },
//   keywords: [
//     "productivity score", "productivity audit", "focus test", "work habits",
//     "time management", "productivity tool", "how productive am I",
//     "bottleneck detection", "productivity assessment", "workflow audit",
//     "productivity quiz",
//   ],
// };

// export default async function ProductivityScoreServerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <ProductivityScorePage isSignedIn={!!clerkUser} />;
// }