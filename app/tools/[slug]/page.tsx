// =============================================================================
// isaacpaha.com — Individual Tool Page
// app/tools/[slug]/page.tsx
// =============================================================================

import { TOOLS } from "@/lib/data/tools-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolDetailClient } from "../_tools/tool-detail-client";

const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered for SEO and structured data purposes.
interface Props {
  params: Promise<{ slug: string }>;
}

// Tools with dedicated routes are excluded from the [slug] catch-all.
// Their dedicated pages at /tools/[tool-name]/page.tsx take precedence.
const DEDICATED_ROUTES = new Set(["job-application-tracker", "ai-cv-analyser", 
  "qr-code-generator", "random-toolkit", "debt-recovery-planner", "smart-budget-planner", 
  "first-home-planner", "smart-shopping-list", "scripture-explorer", "math-engine", 
  "physics-engine", "chemistry-engine", "message-rewriter", "kids-birthday-planner" ]);
  
export async function generateStaticParams() {
  return TOOLS
    .filter((t) => t.status !== "COMING_SOON" && !DEDICATED_ROUTES.has(t.slug))
    .map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — Free ${tool.category} Tool`,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | Isaac Paha Tools`,
      description: tool.tagline,
      url: `https://www.isaacpaha.com/tools/${tool.slug}`,
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
}

export default async function ToolPage({ params }: Props) {
    const { slug } = await params;

  // Dedicated routes should never fall through to here — but guard anyway
  if (DEDICATED_ROUTES.has(slug)) notFound();
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool || tool.status === "COMING_SOON") notFound();

  const related = TOOLS.filter(
    (t) => t.id !== tool.id && t.category === tool.category && t.status !== "COMING_SOON"
  ).slice(0, 3);

  return <ToolDetailClient tool={tool} related={related} />;
}




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