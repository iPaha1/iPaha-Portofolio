// =============================================================================
// isaacpaha.com — /apps/[slug] page
// app/apps/[slug]/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APPS } from "@/lib/data/apps-data";
import { AppDetailClient } from "../_apps/app-detail-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return APPS.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
  const app = APPS.find(a => a.slug === slug);
  if (!app) return {};

  return {
    title: `${app.name} — ${app.tagline} | Isaac Paha`,
    description: app.description,
    openGraph: {
      title: `${app.name} | Isaac Paha`,
      description: app.description,
      url: `https://www.isaacpaha.com/apps/${app.slug}`,
      type: "website",
    },
    twitter: {
      title: `${app.name} | Isaac Paha`,
      description: app.description,
      card: "summary_large_image",
      creator: "@iPaha3",
    },
    alternates: {
      canonical: `https://www.isaacpaha.com/apps/${app.slug}`,
    },
    keywords: [
      app.name,
      app.category,
      app.status,
      ...app.techStack.map(t => t.name),
      "Isaac Paha",
      "app",
    ],
  };
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const app = APPS.find(a => a.slug === slug);
  if (!app) notFound();

  // Related: same company first, then same category
  const related = [
    ...APPS.filter(a => a.id !== app.id && a.company === app.company),
    ...APPS.filter(a => a.id !== app.id && a.company !== app.company && a.category === app.category),
  ].slice(0, 3);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.description,
    url: app.liveUrl,
    applicationCategory: app.category,
    operatingSystem: "Web",
    author: {
      "@type": "Person",
      name: "Isaac Paha",
      url: "https://www.isaacpaha.com",
    },
    offers: {
      "@type": "Offer",
      availability:
        app.status === "LIVE"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppDetailClient app={app} related={related} />
    </>
  );
}