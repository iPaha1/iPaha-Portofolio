// =============================================================================
// isaacpaha.com — Individual Idea Page
// app/ideas/[slug]/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IDEAS } from "@/lib/data/ideas-data";
import { IdeaDetailClient } from "../_ideas/idea-detail-client";


interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return IDEAS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
  const idea = IDEAS.find((i) => i.slug === slug);
  if (!idea) return {};
  return {
    title: `${idea.title} — Ideas Lab`,
    description: idea.summary,
    openGraph: {
      title: idea.title,
      description: idea.summary,
      url: `https://www.isaacpaha.com/ideas/${idea.slug}`,
    },
    alternates: { canonical: `https://www.isaacpaha.com/ideas/${idea.slug}` },
  };
}

export default async function IdeaPage({ params }: Props) {
  const { slug } = await params;
  const idea = IDEAS.find((i) => i.slug === slug);
  if (!idea) notFound();

  const related = IDEAS.filter(
    (i) => i.id !== idea.id && i.category === idea.category
  ).slice(0, 3);

  return <IdeaDetailClient idea={idea} related={related} />;
}