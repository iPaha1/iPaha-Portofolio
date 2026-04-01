// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Dedicated Tool Page
// app/tools/chemistry-engine/page.tsx
// =============================================================================

import { auth }                 from "@clerk/nextjs/server";
import { notFound }             from "next/navigation";
import { prismadb }             from "@/lib/db";
import { getToolBySlug }        from "@/lib/actions/tools-actions";
import { getPublicTools }       from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { ChemistryEnginePage } from "./_chemistry-engine/chemistry-engine-page";

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
    icon:        t.icon          ?? "🧪",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#10b981",
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

export const metadata = {
  title:       "Chemistry Understanding Engine | Isaac Paha",
  description: "Enter any chemistry topic and receive a 10-layer breakdown: plain definition, particle-level explanation, core law, history, theory, real-world applications, misconceptions corrected, and Try It experiments. GCSE, A-Level, University.",
  openGraph: {
    title:       "Chemistry Understanding Engine | Isaac Paha Tools",
    description: "Understand chemistry at the particle level. 10-layer breakdown: definition, particle model, core law, history, theory, real world, misconceptions, experiments.",
    url:         "https://isaacpaha.com/tools/chemistry-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/chemistry-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Chemistry Understanding Engine | Free Tool",
    description: "Understand any chemistry topic at the particle level. GCSE, A-Level, University. Free.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/chemistry-engine" },
  keywords: [
    "chemistry explanation tool", "GCSE chemistry help", "A-Level chemistry tutor",
    "chemistry concepts explained", "particle level chemistry", "chemistry understanding",
    "AI chemistry tutor", "free chemistry help", "atomic structure explained",
    "bonding explained", "chemistry history", "real world chemistry",
  ],
};

export default async function ChemistryEnginePageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("chemistry-engine"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  let isSignedIn = false;
  if (userId) {
    const user = await prismadb.user.findUnique({
      where:  { clerkId: userId },
      select: { id: true },
    });
    isSignedIn = !!user;
  }

  return (
    <ChemistryEnginePage
      isSignedIn={isSignedIn}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}





// // =============================================================================
// // isaacpaha.com — Chemistry Understanding Engine — Server Page
// // app/tools/chemistry-engine/page.tsx
// // =============================================================================

// import { auth }                 from "@clerk/nextjs/server";
// import { prismadb }             from "@/lib/db";
// import { ChemistryEnginePage } from "./_chemistry-engine/chemistry-engine-page";

// export const dynamic = 'force-dynamic';

// export const metadata = {
//   title:       "Chemistry Understanding Engine | Isaac Paha",
//   description: "Enter any chemistry topic and receive a 10-layer breakdown: plain definition, particle-level explanation, core law, history, theory, real-world applications, misconceptions corrected, and Try It experiments. GCSE, A-Level, University.",
// };

// export default async function ChemistryEnginePageRoute() {
//   const { userId } = await auth();

//   let isSignedIn = false;
//   if (userId) {
//     const user = await prismadb.user.findUnique({
//       where:  { clerkId: userId },
//       select: { id: true },
//     });
//     isSignedIn = !!user;
//   }

//   return <ChemistryEnginePage isSignedIn={isSignedIn} />;
// }