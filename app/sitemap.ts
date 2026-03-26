// =============================================================================
// app/sitemap.ts — Dynamic XML Sitemap (Bulletproof Version)
//
// WHY THE PREVIOUS VERSION FAILED:
//   Google Search Console showed "Couldn't fetch" because a single uncaught
//   Prisma error (DB cold start, connection timeout, missing model) crashed
//   the entire async function — returning nothing, not even static routes.
//   Googlebot got a 500 and gave up.
//
// THIS VERSION:
//   1. Static routes are a plain constant — zero async, zero DB.
//      They are ALWAYS returned regardless of what happens below.
//   2. Each DB model is wrapped in its own try/catch so one bad query never
//      blocks the others.
//   3. The function never throws — worst case it returns only static routes.
//   4. export const dynamic = "force-dynamic" prevents Next.js from caching
//      a broken build-time result.
//   5. URLs are validated before inclusion (no undefined slugs).
//   6. Duplicate URLs are de-duped at the end.
// =============================================================================

import type { MetadataRoute } from "next";
import { prismadb }           from "@/lib/db";

export const dynamic    = "force-dynamic";
export const revalidate = 3600; // Re-generate at most once per hour

const BASE = "https://www.isaacpaha.com";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC ROUTES — plain array, zero async, ALWAYS returned
// ─────────────────────────────────────────────────────────────────────────────

const STATIC: MetadataRoute.Sitemap = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { url: BASE,                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0  },
  { url: `${BASE}/blog`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.95 },
  { url: `${BASE}/now`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.9  },
  { url: `${BASE}/apps`,          lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9  },
  { url: `${BASE}/tools`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9  },
  { url: `${BASE}/games`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
  { url: `${BASE}/ideas`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
  { url: `${BASE}/ask-isaac`,     lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8  },
  { url: `${BASE}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.8  },
  { url: `${BASE}/newsletter`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.75 },
  { url: `${BASE}/podcast`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.75 },
  { url: `${BASE}/contact`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },

  // ── Games ──────────────────────────────────────────────────────────────────
  { url: `${BASE}/games/multiplayer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },

  // ── Static tool pages ─────────────────────────────────────────────────────
  { url: `${BASE}/tools/ai-cv-analyser`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
  { url: `${BASE}/tools/smart-budget-planner`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
  { url: `${BASE}/tools/debt-recovery-planner`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
  { url: `${BASE}/tools/first-home-planner`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
  { url: `${BASE}/tools/job-application-tracker`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
  { url: `${BASE}/tools/kids-birthday-planner`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8  },
  { url: `${BASE}/tools/math-engine`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/physics-engine`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/chemistry-engine`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/qr-code-generator`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8  },
  { url: `${BASE}/tools/message-rewriter`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/scripture-explorer`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/smart-shopping-list`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
  { url: `${BASE}/tools/productivity-score`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
  { url: `${BASE}/tools/random-toolkit`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.65 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function entry(
  path:     string,
  modified: Date | string | null | undefined,
  freq:     MetadataRoute.Sitemap[0]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[0] | null {
  // Guard: reject any entry with an undefined/null slug baked into the path
  if (!path || path.includes("undefined") || path.includes("null") || path.trim() === "/") {
    return null;
  }
  return {
    url:             `${BASE}${path}`,
    lastModified:    modified ? new Date(modified) : new Date(),
    changeFrequency: freq,
    priority,
  };
}

function dedupe(items: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Map<string, MetadataRoute.Sitemap[0]>();
  for (const item of items) seen.set(item.url, item);
  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// SITEMAP EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic: (MetadataRoute.Sitemap[0] | null)[] = [];

  // ── Blog posts ─────────────────────────────────────────────────────────────
  // Wrapped independently — a DB timeout here does NOT cancel the rest
  try {
    const posts = await prismadb.blogPost.findMany({
      where:   { isPublished: true },
      select:  { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take:    500,
    });
    for (const p of posts) {
      dynamic.push(entry(`/blog/${p.slug}`, p.updatedAt ?? p.publishedAt, "weekly", 0.85));
    }
    console.log(`[sitemap] blog posts: ${posts.length}`);
  } catch (err) {
    console.error("[sitemap] blogPost query failed (non-fatal):", (err as Error).message);
  }

  // ── Apps ───────────────────────────────────────────────────────────────────
  try {
    const apps = await prismadb.app.findMany({
      where:  { isPublished: true },
      select: { slug: true, updatedAt: true },
      take:   200,
    });
    for (const a of apps) {
      dynamic.push(entry(`/apps/${a.slug}`, a.updatedAt, "monthly", 0.8));
    }
    console.log(`[sitemap] apps: ${apps.length}`);
  } catch (err) {
    console.error("[sitemap] app query failed (non-fatal):", (err as Error).message);
  }

  // ── Ideas ──────────────────────────────────────────────────────────────────
  try {
    const ideas = await prismadb.idea.findMany({
      where:  { isPublished: true },
      select: { slug: true, updatedAt: true },
      take:   200,
    });
    for (const i of ideas) {
      dynamic.push(entry(`/ideas/${i.slug}`, i.updatedAt, "monthly", 0.75));
    }
    console.log(`[sitemap] ideas: ${ideas.length}`);
  } catch (err) {
    console.error("[sitemap] idea query failed (non-fatal):", (err as Error).message);
  }

  // ── Dynamic tools (optional model) ────────────────────────────────────────
  // Uses (prismadb as any) so TypeScript doesn't error if 'tool' isn't in schema
  try {
    const tools = await (prismadb as any).tool?.findMany({
      where:  { isPublished: true },
      select: { slug: true, updatedAt: true },
      take:   100,
    });
    if (Array.isArray(tools)) {
      for (const t of tools) {
        dynamic.push(entry(`/tools/${t.slug}`, t.updatedAt, "monthly", 0.75));
      }
      console.log(`[sitemap] tools: ${tools.length}`);
    }
  } catch (err) {
    console.error("[sitemap] tool query failed (non-fatal):", (err as Error).message);
  }

  // ── Now pages ──────────────────────────────────────────────────────────────
  try {
    const latest = await prismadb.nowPage.findFirst({
      where:   { isPublished: true },
      orderBy: { updatedAt: "desc" },
      select:  { updatedAt: true },
    });
    if (latest) {
      // /now is a single page — just update its lastModified date
      const nowEntry = STATIC.find(s => s.url === `${BASE}/now`);
      if (nowEntry) nowEntry.lastModified = latest.updatedAt;
    }
  } catch (err) {
    console.error("[sitemap] nowPage query failed (non-fatal):", (err as Error).message);
  }

  // ── Assemble & return ─────────────────────────────────────────────────────
  const valid = dynamic.filter((e): e is MetadataRoute.Sitemap[0] => e !== null);
  const final = dedupe([...STATIC, ...valid]);
  console.log(`[sitemap] total entries: ${final.length}`);
  return final;
}





// // =============================================================================
// // app/sitemap.ts — Dynamic XML Sitemap
// // Covers all public routes with correct priorities and changefreq.
// // Fetches dynamic routes (blog, apps, tools, ideas) from the DB so
// // every piece of content is indexed automatically on deploy.
// // =============================================================================

// import type { MetadataRoute } from "next";
// import { prismadb } from "@/lib/db";

// const BASE = "https://www.isaacpaha.com";

// // Static routes with manually tuned SEO priorities
// const STATIC_ROUTES: MetadataRoute.Sitemap = [
//   // Core — crawled frequently, highest authority
//   { url: BASE,                      lastModified: new Date(), changeFrequency: "daily",   priority: 1.0  },
//   { url: `${BASE}/now`,             lastModified: new Date(), changeFrequency: "daily",   priority: 0.9  },
//   { url: `${BASE}/blog`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.95 },
//   { url: `${BASE}/apps`,            lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9  },
//   { url: `${BASE}/tools`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9  },
//   { url: `${BASE}/games`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
//   { url: `${BASE}/ideas`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
//   { url: `${BASE}/about`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.8  },
//   { url: `${BASE}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
//   { url: `${BASE}/ask-isaac`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.75 },
//   { url: `${BASE}/newsletter`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7  },
//   { url: `${BASE}/podcast`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7  },

//   // Games multiplayer
//   { url: `${BASE}/games/multiplayer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },

//   // Static tools (each is its own indexable page)
//   { url: `${BASE}/tools/ai-cv-analyser`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
//   { url: `${BASE}/tools/smart-budget-planner`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
//   { url: `${BASE}/tools/debt-recovery-planner`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
//   { url: `${BASE}/tools/first-home-planner`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
//   { url: `${BASE}/tools/job-application-tracker`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
//   { url: `${BASE}/tools/kids-birthday-planner`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
//   { url: `${BASE}/tools/math-engine`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/physics-engine`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/chemistry-engine`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/qr-code-generator`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/message-rewriter`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/scripture-explorer`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/smart-shopping-list`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
//   { url: `${BASE}/tools/productivity-score`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
//   { url: `${BASE}/tools/random-toolkit`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.65 },
// ];

// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   const dynamic: MetadataRoute.Sitemap = [];

//   try {
//     // ── Blog posts ──────────────────────────────────────────────────────────
//     const posts = await prismadb.blogPost.findMany({
//       where:   { isPublished: true },
//       select:  { slug: true, updatedAt: true, publishedAt: true },
//       orderBy: { publishedAt: "desc" },
//     });
//     posts.forEach(p => {
//       dynamic.push({
//         url:             `${BASE}/blog/${p.slug}`,
//         lastModified:    p.updatedAt ?? p.publishedAt ?? new Date(),
//         changeFrequency: "weekly",
//         priority:        0.85,
//       });
//     });

//     // ── Apps ────────────────────────────────────────────────────────────────
//     const apps = await prismadb.app.findMany({
//       where:  { isPublished: true },
//       select: { slug: true, updatedAt: true },
//     }).catch(() => []);
//     apps.forEach(a => {
//       dynamic.push({
//         url:             `${BASE}/apps/${a.slug}`,
//         lastModified:    a.updatedAt ?? new Date(),
//         changeFrequency: "monthly",
//         priority:        0.8,
//       });
//     });

//     // ── Ideas ───────────────────────────────────────────────────────────────
//     const ideas = await prismadb.idea.findMany({
//       where:  { isPublished: true },
//       select: { slug: true, updatedAt: true },
//     }).catch(() => []);
//     ideas.forEach(i => {
//       dynamic.push({
//         url:             `${BASE}/ideas/${i.slug}`,
//         lastModified:    i.updatedAt ?? new Date(),
//         changeFrequency: "monthly",
//         priority:        0.75,
//       });
//     });

//     // ── Tool slugs (if dynamic tool pages exist) ────────────────────────────
//     const tools = await prismadb.tool?.findMany({
//       where:  { isPublic: true },
//       select: { slug: true, updatedAt: true },
//     }).catch(() => []);
//     (tools ?? []).forEach((t: { slug: string; updatedAt: Date | null }) => {
//       dynamic.push({
//         url:             `${BASE}/tools/${t.slug}`,
//         lastModified:    t.updatedAt ?? new Date(),
//         changeFrequency: "monthly",
//         priority:        0.75,
//       });
//     });

//   } catch (error) {
//     // If DB is unreachable during build, log and continue with static routes
//     console.error("[sitemap] DB error — returning static routes only:", error);
//   }

//   return [...STATIC_ROUTES, ...dynamic];
// }






// // // app/sitemap.ts - Generate dynamic sitemap with blog posts
// // import { MetadataRoute } from 'next'
// // import { getBlogPosts } from '@/lib/blog-posts'

// // export default function sitemap(): MetadataRoute.Sitemap {
// //   const baseUrl = 'https://www.isaacpaha.com'
  
// //   // Static pages with priorities and change frequencies
// //   const staticPages = [
// //     { path: '', priority: 1.0, changeFrequency: 'daily' as const, lastModified: undefined },
// //     { path: '/about', priority: 0.9, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/projects', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: undefined },
// //     { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/blog', priority: 0.9, changeFrequency: 'weekly' as const, lastModified: undefined },
// //   ]

// //   // Dynamic project pages
// //   const projectPages = [
// //     { path: '/projects/okadwuma', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/projects/okddwa', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/projects/ipaha-business-suite', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/projects/storeflow-pro', priority: 0.8, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/projects/devcollab-hub', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/projects/fintrack-analytics', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
// //   ]

// //   // Get blog posts dynamically
// //   const blogPosts = getBlogPosts()
// //   const blogPages = blogPosts.map(post => ({
// //     path: `/blog/${post.slug}`,
// //     priority: post.featured ? 0.8 : 0.7,
// //     changeFrequency: 'monthly' as const,
// //     lastModified: new Date(post.updatedAt || post.publishedAt)
// //   }))

// //   // Company pages
// //   const companyPages = [
// //     { path: '/companies/ipaha-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/companies/ipahastores-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
// //     { path: '/companies/okpah-ltd', priority: 0.7, changeFrequency: 'monthly' as const, lastModified: undefined },
// //   ]

// //   const allPages = [...staticPages, ...projectPages, ...blogPages, ...companyPages]

// //   return allPages.map((page) => ({
// //     url: `${baseUrl}${page.path}`,
// //     lastModified: page.lastModified || new Date(),
// //     changeFrequency: page.changeFrequency,
// //     priority: page.priority,
// //   }))
// // }