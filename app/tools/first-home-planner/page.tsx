// =============================================================================
// isaacpaha.com — First Home Planner — Dedicated Tool Page
// app/tools/first-home-planner/page.tsx
// Route: /tools/first-home-planner
// =============================================================================

import type { Metadata }      from "next";
import { currentUser }        from "@clerk/nextjs/server";
import { notFound }           from "next/navigation";
import { prismadb }           from "@/lib/db";
import { getToolBySlug }      from "@/lib/actions/tools-actions";
import { getPublicTools }     from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { HomePlannerPage } from "./_first-home-planner/home-planner-page";

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
    icon:        t.icon          ?? "🏡",
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
  title: "First Home Planner — Free AI Tool to Plan Buying Your First Home",
  description:
    "Go from your first payslip to owning a home. Enter your income, savings, and target property price to get a personalised AI-powered deposit plan, mortgage readiness roadmap, credit-building strategy, and a month-by-month action plan. Free, UK-focused.",
  openGraph: {
    title:       "First Home Planner | Free AI Tool — Isaac Paha",
    description: "From renting to owning. Get your personalised deposit plan, mortgage roadmap, and credit strategy — all free.",
    url:         "https://isaacpaha.com/tools/first-home-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/first-home-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "First Home Planner | Free AI Tool",
    description: "Get your personalised plan to buy your first home — deposit target, roadmap, credit strategy.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/first-home-planner" },
  keywords: [
    "first home planner", "how to buy first home UK", "first time buyer guide",
    "mortgage readiness", "deposit savings plan", "how much deposit do I need",
    "first time buyer schemes UK", "lifetime ISA calculator",
    "can I afford a house", "mortgage calculator UK", "home buying plan",
    "how to save for a house", "credit score for mortgage",
  ],
};

// ─── Page — server component with optional DB prefetch ───────────────────────

export default async function FirstHomePlannerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("first-home-planner"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  let initialPlan = null;

  if (clerkUser) {
    try {
      const user = await prismadb.user.findUnique({
        where:  { clerkId: clerkUser.id },
        select: { id: true },
      });
      if (user) {
        initialPlan = await prismadb.homeOwnershipPlan.findFirst({
          where:   { userId: user.id },
          orderBy: { updatedAt: "desc" },
          include: {
            milestones:  { orderBy: { targetMonth: "asc" } },
            savingsLogs: { orderBy: { savedAt: "desc" }, take: 20 },
          },
        });
      }
    } catch {
      // DB not yet migrated — fail silently, tool still works without saved plan
    }
  }

  return (
    <HomePlannerPage
      isSignedIn={!!clerkUser}
      initialPlan={initialPlan}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}


// // =============================================================================
// // isaacpaha.com — First Home Planner — Dedicated Tool Page
// // app/tools/first-home-planner/page.tsx
// // Route: /tools/first-home-planner
// // =============================================================================

// import type { Metadata }      from "next";
// import { currentUser }        from "@clerk/nextjs/server";
// import { prismadb }           from "@/lib/db";
// import { HomePlannerPage } from "./_first-home-planner/home-planner-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "First Home Planner — Free AI Tool to Plan Buying Your First Home",
//   description:
//     "Go from your first payslip to owning a home. Enter your income, savings, and target property price to get a personalised AI-powered deposit plan, mortgage readiness roadmap, credit-building strategy, and a month-by-month action plan. Free, UK-focused.",
//   openGraph: {
//     title:       "First Home Planner | Free AI Tool — Isaac Paha",
//     description: "From renting to owning. Get your personalised deposit plan, mortgage roadmap, and credit strategy — all free.",
//     url:         "https://isaacpaha.com/tools/first-home-planner",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/first-home-planner.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "First Home Planner | Free AI Tool",
//     description: "Get your personalised plan to buy your first home — deposit target, roadmap, credit strategy.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/first-home-planner" },
//   keywords: [
//     "first home planner", "how to buy first home UK", "first time buyer guide",
//     "mortgage readiness", "deposit savings plan", "how much deposit do I need",
//     "first time buyer schemes UK", "lifetime ISA calculator",
//     "can I afford a house", "mortgage calculator UK", "home buying plan",
//     "how to save for a house", "credit score for mortgage",
//   ],
// };

// // ─── Page — server component with optional DB prefetch ───────────────────────

// export default async function FirstHomePlannerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   let initialPlan = null;

//   if (clerkUser) {
//     try {
//       const user = await prismadb.user.findUnique({
//         where:  { clerkId: clerkUser.id },
//         select: { id: true },
//       });
//       if (user) {
//         initialPlan = await prismadb.homeOwnershipPlan.findFirst({
//           where:   { userId: user.id },
//           orderBy: { updatedAt: "desc" },
//           include: {
//             milestones:  { orderBy: { targetMonth: "asc" } },
//             savingsLogs: { orderBy: { savedAt: "desc" }, take: 20 },
//           },
//         });
//       }
//     } catch {
//       // DB not yet migrated — fail silently, tool still works without saved plan
//     }
//   }

//   return (
//     <HomePlannerPage
//       isSignedIn={!!clerkUser}
//       initialPlan={initialPlan}
//     />
//   );
// }