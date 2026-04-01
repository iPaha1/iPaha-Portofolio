// =============================================================================
// isaacpaha.com — Individual Blog Post Page (Server Component)
// app/blog/[slug]/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DBPostFull, DBPost } from "@/lib/types/blog";
import { parseTags } from "@/lib/types/blog";
import { BlogPostClient } from "../_blog/blog-post-client";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface PostPageData {
  post:    DBPostFull;
  related: DBPost[];
}

// app/blog/[slug]/page.tsx
async function getPost(slug: string): Promise<PostPageData | null> {
  try {
    const res = await fetch(`${BASE}/api/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const post = data.post as DBPostFull;

    // Fetch related posts (same category or recent posts)
    let related: DBPost[] = []; // Initialize as empty array
    
    try {
      const relatedRes = await fetch(
        `${BASE}/api/blog?pageSize=6&sort=latest`,
        { next: { revalidate: 300 } }
      );

      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        // Filter out current post and limit to 3-6
        related = (relatedData.posts || [])
          .filter((p: DBPost) => p.slug !== slug)
          .slice(0, 6);
      }
    } catch (error) {
      console.error("Failed to fetch related posts:", error);
      // Keep related as empty array
    }

    return { post, related };
  } catch (error) {
    console.error("Failed to fetch post data:", error);
    return null;
  }
}

// ─── Dynamic SEO metadata ────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: "Post not found" };

  const { post } = data;
  const tags      = parseTags(post.tags);
  const title     = post.metaTitle     ?? post.title;
  const desc      = post.metaDescription ?? post.excerpt;
  const canonical = post.canonicalUrl  ?? `https://www.isaacpaha.com/blog/${post.slug}`;
  const ogImage   = post.ogImage ?? post.coverImage ?? "https://www.isaacpaha.com/og-default.jpg";

  return {
    title:       `${title} — Isaac Paha`,
    description: desc,
    keywords:    post.keywords
      ? post.keywords.split(",").map((k) => k.trim())
      : tags,
    authors:     [{ name: post.authorName, url: "https://www.isaacpaha.com/about" }],
    openGraph: {
      title,
      description: desc,
      url:         canonical,
      type:        "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime:  post.updatedAt   ? new Date(post.updatedAt).toISOString()   : undefined,
      authors:     ["Isaac Paha"],
      tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.coverImageAlt ?? title }],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description: desc,
      creator:     "@iPaha3",
      images:      [ogImage],
    },
    alternates: {
      canonical,
    },
  };
}

// ─── JSON-LD structured data ─────────────────────────────────────────────────

function ArticleJsonLd({ post }: { post: DBPostFull }) {
  const tags    = parseTags(post.tags);
  const ogImage = post.ogImage ?? post.coverImage ?? "https://www.isaacpaha.com/og-default.jpg";

  const schema = {
    "@context":         "https://schema.org",
    "@type":            "Article",
    headline:           post.title,
    description:        post.excerpt,
    image:              ogImage,
    datePublished:      post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified:       post.updatedAt   ? new Date(post.updatedAt).toISOString()   : undefined,
    author: {
      "@type": "Person",
      name:    post.authorName,
      url:     "https://www.isaacpaha.com/about",
    },
    publisher: {
      "@type": "Organization",
      name:    "Isaac Paha",
      url:     "https://www.isaacpaha.com",
      logo: {
        "@type": "ImageObject",
        url:     "https://www.isaacpaha.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "@WebPage",
      "@id":   `https://www.isaacpaha.com/blog/${post.slug}`,
    },
    keywords:       tags.join(", "),
    articleSection: post.category?.name,
    wordCount:      post.wordCount,
    timeRequired:   `PT${post.readingTimeMinutes}M`,
    interactionStatistic: [
      {
        "@type":                "InteractionCounter",
        interactionType:        "https://schema.org/ReadAction",
        userInteractionCount:   post.viewCount,
      },
      {
        "@type":                "InteractionCounter",
        interactionType:        "https://schema.org/LikeAction",
        userInteractionCount:   post.likeCount,
      },
      {
        "@type":                "InteractionCounter",
        interactionType:        "https://schema.org/CommentAction",
        userInteractionCount:   post.commentCount,
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await getPost(slug);
  console.log("Fetched post data for slug:", slug, data);
  if (!data) notFound();

  return (
    <>
      <ArticleJsonLd post={data.post} />
      <BlogPostClient post={data.post} related={data.related} />
    </>
  );
}

// Pre-render nothing at build time — all posts rendered on demand and cached
export const dynamic = "force-dynamic";





// // =============================================================================
// // isaacpaha.com — Individual Blog Post Page
// // app/blog/[slug]/page.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { notFound } from "next/navigation";
// import { BLOG_POSTS } from "@/lib/data/blog-data";
// import { BlogPostClient } from "../_blog/blog-post-client";


// interface Props {
//   params: Promise<{ slug: string }>;
// }

// export async function generateStaticParams() {
//   return BLOG_POSTS.filter((p) => p.status === "PUBLISHED").map((p) => ({
//     slug: p.slug,
//   }));
// }

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const { slug } = await params;
//   const post = BLOG_POSTS.find(
//     (p) => p.slug === slug && p.status === "PUBLISHED"
//   );
//   if (!post) return {};

//   return {
//     title: `${post.title} — Isaac Paha`,
//     description: post.excerpt,
//     authors: [{ name: "Isaac Paha", url: "https://www.isaacpaha.com" }],
//     openGraph: {
//       title: post.title,
//       description: post.excerpt,
//       url: `https://www.isaacpaha.com/blog/${post.slug}`,
//       type: "article",
//       publishedTime: post.publishedAt,
//       modifiedTime: post.updatedAt ?? post.publishedAt,
//       authors: ["Isaac Paha"],
//       tags: post.tags,
//     },
//     twitter: {
//       title: post.title,
//       description: post.excerpt,
//       card: "summary_large_image",
//       creator: "@iPaha3",
//     },
//     alternates: {
//       canonical: `https://www.isaacpaha.com/blog/${post.slug}`,
//     },
//     keywords: post.tags,
//   };
// }

// export default async function BlogPostPage({ params }: Props) {
//   const { slug } = await params;
//   const post = BLOG_POSTS.find(
//     (p) => p.slug === slug && p.status === "PUBLISHED"
//   );
//   if (!post) notFound();

//   const related = BLOG_POSTS.filter(
//     (p) =>
//       p.id !== post.id &&
//       p.status === "PUBLISHED" &&
//       (p.category === post.category ||
//         p.tags.some((t) => post.tags.includes(t)))
//   ).slice(0, 3);

//   // JSON-LD structured data
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "BlogPosting",
//     headline: post.title,
//     description: post.excerpt,
//     author: {
//       "@type": "Person",
//       name: "Isaac Paha",
//       url: "https://www.isaacpaha.com",
//     },
//     datePublished: post.publishedAt,
//     dateModified: post.updatedAt ?? post.publishedAt,
//     publisher: {
//       "@type": "Person",
//       name: "Isaac Paha",
//     },
//     keywords: post.tags.join(", "),
//     url: `https://www.isaacpaha.com/blog/${post.slug}`,
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />
//       <BlogPostClient post={post} related={related} />
//     </>
//   );
// }