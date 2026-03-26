// =============================================================================
// app/manifest.webmanifest/route.ts  →  GET /manifest.webmanifest
// Full PWA manifest — makes site installable, improves mobile SEO signals.
// =============================================================================

export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name:             "Isaac Paha",
    short_name:       "iPaha",
    description:      "Isaac Paha — Technologist, Entrepreneur & Builder. Tools, apps, blog, games and more.",
    start_url:        "/",
    display:          "standalone",
    background_color: "#08080f",
    theme_color:      "#f59e0b",
    orientation:      "portrait-primary",
    scope:            "/",
    lang:             "en-GB",
    dir:              "ltr",
    categories:       ["technology", "productivity", "education", "entertainment"],

    icons: [
      { src: "/icons/icon-72x72.png",   sizes: "72x72",   type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-96x96.png",   sizes: "96x96",   type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" },
      { src: "/apple-touch-icon.png",   sizes: "180x180", type: "image/png", purpose: "any" },
    ],

    shortcuts: [
      {
        name:        "Blog",
        short_name:  "Blog",
        description: "Read Isaac's latest essays",
        url:         "/blog",
        icons:       [{ src: "/icons/shortcut-blog.png", sizes: "96x96" }],
      },
      {
        name:        "Tools",
        short_name:  "Tools",
        description: "Free online tools",
        url:         "/tools",
        icons:       [{ src: "/icons/shortcut-tools.png", sizes: "96x96" }],
      },
      {
        name:        "Games",
        short_name:  "Games",
        description: "Play 30 browser games",
        url:         "/game",
        icons:       [{ src: "/icons/shortcut-games.png", sizes: "96x96" }],
      },
      {
        name:        "Now",
        short_name:  "Now",
        description: "What Isaac is doing now",
        url:         "/now",
        icons:       [{ src: "/icons/shortcut-now.png", sizes: "96x96" }],
      },
    ],

    related_applications: [
      {
        platform: "webapp",
        url:      "https://www.isaacpaha.com",
      },
    ],
    prefer_related_applications: false,
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type":  "application/manifest+json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}