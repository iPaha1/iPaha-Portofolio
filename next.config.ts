import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["res.cloudinary.com", "img.clerk.com", "via.placeholder.com"],
    deviceSizes:  [640, 750, 828, 1080, 1200, 1920],
    imageSizes:   [16, 32, 48, 64, 96, 128, 256, 384],
    formats:      ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // Allow the Cloudflare tunnel domain
  allowedDevOrigins: [
    '*.trycloudflare.com',
    'meters-howto-tobago-protein.trycloudflare.com',
  ],


   // ── Core ────────────────────────────────────────────────────────────────────
  reactStrictMode:      true,
  poweredByHeader:      false,  // Don't expose "X-Powered-By: Next.js" (security)
  compress:             true,   // Gzip / Brotli compression (Core Web Vitals)
  trailingSlash:        false,  // Canonical: no trailing slash
 
  // ── Image optimisation (affects LCP — biggest SEO Core Web Vital) ──────────
  // images: {
  //   deviceSizes:  [640, 750, 828, 1080, 1200, 1920],
  //   imageSizes:   [16, 32, 48, 64, 96, 128, 256, 384],
  //   formats:      ["image/avif", "image/webp"],
  //   minimumCacheTTL: 31536000, // 1 year
  //   remotePatterns: [
  //     { protocol: "https", hostname: "res.cloudinary.com" },
  //     { protocol: "https", hostname: "img.clerk.com" },
  //     { protocol: "https", hostname: "images.unsplash.com" },
  //     { protocol: "https", hostname: "avatars.githubusercontent.com" },
  //   ],
  // },
 
  // ── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    optimizeCss:     true,    // Inline critical CSS → better FCP
    scrollRestoration: true,
  },
 
  // ── Permanent redirects ─────────────────────────────────────────────────────
  // SEO: 301 redirects pass ~100% link equity. Add old URLs here if ever changed.
  async redirects() {
    return [
      // Old URL patterns → new canonical URLs (add as needed)
      { source: "/game",     destination: "/games",    permanent: true  },
      { source: "/blog/:slug/amp", destination: "/blog/:slug", permanent: true },
      // Force www
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "isaacpaha.com" }],
        destination: "https://www.isaacpaha.com/:path*",
        permanent:   true,
      },
    ];
  },
 
  // ── HTTP headers ────────────────────────────────────────────────────────────
  // These supplement the middleware headers for static assets
  async headers() {
    return [
      // Aggressive caching for static assets
      {
        source:  "/:path(.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif|woff|woff2|ttf|eot))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // JS/CSS
      {
        source:  "/:path(.*\\.(?:js|css))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // HTML pages — no store, must revalidate
      {
        source:  "/:path*",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "SAMEORIGIN" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control",   value: "on" },
          { key: "Strict-Transport-Security",value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      // Sitemap + robots — important for Googlebot caching
      {
        source:  "/sitemap.xml",
        headers: [
          { key: "Cache-Control",  value: "public, max-age=86400, stale-while-revalidate=3600" },
          { key: "Content-Type",   value: "application/xml; charset=utf-8" },
        ],
      },
      {
        source:  "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },


};

export default nextConfig;
