// =============================================================================
// isaacpaha.com — Individual Idea Page (Server Component)
// app/ideas/[slug]/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismadb } from "@/lib/db";
import { IdeaDetailClient } from "../_ideas/idea-detail-client";
import type { DBIdeaFull, DBIdea } from "@/lib/types/idea";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Prisma selects ───────────────────────────────────────────────────────────

const FULL_SELECT = {
  id:              true,
  slug:            true,
  title:           true,
  summary:         true,
  content:         true,
  coverImage:      true,
  category:        true,
  status:          true,
  tags:            true,
  isPublished:     true,
  publishedAt:     true,
  isFeatured:      true,
  viewCount:       true,
  likeCount:       true,
  commentCount:    true,
  metaTitle:       true,
  metaDescription: true,
  createdAt:       true,
  updatedAt:       true,
} as const;

const LIST_SELECT = {
  id:          true,
  slug:        true,
  title:       true,
  summary:     true,
  coverImage:  true,
  category:    true,
  status:      true,
  tags:        true,
  isPublished: true,
  publishedAt: true,
  isFeatured:  true,
  viewCount:   true,
  likeCount:   true,
  commentCount:true,
} as const;

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function getIdeaData(slug: string): Promise<{
  idea:    DBIdeaFull;
  related: DBIdea[];
} | null> {
  const idea = await prismadb.idea.findFirst({
    where:  { slug, isPublished: true },
    select: FULL_SELECT,
  });

  if (!idea) return null;

  // Related: same category, exclude self, up to 3
  const related = await prismadb.idea.findMany({
    where: {
      isPublished: true,
      category:    idea.category,
      id:          { not: idea.id },
    },
    orderBy: { publishedAt: "desc" },
    take:    3,
    select:  LIST_SELECT,
  });

  // Fire-and-forget view increment
  prismadb.idea.update({
    where: { id: idea.id },
    data:  { viewCount: { increment: 1 } },
  }).catch(() => {});

  return { idea: idea as DBIdeaFull, related: related as DBIdea[] };
}

// ─── Dynamic SEO metadata ─────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getIdeaData(slug);
  if (!data) return { title: "Idea not found" };

  const { idea } = data;
  const title = idea.metaTitle    ?? idea.title;
  const desc  = idea.metaDescription ?? idea.summary;

  return {
    title:       `${title} — Ideas Lab | Isaac Paha`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url:         `https://www.isaacpaha.com/ideas/${idea.slug}`,
      type:        "article",
      publishedTime: idea.publishedAt
        ? new Date(idea.publishedAt).toISOString()
        : undefined,
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description: desc,
      creator:     "@iPaha3",
    },
    alternates: { canonical: `https://www.isaacpaha.com/ideas/${idea.slug}` },
  };
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function IdeaJsonLd({ idea }: { idea: DBIdeaFull }) {
  const schema = {
    "@context":    "https://schema.org",
    "@type":       "Article",
    headline:      idea.title,
    description:   idea.summary,
    datePublished: idea.publishedAt
      ? new Date(idea.publishedAt).toISOString()
      : undefined,
    dateModified:  new Date(idea.updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name:    "Isaac Paha",
      url:     "https://www.isaacpaha.com/about",
    },
    publisher: {
      "@type": "Organization",
      name:    "Isaac Paha",
      url:     "https://www.isaacpaha.com",
    },
    mainEntityOfPage: {
      "@type": "@WebPage",
      "@id":   `https://www.isaacpaha.com/ideas/${idea.slug}`,
    },
    interactionStatistic: [
      {
        "@type":              "InteractionCounter",
        interactionType:      "https://schema.org/ReadAction",
        userInteractionCount: idea.viewCount,
      },
      {
        "@type":              "InteractionCounter",
        interactionType:      "https://schema.org/LikeAction",
        userInteractionCount: idea.likeCount,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IdeaPage({ params }: Props) {
  const { slug } = await params;
  const data = await getIdeaData(slug);
  if (!data) notFound();

  return (
    <>
      <IdeaJsonLd idea={data.idea} />
      <IdeaDetailClient idea={data.idea} related={data.related} />
    </>
  );
}





// // =============================================================================
// // isaacpaha.com — Individual Idea Page
// // app/ideas/[slug]/page.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { notFound } from "next/navigation";
// import { IDEAS } from "@/lib/data/ideas-data";
// import { IdeaDetailClient } from "../_ideas/idea-detail-client";

// const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered for SEO and structured data purposes.
// interface Props {
//   params: Promise<{ slug: string }>;
// }

// export async function generateStaticParams() {
//   return IDEAS.map((i) => ({ slug: i.slug }));
// }

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//     const { slug } = await params;
//   const idea = IDEAS.find((i) => i.slug === slug);
//   if (!idea) return {};
//   return {
//     title: `${idea.title} — Ideas Lab`,
//     description: idea.summary,
//     openGraph: {
//       title: idea.title,
//       description: idea.summary,
//       url: `https://www.isaacpaha.com/ideas/${idea.slug}`,
//     },
//     alternates: { canonical: `https://www.isaacpaha.com/ideas/${idea.slug}` },
//   };
// }

// export default async function IdeaPage({ params }: Props) {
//   const { slug } = await params;
//   const idea = IDEAS.find((i) => i.slug === slug);
//   if (!idea) notFound();

//   const related = IDEAS.filter(
//     (i) => i.id !== idea.id && i.category === idea.category
//   ).slice(0, 3);

//   return <IdeaDetailClient idea={idea} related={related} />;
// }