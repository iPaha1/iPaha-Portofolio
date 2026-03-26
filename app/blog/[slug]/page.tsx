// =============================================================================
// isaacpaha.com — Individual Blog Post Page
// app/blog/[slug]/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "@/lib/data/blog-data";
import { BlogPostClient } from "../_blog/blog-post-client";


interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.filter((p) => p.status === "PUBLISHED").map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find(
    (p) => p.slug === slug && p.status === "PUBLISHED"
  );
  if (!post) return {};

  return {
    title: `${post.title} — Isaac Paha`,
    description: post.excerpt,
    authors: [{ name: "Isaac Paha", url: "https://www.isaacpaha.com" }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.isaacpaha.com/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: ["Isaac Paha"],
      tags: post.tags,
    },
    twitter: {
      title: post.title,
      description: post.excerpt,
      card: "summary_large_image",
      creator: "@iPaha3",
    },
    alternates: {
      canonical: `https://www.isaacpaha.com/blog/${post.slug}`,
    },
    keywords: post.tags,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find(
    (p) => p.slug === slug && p.status === "PUBLISHED"
  );
  if (!post) notFound();

  const related = BLOG_POSTS.filter(
    (p) =>
      p.id !== post.id &&
      p.status === "PUBLISHED" &&
      (p.category === post.category ||
        p.tags.some((t) => post.tags.includes(t)))
  ).slice(0, 3);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: "Isaac Paha",
      url: "https://www.isaacpaha.com",
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    publisher: {
      "@type": "Person",
      name: "Isaac Paha",
    },
    keywords: post.tags.join(", "),
    url: `https://www.isaacpaha.com/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} related={related} />
    </>
  );
}