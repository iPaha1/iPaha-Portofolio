// =============================================================================
// isaacpaha.com — Smart Budget Survival Planner — Dedicated Tool Page
// app/tools/smart-budget-planner/page.tsx
// Route: /tools/smart-budget-planner
// =============================================================================

import type { Metadata }       from "next";
import { currentUser }         from "@clerk/nextjs/server";
import { notFound }            from "next/navigation";
import { getToolBySlug }       from "@/lib/actions/tools-actions";
import { getPublicTools }      from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { BudgetPlannerPage } from "./_smart-budget-planner/budget-planner-page";

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
    icon:        t.icon          ?? "💸",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#6366f1",
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

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Smart Budget Survival Planner — Can You Survive on This?",
  description:
    "Enter your total budget, fixed costs, and flexible spending to get a personalised day-by-day survival plan with daily limits, risk assessment, cut suggestions, scenario testing, and an AI budget coach. Free.",
  openGraph: {
    title:       "Smart Budget Survival Planner | Free Tool — Isaac Paha",
    description: "\"Can I survive on £500 for 30 days?\" — find out in seconds with a full day-by-day plan.",
    url:         "https://isaacpaha.com/tools/smart-budget-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/budget-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Smart Budget Survival Planner | Free Tool",
    description: "Your daily survival budget, risk level, and exact cut suggestions — instant, free, and judgment-free.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/smart-budget-planner" },
  keywords: [
    "budget planner", "survival budget", "daily budget calculator",
    "can I afford", "how to make money last", "budget breakdown",
    "money survival plan", "budget tool UK", "AI budget planner",
    "how to stretch money", "tight budget plan",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SmartBudgetPlannerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("smart-budget-planner"),
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
    <BudgetPlannerPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}






// // =============================================================================
// // isaacpaha.com — Smart Budget Survival Planner — Dedicated Tool Page
// // app/tools/smart-budget-planner/page.tsx
// // Route: /tools/smart-budget-planner
// // =============================================================================

// import type { Metadata }       from "next";
// import { currentUser }         from "@clerk/nextjs/server";
// import { BudgetPlannerPage } from "./_smart-budget-planner/budget-planner-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "Smart Budget Survival Planner — Can You Survive on This?",
//   description:
//     "Enter your total budget, fixed costs, and flexible spending to get a personalised day-by-day survival plan with daily limits, risk assessment, cut suggestions, scenario testing, and an AI budget coach. Free.",
//   openGraph: {
//     title:       "Smart Budget Survival Planner | Free Tool — Isaac Paha",
//     description: "\"Can I survive on £500 for 30 days?\" — find out in seconds with a full day-by-day plan.",
//     url:         "https://isaacpaha.com/tools/smart-budget-planner",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/budget-planner.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Smart Budget Survival Planner | Free Tool",
//     description: "Your daily survival budget, risk level, and exact cut suggestions — instant, free, and judgment-free.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/smart-budget-planner" },
//   keywords: [
//     "budget planner", "survival budget", "daily budget calculator",
//     "can I afford", "how to make money last", "budget breakdown",
//     "money survival plan", "budget tool UK", "AI budget planner",
//     "how to stretch money", "tight budget plan",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default async function SmartBudgetPlannerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <BudgetPlannerPage isSignedIn={!!clerkUser} />;
// }