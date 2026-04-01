// =============================================================================
// isaacpaha.com — Math Understanding Engine — Dedicated Tool Page
// app/tools/math-engine/page.tsx
// Route: /tools/math-engine
// =============================================================================

import type { Metadata } from "next";
import { currentUser }   from "@clerk/nextjs/server";
import { notFound }      from "next/navigation";
import { getToolBySlug } from "@/lib/actions/tools-actions";
import { getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { MathEnginePage } from "./_math-engine/math-engine-page";

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
    icon:        t.icon          ?? "🧠",
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

export const metadata: Metadata = {
  title: "Math Understanding Engine — Step-by-Step Maths Explained",
  description:
    "Paste any maths question and get a complete breakdown: step-by-step solution, why the method works, the history behind the concept, real-world applications, and interactive graphs. GCSE, A-Level, University. Free.",
  openGraph: {
    title:       "Math Understanding Engine | Isaac Paha Tools",
    description: "Not just the answer — the why, the history, and where it's used in real life. Free AI maths tool for GCSE, A-Level, and University.",
    url:         "https://isaacpaha.com/tools/math-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/math-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Math Understanding Engine | Free Tool",
    description: "Understand any maths question — not just the answer, but the why, history, and real world.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/math-engine" },
  keywords: [
    "maths explanation tool", "GCSE maths help", "A-Level maths tutor",
    "step by step maths", "why does maths work", "maths understanding",
    "AI maths tutor", "free maths help", "quadratic equations explained",
    "calculus explained", "maths history", "real world maths",
  ],
};

export default async function MathEngineServerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("math-engine"),
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
    <MathEnginePage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}


// // =============================================================================
// // isaacpaha.com — Math Understanding Engine — Server Page
// // app/tools/math-engine/page.tsx
// // Route: /tools/math-engine
// // =============================================================================

// import type { Metadata } from "next";
// import { currentUser }   from "@clerk/nextjs/server";
// import { MathEnginePage } from "./_math-engine/math-engine-page";


// export const metadata: Metadata = {
//   title: "Math Understanding Engine — Step-by-Step Maths Explained",
//   description:
//     "Paste any maths question and get a complete breakdown: step-by-step solution, why the method works, the history behind the concept, real-world applications, and interactive graphs. GCSE, A-Level, University. Free.",
//   openGraph: {
//     title:       "Math Understanding Engine | Isaac Paha Tools",
//     description: "Not just the answer — the why, the history, and where it's used in real life. Free AI maths tool for GCSE, A-Level, and University.",
//     url:         "https://isaacpaha.com/tools/math-engine",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/math-engine.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Math Understanding Engine | Free Tool",
//     description: "Understand any maths question — not just the answer, but the why, history, and real world.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/math-engine" },
//   keywords: [
//     "maths explanation tool", "GCSE maths help", "A-Level maths tutor",
//     "step by step maths", "why does maths work", "maths understanding",
//     "AI maths tutor", "free maths help", "quadratic equations explained",
//     "calculus explained", "maths history", "real world maths",
//   ],
// };

// export default async function MathEnginePage_() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <MathEnginePage isSignedIn={!!clerkUser} />;
// }