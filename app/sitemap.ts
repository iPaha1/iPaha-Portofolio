// =============================================================================
// app/sitemap.ts — Dynamic XML Sitemap
// Covers all public routes with correct priorities and changefreq.
// Fetches dynamic routes (blog, apps, tools, ideas) from the DB so
// every piece of content is indexed automatically on deploy.
// =============================================================================

import type { MetadataRoute } from "next";
import { prismadb } from "@/lib/db";

const BASE = "https://www.isaacpaha.com";

// Static routes with manually tuned SEO priorities
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  // Core — crawled frequently, highest authority
  { url: BASE,                      lastModified: new Date(), changeFrequency: "daily",   priority: 1.0  },
  { url: `${BASE}/now`,             lastModified: new Date(), changeFrequency: "daily",   priority: 0.9  },
  { url: `${BASE}/blog`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.95 },
  { url: `${BASE}/apps`,            lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9  },
  { url: `${BASE}/tools`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9  },
  { url: `${BASE}/games`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
  { url: `${BASE}/ideas`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
  { url: `${BASE}/about`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.8  },
  { url: `${BASE}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
  { url: `${BASE}/ask-isaac`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.75 },
  { url: `${BASE}/newsletter`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7  },
  { url: `${BASE}/podcast`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7  },

  // Games multiplayer
  { url: `${BASE}/games/multiplayer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },

  // Static tools (each is its own indexable page)
  { url: `${BASE}/tools/ai-cv-analyser`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/smart-budget-planner`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/debt-recovery-planner`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/first-home-planner`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/job-application-tracker`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/kids-birthday-planner`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/math-engine`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/physics-engine`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/chemistry-engine`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/qr-code-generator`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/message-rewriter`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/scripture-explorer`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/smart-shopping-list`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/productivity-score`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/tools/random-toolkit`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.65 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic: MetadataRoute.Sitemap = [];

  try {
    // ── Blog posts ──────────────────────────────────────────────────────────
    const posts = await prismadb.blogPost.findMany({
      where:   { isPublished: true },
      select:  { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    posts.forEach(p => {
      dynamic.push({
        url:             `${BASE}/blog/${p.slug}`,
        lastModified:    p.updatedAt ?? p.publishedAt ?? new Date(),
        changeFrequency: "weekly",
        priority:        0.85,
      });
    });

    // ── Apps ────────────────────────────────────────────────────────────────
    const apps = await prismadb.app.findMany({
      where:  { isPublished: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []);
    apps.forEach(a => {
      dynamic.push({
        url:             `${BASE}/apps/${a.slug}`,
        lastModified:    a.updatedAt ?? new Date(),
        changeFrequency: "monthly",
        priority:        0.8,
      });
    });

    // ── Ideas ───────────────────────────────────────────────────────────────
    const ideas = await prismadb.idea.findMany({
      where:  { isPublished: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []);
    ideas.forEach(i => {
      dynamic.push({
        url:             `${BASE}/ideas/${i.slug}`,
        lastModified:    i.updatedAt ?? new Date(),
        changeFrequency: "monthly",
        priority:        0.75,
      });
    });

    // ── Tool slugs (if dynamic tool pages exist) ────────────────────────────
    const tools = await prismadb.tool?.findMany({
      where:  { isPublic: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []);
    (tools ?? []).forEach((t: { slug: string; updatedAt: Date | null }) => {
      dynamic.push({
        url:             `${BASE}/tools/${t.slug}`,
        lastModified:    t.updatedAt ?? new Date(),
        changeFrequency: "monthly",
        priority:        0.75,
      });
    });

  } catch (error) {
    // If DB is unreachable during build, log and continue with static routes
    console.error("[sitemap] DB error — returning static routes only:", error);
  }

  return [...STATIC_ROUTES, ...dynamic];
}






// // app/sitemap.ts - Generate dynamic sitemap with blog posts
// import { MetadataRoute } from 'next'
// import { getBlogPosts } from '@/lib/blog-posts'

// export default function sitemap(): MetadataRoute.Sitemap {
//   const baseUrl = 'https://www.isaacpaha.com'
  
//   // Static pages with priorities and change frequencies
//   const staticPages = [
//     { path: '', priority: 1.0, changeFrequency: 'daily' as const, lastModified: undefined },
//     { path: '/about', priority: 0.9, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/projects', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: undefined },
//     { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/blog', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: undefined },
//   ]

//   // Dynamic project pages
//   const projectPages = [
//     { path: '/projects/okadwuma', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/projects/okddwa', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/projects/ipaha-business-suite', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/projects/storeflow-pro', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/projects/devcollab-hub', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/projects/fintrack-analytics', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
//   ]

//   // Get blog posts dynamically
//   const blogPosts = getBlogPosts()
//   const blogPages = blogPosts.map(post => ({
//     path: `/blog/${post.slug}`,
//     priority: post.featured ? 0.8 : 0.7,
//     changeFrequency: 'monthly' as const,
//     lastModified: new Date(post.updatedAt || post.publishedAt)
//   }))

//   // Company pages
//   const companyPages = [
//     { path: '/companies/ipaha-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/companies/ipahastores-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
//     { path: '/companies/okpah-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
//   ]

//   const allPages = [...staticPages, ...projectPages, ...blogPages, ...companyPages]

//   return allPages.map((page) => ({
//     url: `${baseUrl}${page.path}`,
//     lastModified: page.lastModified || new Date(),
//     changeFrequency: page.changeFrequency,
//     priority: page.priority,
//   }))
// }