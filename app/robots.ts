// =============================================================================
// app/robots.ts — robots.txt
// Allows all public pages, blocks admin + API + private routes,
// signals sitemap location, and sets crawl delay for budget protection.
// =============================================================================

import type { MetadataRoute } from "next";

const BASE = "https://www.isaacpaha.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Main crawlers — allow everything public ─────────────────────────
      {
        userAgent:   ["Googlebot", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider", "YandexBot"],
        allow:       ["/"],
        disallow:    [
          "/admin/",
          "/api/",
          "/sign-in/",
          "/sign-up/",
          "/test-game",
          "/_not-found",
          "/*?*",              // Block query-string variants (duplicate content)
          "/*.json$",         // Block JSON endpoints
          "/private/",        // Any private content
          "/temp/",           // Temporary files
          "/404",             // Not found page
          "/500",             // Server error page
        ],
        crawlDelay: 1,
      },

      // ── GPTBot / AI scrapers — allow but limit ─────────────────────────
      {
        userAgent:   ["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "Claude-Web"],
        allow:       ["/blog/", "/now", "/about", "/apps/", "/ideas/", "/tools/"],
        disallow:    ["/admin/", "/api/", "/games/", "/sign-in/", "/sign-up/"],
        crawlDelay: 5,
      },

      // ── Block junk bots entirely ────────────────────────────────────────
      {
        userAgent:   ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot"],
        disallow:    ["/"],
      },
    ],

    sitemap:  `${BASE}/sitemap.xml`,
    host:     BASE,
  };
}






// // app/robots.ts - Enhanced SEO robots configuration
// import { MetadataRoute } from 'next'

// export default function robots(): MetadataRoute.Robots {
//   return {
//     rules: [
//       {
//         userAgent: '*',
//         allow: '/',
//         disallow: [
//           '/private/',
//           '/admin/',
//           '/_next/',
//           '/api/',
//           '/temp/',
//           '/*.json$',
//           '/404',
//           '/500'
//         ],
//       },
//       {
//         userAgent: 'Googlebot',
//         allow: '/',
//         disallow: ['/private/', '/admin/', '/api/contact'],
//         crawlDelay: 1,
//       },
//       {
//         userAgent: 'Bingbot',
//         allow: '/',
//         disallow: ['/private/', '/admin/'],
//         crawlDelay: 1,
//       },
//       // Allow social media crawlers
//       {
//         userAgent: 'facebookexternalhit',
//         allow: '/',
//       },
//       {
//         userAgent: 'Twitterbot',
//         allow: '/',
//       },
//       {
//         userAgent: 'LinkedInBot',
//         allow: '/',
//       },
//     ],
//     sitemap: 'https://www.isaacpaha.com/sitemap.xml',
//     host: 'https://www.isaacpaha.com',
//   }
// }