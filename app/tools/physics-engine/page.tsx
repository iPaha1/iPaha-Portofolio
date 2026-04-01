// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Dedicated Tool Page
// app/tools/physics-engine/page.tsx
// Route: /tools/physics-engine
// =============================================================================

import type { Metadata }    from "next";
import { currentUser }      from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { getToolBySlug }    from "@/lib/actions/tools-actions";
import { getPublicTools }   from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { PhysicsEnginePage } from "./_physics-engine/physics-engine-page";

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
    icon:        t.icon          ?? "⚛️",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#0ea5e9",
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
  title: "Physics Understanding Engine — Not Just Formulas. The Full Story.",
  description:
    "Type any physics topic and get a complete 8-layer breakdown: plain definition, governing law, why it was discovered, who discovered it, real-world applications, mental models, misconceptions corrected, and experiments to try. GCSE, A-Level, University. Free.",
  openGraph: {
    title:       "Physics Understanding Engine | Isaac Paha Tools",
    description: "Physics explained the way it should be — concept, history, why it exists, real world, intuition, misconceptions, and experiments. GCSE to University.",
    url:         "https://isaacpaha.com/tools/physics-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/physics-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Physics Understanding Engine | Free Tool",
    description: "Not just formulas — the story, the history, the why, and the real world. Free AI physics tool.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/physics-engine" },
  keywords: [
    "physics explanation tool", "GCSE physics help", "A-Level physics tutor",
    "physics concepts explained", "why does physics work", "physics understanding",
    "AI physics tutor", "free physics help", "Newton's laws explained",
    "quantum mechanics explained", "electromagnetism explained", "physics history",
    "real world physics", "physics misconceptions", "physics for beginners",
  ],
};

export default async function PhysicsEngineServerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("physics-engine"),
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
    <PhysicsEnginePage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}


// // =============================================================================
// // isaacpaha.com — Physics Understanding Engine — Server Page
// // app/tools/physics-engine/page.tsx
// // Route: /tools/physics-engine
// // =============================================================================

// import type { Metadata }    from "next";
// import { currentUser }      from "@clerk/nextjs/server";
// import { PhysicsEnginePage } from "./_physics-engine/physics-engine-page";

// export const dynamic = 'force-dynamic';

// export const metadata: Metadata = {
//   title: "Physics Understanding Engine — Not Just Formulas. The Full Story.",
//   description:
//     "Type any physics topic and get a complete 8-layer breakdown: plain definition, governing law, why it was discovered, who discovered it, real-world applications, mental models, misconceptions corrected, and experiments to try. GCSE, A-Level, University. Free.",
//   openGraph: {
//     title:       "Physics Understanding Engine | Isaac Paha Tools",
//     description: "Physics explained the way it should be — concept, history, why it exists, real world, intuition, misconceptions, and experiments. GCSE to University.",
//     url:         "https://isaacpaha.com/tools/physics-engine",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/physics-engine.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Physics Understanding Engine | Free Tool",
//     description: "Not just formulas — the story, the history, the why, and the real world. Free AI physics tool.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/physics-engine" },
//   keywords: [
//     "physics explanation tool", "GCSE physics help", "A-Level physics tutor",
//     "physics concepts explained", "why does physics work", "physics understanding",
//     "AI physics tutor", "free physics help", "Newton's laws explained",
//     "quantum mechanics explained", "electromagnetism explained", "physics history",
//     "real world physics", "physics misconceptions", "physics for beginners",
//   ],
// };

// export default async function PhysicsEngineServerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <PhysicsEnginePage isSignedIn={!!clerkUser} />;
// }