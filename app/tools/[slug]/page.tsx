// =============================================================================
// isaacpaha.com — Individual Tool Page (Catch-all for tools without dedicated pages)
// app/tools/[slug]/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ToolDetailClient } from "../_tools/tool-detail-client";
import { getToolBySlug } from "@/lib/actions/tools-actions";
import { getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";

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
    icon:        t.icon          ?? "🔧",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#f59e0b",
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
    buildTime:   t.buildTime     ?? undefined,
  };
}

// Tools with dedicated routes are excluded from the [slug] catch-all.
// Their dedicated pages at /tools/[tool-name]/page.tsx take precedence.
const DEDICATED_ROUTES = new Set([
  "job-application-tracker",
  "ai-cv-analyser",
  "qr-code-generator",
  "random-toolkit",
  "debt-recovery-planner",
  "smart-budget-planner",
  "first-home-planner",
  "smart-shopping-list",
  "scripture-explorer",
  "math-engine",
  "physics-engine",
  "chemistry-engine",
  "message-rewriter",
  "kids-birthday-planner",
]);

// ─── Generate static params for all non-dedicated tools ───────────────────────
// Note: Since we're now fetching from DB, this would need to fetch all tools
// at build time. However, for a dynamic site, we can either:
// 1. Keep the static generation using hardcoded list (faster build)
// 2. Fetch from DB at build time (slower build but more accurate)
// We'll keep using the hardcoded TOOLS array for static params since it's
// just for generating routes and doesn't affect runtime data.
export async function generateStaticParams() {
  // Import TOOLS from data file for static generation only
  const { TOOLS } = await import("@/lib/data/tools-data");
  return TOOLS
    .filter((t) => t.status !== "COMING_SOON" && !DEDICATED_ROUTES.has(t.slug))
    .map((t) => ({ slug: t.slug }));
}

// ─── Metadata generation ──────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  // Dedicated routes should not use this metadata generator
  if (DEDICATED_ROUTES.has(slug)) {
    return {};
  }

  try {
    const rawTool = await getToolBySlug(slug);
    if (!rawTool || !rawTool.isActive || !rawTool.isPublic) return {};

    const tool = normalise(rawTool);

    return {
      title: `${tool.name} — Free ${tool.category} Tool | Isaac Paha`,
      description: tool.description,
      openGraph: {
        title: `${tool.name} | Isaac Paha Tools`,
        description: tool.tagline,
        url: `https://www.isaacpaha.com/tools/${tool.slug}`,
        type: "website",
        images: tool.coverImage ? [{ url: tool.coverImage }] : undefined,
      },
      twitter: {
        title: `${tool.name} | Isaac Paha Tools`,
        description: tool.tagline,
        card: "summary_large_image",
      },
      alternates: {
        canonical: `https://www.isaacpaha.com/tools/${tool.slug}`,
      },
    };
  } catch {
    return {};
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────
interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const clerkUser = await currentUser().catch(() => null);

  // Dedicated routes should never fall through to here — but guard anyway
  if (DEDICATED_ROUTES.has(slug)) notFound();

  // Fetch tool from database
  const [rawTool, allTools] = await Promise.all([
    getToolBySlug(slug),
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
    <ToolDetailClient
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}


// // =============================================================================
// // isaacpaha.com — Individual Tool Page
// // app/tools/[slug]/page.tsx
// // =============================================================================

// import { TOOLS } from "@/lib/data/tools-data";
// import type { Metadata } from "next";
// import { notFound } from "next/navigation";
// import { ToolDetailClient } from "../_tools/tool-detail-client";

// const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered for SEO and structured data purposes.
// interface Props {
//   params: Promise<{ slug: string }>;
// }

// // Tools with dedicated routes are excluded from the [slug] catch-all.
// // Their dedicated pages at /tools/[tool-name]/page.tsx take precedence.
// const DEDICATED_ROUTES = new Set(["job-application-tracker", "ai-cv-analyser", 
//   "qr-code-generator", "random-toolkit", "debt-recovery-planner", "smart-budget-planner", 
//   "first-home-planner", "smart-shopping-list", "scripture-explorer", "math-engine", 
//   "physics-engine", "chemistry-engine", "message-rewriter", "kids-birthday-planner" ]);
  
// export async function generateStaticParams() {
//   return TOOLS
//     .filter((t) => t.status !== "COMING_SOON" && !DEDICATED_ROUTES.has(t.slug))
//     .map((t) => ({ slug: t.slug }));
// }

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//     const { slug } = await params;

//   const tool = TOOLS.find((t) => t.slug === slug);
//   if (!tool) return {};
//   return {
//     title: `${tool.name} — Free ${tool.category} Tool`,
//     description: tool.description,
//     openGraph: {
//       title: `${tool.name} | Isaac Paha Tools`,
//       description: tool.tagline,
//       url: `https://www.isaacpaha.com/tools/${tool.slug}`,
//     },
//     twitter: {
//       title: `${tool.name} | Isaac Paha Tools`,
//       description: tool.tagline,
//       card: "summary_large_image",
//     },
//     alternates: {
//       canonical: `https://www.isaacpaha.com/tools/${tool.slug}`,
//     },
//   };
// }

// export default async function ToolPage({ params }: Props) {
//     const { slug } = await params;

//   // Dedicated routes should never fall through to here — but guard anyway
//   if (DEDICATED_ROUTES.has(slug)) notFound();
//   const tool = TOOLS.find((t) => t.slug === slug);
//   if (!tool || tool.status === "COMING_SOON") notFound();

//   const related = TOOLS.filter(
//     (t) => t.id !== tool.id && t.category === tool.category && t.status !== "COMING_SOON"
//   ).slice(0, 3);

//   return <ToolDetailClient tool={tool} related={related} />;
// }




// // =============================================================================
// // isaacpaha.com — Individual Tool Page
// // app/tools/[slug]/page.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { notFound } from "next/navigation";
// import { TOOLS } from "@/lib/data/tools-data";
// import { ToolDetailClient } from "../_tools/tool-detail-client";


// interface Props {
//   params: Promise<{ slug: string }>;
// }

// export async function generateStaticParams() {
//   return TOOLS.filter((t) => t.status !== "COMING_SOON").map((t) => ({
//     slug: t.slug,
//   }));
// }

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//     const { slug } = await params;
//   const tool = TOOLS.find((t) => t.slug === slug);
//   if (!tool) return {};
//   return {
//     title: `${tool.name} — Free ${tool.category} Tool`,
//     description: tool.description,
//     openGraph: {
//       title: `${tool.name} | Isaac Paha Tools`,
//       description: tool.tagline,
//       url: `https://www.isaacpaha.com/tools/${tool.slug}`,
//     },
//     twitter: {
//       title: `${tool.name} | Isaac Paha Tools`,
//       description: tool.tagline,
//       card: "summary_large_image",
//     },
//     alternates: {
//       canonical: `https://www.isaacpaha.com/tools/${tool.slug}`,
//     },
//   };
// }

// export default async function ToolPage({ params }: Props) {
//   const { slug } = await params;
//   const tool = TOOLS.find((t) => t.slug === slug);
//   if (!tool || tool.status === "COMING_SOON") notFound();

//   const related = TOOLS.filter(
//     (t) => t.id !== tool.id && t.category === tool.category && t.status !== "COMING_SOON"
//   ).slice(0, 3);

//   return <ToolDetailClient tool={tool} related={related} />;
// }