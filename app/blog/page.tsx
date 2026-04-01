// =============================================================================
// isaacpaha.com — Blog Page (Server Component)
// app/blog/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { BlogClient } from "./_blog/blog-client";
import type { DBPost, DBCategory, DBPostFull } from "@/lib/types/blog";

export const metadata: Metadata = {
  title: "Blog — Essays on Technology, Business, Africa & Life",
  description:
    "Isaac Paha's writing on technology, startups, AI, Africa, education, and life. Thoughtful long-form essays for builders, founders, and curious minds.",
  openGraph: {
    title: "Blog | Isaac Paha",
    description:
      "Long-form essays on technology, startups, AI, Africa, and life.",
    url: "https://www.isaacpaha.com/blog",
    type: "website",
  },
  twitter: {
    title: "Blog | Isaac Paha",
    description:
      "Long-form essays on technology, startups, AI, Africa, and life.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/blog",
  },
  keywords: [
    "Isaac Paha blog",
    "technology essays",
    "Africa tech",
    "startup insights",
    "AI future",
    "software engineering",
  ],
};

// Revalidate every 5 minutes — keeps stats fresh without hammering the DB
export const revalidate = 300;

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface BlogPageData {
  posts:          DBPost[];
  total:          number;
  categories:     DBCategory[];
  featuredPost:   Partial<DBPostFull> | null;
  totalPosts:     number;
  totalViews:     number;
  editorPickCount: number;
  trending:       DBPost[];
  editorsPicks:   DBPost[];
}

async function getBlogPageData(): Promise<BlogPageData> {
  const [listRes, statsRes, sidebarRes] = await Promise.all([
    fetch(`${BASE}/api/blog?pageSize=50&sort=latest`, { next: { revalidate: 300 } }),
    fetch(`${BASE}/api/blog/stats`,                   { next: { revalidate: 300 } }),
    fetch(`${BASE}/api/blog/sidebar`,                 { next: { revalidate: 300 } }),
  ]);

  const [list, stats, sidebar] = await Promise.all([
    listRes.ok   ? listRes.json()    : { posts: [], total: 0, categories: [] },
    statsRes.ok  ? statsRes.json()   : { totalPosts: 0, totalViews: 0, editorPickCount: 0, featuredPost: null },
    sidebarRes.ok ? sidebarRes.json() : { trending: [], editorsPicks: [] },
  ]);

  return {
    posts:           list.posts       ?? [],
    total:           list.total       ?? 0,
    categories:      list.categories  ?? [],
    featuredPost:    stats.featuredPost   ?? null,
    totalPosts:      stats.totalPosts     ?? 0,
    totalViews:      stats.totalViews     ?? 0,
    editorPickCount: stats.editorPickCount ?? 0,
    trending:        sidebar.trending     ?? [],
    editorsPicks:    sidebar.editorsPicks ?? [],
  };
}

export default async function BlogPage() {
  const data = await getBlogPageData();
  // console.log("Fetched blog page data:", data);
  console.log("length of posts:", data.posts.length);
  console.log("All categories:", data.categories.map(c => c.name)); 
  return <BlogClient {...data} />;
}







// // =============================================================================
// // isaacpaha.com — Blog Page
// // app/blog/page.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { BlogClient } from "./_blog/blog-client";


// export const metadata: Metadata = {
//   title: "Blog — Essays on Technology, Business, Africa & Life",
//   description:
//     "Isaac Paha's writing on technology, startups, AI, Africa, education, and life. Thoughtful long-form essays for builders, founders, and curious minds.",
//   openGraph: {
//     title: "Blog | Isaac Paha",
//     description:
//       "Long-form essays on technology, startups, AI, Africa, and life.",
//     url: "https://www.isaacpaha.com/blog",
//     type: "website",
//   },
//   twitter: {
//     title: "Blog | Isaac Paha",
//     description:
//       "Long-form essays on technology, startups, AI, Africa, and life.",
//     card: "summary_large_image",
//     creator: "@iPaha3",
//   },
//   alternates: {
//     canonical: "https://www.isaacpaha.com/blog",
//   },
//   keywords: [
//     "Isaac Paha blog",
//     "technology essays",
//     "Africa tech",
//     "startup insights",
//     "AI future",
//     "software engineering",
//   ],
// };

// export default function BlogPage() {
//   return <BlogClient />;
// }