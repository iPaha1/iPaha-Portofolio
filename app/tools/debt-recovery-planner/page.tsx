// =============================================================================
// isaacpaha.com — AI Debt Recovery Planner — Dedicated Tool Page
// app/tools/debt-recovery-planner/page.tsx
// Route: /tools/debt-recovery-planner
// =============================================================================

import type { Metadata }    from "next";
import { currentUser }      from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { getToolBySlug }    from "@/lib/actions/tools-actions";
import { getPublicTools }   from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { DebtPlannerPage } from "./_debt-recovery-planner/debt-planner-page";

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
    icon:        t.icon          ?? "💰",
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

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "AI Debt Recovery Planner — Free Personalised Debt Repayment Plan",
  description:
    "Enter your debts, income, and expenses to get a personalised AI-generated repayment roadmap. Snowball or avalanche strategy, month-by-month timeline, weekly action plan, scenario simulation, and an AI financial coach — all free.",
  openGraph: {
    title:       "AI Debt Recovery Planner | Free Tool — Isaac Paha",
    description: "Turn financial stress into a clear, step-by-step plan. Free personalised debt repayment roadmap with AI coaching.",
    url:         "https://isaacpaha.com/tools/debt-recovery-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/debt-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AI Debt Recovery Planner | Free Tool",
    description: "Free personalised debt repayment roadmap with AI coaching. Turn financial stress into a clear plan.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/debt-recovery-planner" },
  keywords: [
    "debt repayment plan", "debt recovery planner", "how to pay off debt",
    "debt snowball calculator", "debt avalanche calculator",
    "free debt planner", "AI debt advice", "debt payoff timeline",
    "budgeting tool", "personal finance planner",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DebtRecoveryPlannerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("debt-recovery-planner"),
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
    <DebtPlannerPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}






// // =============================================================================
// // isaacpaha.com — AI Debt Recovery Planner — Dedicated Tool Page
// // app/tools/debt-recovery-planner/page.tsx
// // Route: /tools/debt-recovery-planner
// // =============================================================================

// import type { Metadata }    from "next";
// import { currentUser }      from "@clerk/nextjs/server";
// import { DebtPlannerPage } from "./_debt-recovery-planner/debt-planner-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "AI Debt Recovery Planner — Free Personalised Debt Repayment Plan",
//   description:
//     "Enter your debts, income, and expenses to get a personalised AI-generated repayment roadmap. Snowball or avalanche strategy, month-by-month timeline, weekly action plan, scenario simulation, and an AI financial coach — all free.",
//   openGraph: {
//     title:       "AI Debt Recovery Planner | Free Tool — Isaac Paha",
//     description: "Turn financial stress into a clear, step-by-step plan. Free personalised debt repayment roadmap with AI coaching.",
//     url:         "https://isaacpaha.com/tools/debt-recovery-planner",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/debt-planner.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "AI Debt Recovery Planner | Free Tool",
//     description: "Free personalised debt repayment roadmap with AI coaching. Turn financial stress into a clear plan.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/debt-recovery-planner" },
//   keywords: [
//     "debt repayment plan", "debt recovery planner", "how to pay off debt",
//     "debt snowball calculator", "debt avalanche calculator",
//     "free debt planner", "AI debt advice", "debt payoff timeline",
//     "budgeting tool", "personal finance planner",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default async function DebtRecoveryPlannerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <DebtPlannerPage isSignedIn={!!clerkUser} />;
// }