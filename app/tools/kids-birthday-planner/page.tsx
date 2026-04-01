// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Dedicated Tool Page
// app/tools/kids-birthday-planner/page.tsx
// Route: /tools/kids-birthday-planner
// =============================================================================

import type { Metadata }        from "next";
import { currentUser }          from "@clerk/nextjs/server";
import { notFound }             from "next/navigation";
import { getToolBySlug }        from "@/lib/actions/tools-actions";
import { getPublicTools }       from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { BirthdayPlannerPage } from "./_birthday-planner/birthday-planner-page";

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
    icon:        t.icon          ?? "🎂",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#f43f5e",
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
  title:       "AI Kids Birthday Planner — Perfect Party in Minutes",
  description:
    "Plan your child's perfect birthday party in minutes. AI generates a complete party plan — schedule, activities, food, music, party bags, and budget. Then share a smart invite link that evolves into a live RSVP tracker and check-in system on party day.",
  openGraph: {
    title:       "AI Kids Birthday Planner | Isaac Paha Tools",
    description: "Plan your child's perfect birthday party in minutes. Smart invites, live RSVPs, activity timers, and party day check-in — all from one link.",
    url:         "https://isaacpaha.com/tools/kids-birthday-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/kids-birthday-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AI Kids Birthday Planner | Free Tool",
    description: "Plan a perfect kids party in minutes — AI plan + smart invite links that become a live check-in system on party day.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/kids-birthday-planner" },
  keywords: [
    "kids birthday party planner", "birthday party ideas", "birthday party planning app",
    "RSVP party invite link", "birthday party checklist", "kids party activities",
    "party budget planner", "birthday party AI", "free party planner",
    "kids party food ideas", "party day check-in", "birthday party organiser UK",
    "children's party planner", "party invite generator", "birthday party themes",
  ],
};

export default async function KidsBirthdayPlannerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("kids-birthday-planner"),
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
    <BirthdayPlannerPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}


// // =============================================================================
// // isaacpaha.com — AI Kids Birthday Planner — Main Server Page
// // app/tools/kids-birthday-planner/page.tsx
// // Route: /tools/kids-birthday-planner
// // =============================================================================

// import type { Metadata }        from "next";
// import { currentUser }          from "@clerk/nextjs/server";
// import { BirthdayPlannerPage } from "./_birthday-planner/birthday-planner-page";

// export const dynamic = 'force-dynamic';

// export const metadata: Metadata = {
//   title:       "AI Kids Birthday Planner — Perfect Party in Minutes",
//   description:
//     "Plan your child's perfect birthday party in minutes. AI generates a complete party plan — schedule, activities, food, music, party bags, and budget. Then share a smart invite link that evolves into a live RSVP tracker and check-in system on party day.",
//   openGraph: {
//     title:       "AI Kids Birthday Planner | Isaac Paha Tools",
//     description: "Plan your child's perfect birthday party in minutes. Smart invites, live RSVPs, activity timers, and party day check-in — all from one link.",
//     url:         "https://isaacpaha.com/tools/kids-birthday-planner",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/kids-birthday-planner.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "AI Kids Birthday Planner | Free Tool",
//     description: "Plan a perfect kids party in minutes — AI plan + smart invite links that become a live check-in system on party day.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/kids-birthday-planner" },
//   keywords: [
//     "kids birthday party planner", "birthday party ideas", "birthday party planning app",
//     "RSVP party invite link", "birthday party checklist", "kids party activities",
//     "party budget planner", "birthday party AI", "free party planner",
//     "kids party food ideas", "party day check-in", "birthday party organiser UK",
//     "children's party planner", "party invite generator", "birthday party themes",
//   ],
// };

// export default async function KidsBirthdayPlannerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <BirthdayPlannerPage isSignedIn={!!clerkUser} />;
// }