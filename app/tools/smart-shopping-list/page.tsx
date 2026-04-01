// =============================================================================
// isaacpaha.com — Smart Shared Shopping List — Dedicated Tool Page
// app/tools/smart-shopping-list/page.tsx
// =============================================================================

import type { Metadata }  from "next";
import { currentUser }    from "@clerk/nextjs/server";
import { notFound }       from "next/navigation";
import { ShoppingListPage } from "./_smart-shopping-list/shopping-list-page";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";

export const dynamic = "force-dynamic";

// ─── Normaliser ───────────────────────────────────────────────────────────────

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
    icon:        t.icon        ?? "🔧",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#f59e0b",
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
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "Smart Shared Shopping List — Real-Time Collaborative Grocery Lists",
  description: "Create and share shopping lists instantly. One link — your family sees updates in real-time as you shop. Add items, tick things off, set budgets, and generate lists from your meal plan with AI. Free.",
  openGraph: {
    title:       "Smart Shared Shopping List | Free Tool — Isaac Paha",
    description: "Create a list, share a link, shop together in real-time. No app download. Free.",
    url:         "https://isaacpaha.com/tools/smart-shopping-list",
    type:        "website",
  },
  twitter: {
    card:    "summary_large_image",
    title:   "Smart Shared Shopping List | Free Tool",
    creator: "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/smart-shopping-list" },
  keywords: [
    "shared shopping list", "collaborative grocery list", "real-time shopping list",
    "family shopping list", "AI shopping list", "budget grocery list",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SmartShoppingListPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("smart-shopping-list"),
    getPublicTools(),
  ]);

  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  return (
    <ShoppingListPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}





// // =============================================================================
// // isaacpaha.com — Smart Shared Shopping List — Dedicated Tool Page
// // app/tools/smart-shopping-list/page.tsx
// // Route: /tools/smart-shopping-list
// // =============================================================================

// import type { Metadata }      from "next";
// import { currentUser }        from "@clerk/nextjs/server";
// import { ShoppingListPage } from "./_smart-shopping-list/shopping-list-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "Smart Shared Shopping List — Real-Time Collaborative Grocery Lists",
//   description:
//     "Create and share shopping lists instantly. One link — your family sees updates in real-time as you shop. Add items, tick things off, set budgets, and generate lists from your meal plan with AI. Free.",
//   openGraph: {
//     title:       "Smart Shared Shopping List | Free Tool — Isaac Paha",
//     description: "Create a list, share a link, shop together in real-time. No app download. Free.",
//     url:         "https://isaacpaha.com/tools/smart-shopping-list",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/shopping-list.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Smart Shared Shopping List | Free Tool",
//     description: "One link, real-time updates, AI meal planner, budget tracker. The shopping list that works for the whole family.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/smart-shopping-list" },
//   keywords: [
//     "shared shopping list", "collaborative grocery list", "real-time shopping list",
//     "family shopping list", "couple shopping list", "grocery list app",
//     "shareable shopping list", "AI shopping list", "meal plan shopping list",
//     "budget grocery list", "smart shopping list free",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default async function SmartShoppingListPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <ShoppingListPage isSignedIn={!!clerkUser} />;
// }