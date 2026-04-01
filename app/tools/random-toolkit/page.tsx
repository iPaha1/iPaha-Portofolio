// =============================================================================
// isaacpaha.com — Random Generator Toolkit — Dedicated Tool Page
// app/tools/random-toolkit/page.tsx
// Route: /tools/random-toolkit
// =============================================================================

import type { Metadata }        from "next";
import { notFound }             from "next/navigation";
import { getToolBySlug }        from "@/lib/actions/tools-actions";
import { getPublicTools }       from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { RandomToolkitPage } from "./_random-toolkits/random-toolkit-page";

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
    icon:        t.icon          ?? "🎲",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#8b5cf6",
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
  title: "Random Generator Toolkit — 10 Free Generators for Developers",
  description:
    "10 random generators in one toolkit: secure passwords, random strings, UUID v4, numbers, fake test data, colours, dates, Lorem ipsum, Git commit messages, and hashes (SHA-256/512). All client-side, zero data stored.",
  openGraph: {
    title:       "Random Generator Toolkit | Free Developer Tools — Isaac Paha",
    description: "10 generators: passwords, UUIDs, strings, fake data, colours, hashes, and more. All instant, all free, all in your browser.",
    url:         "https://isaacpaha.com/tools/random-toolkit",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/random-toolkit.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Random Generator Toolkit | 10 Free Developer Tools",
    description: "Passwords, UUIDs, fake data, colours, hashes + more. All instant, all free.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/random-toolkit" },
  keywords: [
    "random generator", "password generator", "uuid generator", "random string generator",
    "fake data generator", "hash generator", "sha256 generator", "random number generator",
    "random colour generator", "lorem ipsum generator", "developer tools", "free tools",
    "random picker", "git commit message generator",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RandomToolkitServerPage() {
  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("random-toolkit"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  // No auth or token tracking needed — this is a pure client-side tool
  return (
    <RandomToolkitPage
      isSignedIn={false}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}



// // =============================================================================
// // isaacpaha.com — Random Generator Toolkit — Dedicated Tool Page
// // app/tools/random-toolkit/page.tsx
// // Route: /tools/random-toolkit
// //
// // Pure server component — no auth or DB needed.
// // This tool is fully client-side with zero data persistence.
// // =============================================================================

// import type { Metadata }        from "next";
// import { RandomToolkitPage } from "./_random-toolkits/random-toolkit-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "Random Generator Toolkit — 10 Free Generators for Developers",
//   description:
//     "10 random generators in one toolkit: secure passwords, random strings, UUID v4, numbers, fake test data, colours, dates, Lorem ipsum, Git commit messages, and hashes (SHA-256/512). All client-side, zero data stored.",
//   openGraph: {
//     title:       "Random Generator Toolkit | Free Developer Tools — Isaac Paha",
//     description: "10 generators: passwords, UUIDs, strings, fake data, colours, hashes, and more. All instant, all free, all in your browser.",
//     url:         "https://isaacpaha.com/tools/random-toolkit",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/random-toolkit.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Random Generator Toolkit | 10 Free Developer Tools",
//     description: "Passwords, UUIDs, fake data, colours, hashes + more. All instant, all free.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/random-toolkit" },
//   keywords: [
//     "random generator", "password generator", "uuid generator", "random string generator",
//     "fake data generator", "hash generator", "sha256 generator", "random number generator",
//     "random colour generator", "lorem ipsum generator", "developer tools", "free tools",
//     "random picker", "git commit message generator",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function RandomToolkit() {
//   // No auth or DB prefetch needed — this is a pure client-side tool
//   return <RandomToolkitPage />;
// }